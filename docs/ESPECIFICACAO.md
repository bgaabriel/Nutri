# NutriPro Clínico — Especificação da versão 2

Documento de trabalho para o Claude Code. Cada item traz **o que mudar**, **onde** (arquivos e trechos do código atual) e **como conferir** (critério de aceite). Os números 1 a 14 seguem o briefing do Gabriel; os itens `E1`–`E6` são correções extras encontradas na análise do código.

A correção do item 13 (impressão) já foi prototipada e testada numa cópia do projeto: veja `docs/impressao-antes-depois.png` (página 1 do cardápio antes e depois).

> Referências de linha valem para o código **antes** de qualquer alteração. Depois do primeiro commit, localize pelos trechos de texto citados.

---

## Ordem de execução

Faça em fases, com `npm run lint` e `npm run build` passando e um commit ao final de cada item.

| Fase | Itens | Precisa do Supabase? |
|---|---|---|
| 0. Preparação | limpeza de código morto | não |
| A. Interface e duplicidades | 14, 3, 4, 5 (botões), 2, E1, E2, E5, E6 | não |
| B. Funcionalidades clínicas | 5 (campos), 6, 7, 8, 9, 10, 11 | não |
| C. Impressão | 13 | não |
| D. Tabela TACO | 12 | não (usa JSON local; migra para o banco na fase E) |
| E. Supabase, login e dados na nuvem | 1, E3, E4 | **sim** — precisa de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env.local` |

Se as chaves do Supabase ainda não existirem ao chegar na fase E, pare e peça ao usuário (ver `supabase/LEIA-ME.md`).

---

## Fase 0 — Preparação

1. `git init` (se ainda não for repositório) e commit do estado original.
2. Remover código morto (nenhum destes é usado na tela; confirme com `grep` antes de apagar):
   - `src/components/ModalBackup.tsx`, `ModalNovoPaciente.tsx`, `ModalPerfilProfissional.tsx`, `PrintReport.tsx`, `CalendarAgendaView.tsx` (importado em `App.tsx:32`, mas nunca renderizado)
   - `src/data/mockPatients.ts`, `src/utils/nutritionCalculations.ts`, `src/types/nutrition.ts`
3. `App.tsx` passa props duplicadas ao `AppointmentModal` (`appointmentToEdit`/`appointment`, `defaultDate`/`initialDate`, `onSave`/`onSaveAppointment`, `onDelete`/`onDeleteAppointment`) e ao `ProfileModal` (`onSaveProfile`/`onSave`). Deixe um nome só para cada.
4. Dependências sem uso: `@google/genai`, `express`, `dotenv`, `@types/express`. Remova do `package.json` (podem voltar quando houver IA de verdade).
5. Renomear `package.json > name` de `react-example` para `nutripro-clinico`.

---

## Fase A — Interface e duplicidades

### Item 14 — Tirar o balão "Offline 100% Ativo"
- **Onde:** `App.tsx`, bloco `{/* Offline Mode Indicator Badge */}` (linhas ~582–614), no rodapé da barra lateral.
- **O que fazer:** remover o balão inteiro. Os botões **Backup** e **Restaurar** que moram dentro dele vão para o modal de perfil (ver item 2). Tirar também o texto "100% Salvos Offline" do card de KPI (`OverviewDashboard.tsx:459`) — esse card sai no item 2 de qualquer forma.
- **Regra geral:** o app não pode afirmar "offline", "criptografado" ou "100% seguro" em nenhum lugar. Depois da fase E os dados ficam no Supabase; qualquer texto sobre armazenamento deve descrever isso com precisão (ex.: "Dados armazenados no servidor com acesso restrito à sua conta").
- **Aceite:** `grep -rni "offline\|criptograf" src` não encontra textos visíveis ao usuário.

### Item 3 — Botões repetidos em "Agenda & Calendário" e "Pacientes"
Regra do briefing: **quando o mesmo botão aparece no cabeçalho da página (topo, `App.tsx`) e dentro do conteúdo, fica só o de dentro.**

- **Pacientes:** remover o "Novo Paciente" do cabeçalho (`App.tsx:685–693`). Fica o "Cadastrar Novo Paciente" de `PatientsDirectoryView.tsx:98–104`. O botão do estado vazio (`PatientsDirectoryView.tsx:230–235`) pode ficar só quando **não houver nenhum paciente cadastrado**; se a lista está vazia por causa da busca, mostre apenas a mensagem.
- **Panorama & Calendário:** remover "Novo Paciente" e "Agendar Consulta" do cabeçalho (`App.tsx:757–774`). Fica o "Agendar" da barra de ferramentas do calendário (`OverviewDashboard.tsx:627–634`), que já usa a data selecionada.
- **Duplicidades internas do calendário** (mesma função, lado a lado ou na mesma área), manter só o botão "Agendar" da barra de ferramentas e remover:
  - visão Dia: "Agendar para este dia" (`OverviewDashboard.tsx:664–671`) e o "+ Agendar Consulta Agora" do estado vazio (`:683–688`);
  - visão Semana: "Nova Consulta" do cabeçalho da semana (`:815–822`) e o link "Agendar" dentro do dia vazio (`:880–886`). **Manter** o "Agendar" do rodapé de cada coluna de dia (`:933–939`), porque ele já vem com aquele dia preenchido;
  - visão Mês: "Agendar neste dia" (`:1048–1054`) e "+ Marcar Consulta Aqui" (`:1066–1071`).
- **"Hoje" duplicado:** existe o filtro de período "Hoje" (`:489–502`) e um botão "Hoje" separado (`:604–610`, que só volta o cursor para a data atual). Renomeie o filtro de período para **"Dia"** e mantenha o botão "Hoje".
- **Aceite:** em cada tela, nenhum rótulo de ação ("Novo Paciente", "Agendar", "Nova Consulta"…) aparece duas vezes ao mesmo tempo.

### Item 4 — "Novo Paciente" abre direto o cadastro
- **Onde:** `src/components/PatientsModal.tsx`. Hoje o mesmo modal serve para **trocar paciente** (lista + busca) e **cadastrar** (formulário), e abre sempre na lista ("Gerenciar Pacientes").
- **O que fazer:**
  - Adicionar a prop `modo: 'cadastrar' | 'selecionar'`. Em `cadastrar`, o modal abre direto no formulário com o título "Cadastrar Novo Paciente", **sem** lista, sem busca e sem sugestões de pacientes existentes. Em `selecionar`, mostra só a lista com busca (usado por "Trocar Paciente").
  - No `App.tsx`, trocar `isPatientsModalOpen: boolean` por `patientsModalMode: null | 'cadastrar' | 'selecionar'`. "Cadastrar Novo Paciente" abre com `'cadastrar'`; "Trocar Paciente" abre com `'selecionar'`.
  - Corrigir o bug do `handleCreate` (`PatientsModal.tsx:40–62`): ele chama `onAddPatient` (que já seleciona o paciente e abre a **Anamnese**) e depois `onSelectPatient` (que joga para **Antropometria**). Chame só `onAddPatient`; o paciente novo deve cair na aba **1. Dados & Anamnese**.
  - Fechar o modal depois de salvar.
- **Aceite:** clicar em "Cadastrar Novo Paciente" abre o formulário vazio na hora; salvar leva ao prontuário do paciente novo, na Anamnese.

### Item 5 (parte 1) — Botões repetidos no prontuário, e no site inteiro
Hoje, no prontuário, os mesmos botões aparecem em três lugares: no cabeçalho (`App.tsx:695–755`: Trocar Paciente, Salvar Consulta, Imprimir Cardápio, Imprimir Relatório, PDF de Toda a Evolução), na faixa do paciente (`PatientRecordView.tsx:115–172`: os mesmos cinco) e, em parte, dentro das abas.

Regra: **as ações do prontuário ficam só na faixa do paciente, dentro da página (`PatientRecordView`)**. Remover:
- o bloco inteiro de botões do cabeçalho no modo prontuário (`App.tsx:695–755`). O cabeçalho mostra apenas o título da tela; o nome do paciente já aparece na faixa, então **tire também o nome e a seta de voltar do cabeçalho** (`App.tsx:656–680`) e use o título "Prontuário";
- o botão "PDF de Toda a Evolução" da faixa (`PatientRecordView.tsx:163–171`): ele só abre a aba 7, que já existe nas abas de etapas;
- em `ComparativeTab.tsx:303–321`: "Gerar PDF da Evolução" e "Salvar Consulta no Histórico" (repetem ações da faixa);
- no rodapé da aba Comparativo, "Ver PDF da Evolução" (`PatientRecordView.tsx:400–406`);
- em `MealPlannerTab.tsx:264–270`: "Imprimir Cardápio (PDF)" (repete "Imprimir Cardápio" da faixa);
- na barra lateral, o cartão "Prontuário em Aberto" (`App.tsx:538–577`) tem "Ver Todos" e "Trocar", que repetem "Lista de Pacientes" e "Trocar Paciente" da faixa. Mantenha o cartão só como informação (nome, idade, sexo), sem os botões.

Depois disso, faça uma **varredura no site inteiro**: para cada tela, liste os botões visíveis e elimine qualquer par com a mesma função na mesma tela, sempre mantendo o que está dentro do conteúdo. Registre o que foi removido na mensagem do commit.

- **Aceite:** no prontuário, "Salvar Consulta", "Trocar Paciente", "Imprimir Cardápio" e "Imprimir Relatório" aparecem **uma vez** cada, em qualquer aba.

### Item 2 — Panorama & Calendário limpo; números do consultório vão para "Relatórios" no perfil
A fusão de Panorama com Agenda & Calendário **já foi feita** nesta versão do código (menu "Panorama & Calendário", componente `OverviewDashboard.tsx`). Falta:

- **Banner de boas-vindas** (`OverviewDashboard.tsx:369–394`): deixar só **"Olá, {nome do profissional}!"** e a linha com clínica e CRN. Remover o parágrafo "Este é o panorama geral… {n} pacientes sob acompanhamento clínico".
- **Cards de KPI** (`:396–466`): remover **"Pacientes Cadastrados"** (Metric 3) e **"Prontuários Gravados"** (Metric 4). Manter "Consultas Hoje" e "Próximos 7 Dias" em grade de 2 colunas.
- Se ainda existir algum painel "Pacientes no Consultório" ou "Segurança Offline & Prontuário" (existiam em versões anteriores), remover.
- **Relatórios no perfil:** no `ProfileModal.tsx`, adicionar uma seção **"Relatórios do consultório"** com um botão **"Ver relatório do consultório"** que abre uma tela/modal nova (`ConsultorioReportView.tsx`) com:
  - total de pacientes cadastrados;
  - total de prontuários (consultas) gravados;
  - pacientes em acompanhamento: lista com nome, objetivo, nº de consultas e data da última consulta;
  - consultas por mês (últimos 6 meses) — tabela simples ou gráfico de barras com Recharts;
  - informação sobre o armazenamento dos dados, com texto fiel à realidade (ver regra do item 14).
- No mesmo `ProfileModal`, uma seção **"Backup"** com os botões **Exportar backup (JSON)** e **Restaurar backup**, que saíram da barra lateral no item 14. Depois da fase E, "Restaurar" importa o JSON para o Supabase da conta logada.
- **Aceite:** o Panorama mostra saudação, 2 KPIs e o calendário; os números do consultório só aparecem pelo perfil → "Ver relatório do consultório".

### E1 — Data de "hoje" errada à noite (fuso horário)
- **Problema:** o app calcula "hoje" com `new Date().toISOString().split('T')[0]`, que devolve a data em **UTC**. No Brasil (UTC−3), a partir das 21h o sistema já considera o dia seguinte: a agenda de "hoje" mostra os atendimentos de amanhã e novos agendamentos vêm com a data errada.
- **Onde:** `OverviewDashboard.tsx:54` e `:133`, `App.tsx:387` e `:507`, `PatientsModal.tsx:53`, e qualquer outro `toISOString().split('T')[0]` (`grep` para achar todos).
- **O que fazer:** criar `src/utils/date.ts` com `hojeLocalISO()` e `dataLocalISO(d: Date)` usando `getFullYear/getMonth/getDate` e substituir todos os usos.
- **Aceite:** com o relógio do sistema em 22h (America/Sao_Paulo), "Hoje" mostra a data local correta.

### E2 — VET com casas decimais demais
- A faixa do paciente mostra "VET Meta 2392.3125 kcal" (`PatientRecordView.tsx:238`). Usar `Math.round(calculatedMetrics.vet)`. Conferir o mesmo em relatórios e impressões.

### E5 — Cardápio ignora a prescrição da aba 3 (importante)
- **Problema:** `MealPlannerTab.tsx:36–79` e `PrintMealPlanView.tsx:19–31` leem as metas de `consultation.calculated`. Esse campo só é preenchido **quando a consulta é salva** (`App.tsx:319–338`). Durante o atendimento (consulta em edição), ele não existe, e o cardápio usa valores fixos: **2000 kcal**, proteína 2,0 g/kg, carboidrato 3,0 g/kg e gordura 0,8 g/kg, sem relação com o que foi prescrito na aba "3. Gasto Energético & VET". Ao carregar uma consulta antiga, usa os valores da época, mesmo depois de editados.
- **O que fazer:** passar `calculatedMetrics` (já calculado ao vivo em `App.tsx:311`) como prop para `MealPlannerTab`, `PrintMealPlanView`, `PrintReportView` e `PrintEvolutionReportView`, e usar essa fonte para metas de kcal e macros. `consultation.calculated` fica só como registro histórico de consultas já salvas (usado no comparativo).
- **Aceite:** mudar o fator de atividade na aba 3 altera na hora as metas mostradas na aba 4 (cardápio), sem precisar salvar.

### E6 — "Meta Calórica" impressa mostra o total do cardápio
- **Problema:** em `PrintMealPlanView.tsx:112–118`, o campo rotulado **"Meta Calórica"** exibe `totals.kcal`, que é a **soma dos alimentos do cardápio**, e não a meta. A variável `targetKcal` (linha 31) é calculada e nunca usada. Na impressão de teste saiu "Meta Calórica 1713 kcal" para um paciente com VET de 2468 kcal.
- **O que fazer:** mostrar dois valores com rótulos claros: **"Meta (VET)"** = `Math.round(calculatedMetrics.vet)` e **"Total do cardápio"** = `Math.round(totals.kcal)`. Revisar os outros campos de meta dessa faixa (proteínas, carboidratos) com a mesma lógica.

---

## Fase B — Funcionalidades clínicas

> Todos os campos novos são **opcionais** nos tipos (`?`), com valor padrão na leitura, para que consultas já salvas continuem abrindo sem erro. Atualize também os dados de exemplo em `storage.ts` e os dois modelos de consulta nova em `App.tsx:125–177` e `:201–253`.

### Item 5 (parte 2) — Trabalho do paciente e Recordatório Alimentar na Anamnese
- **Tipos (`types.ts > Anamnesis`):** adicionar
  - `occupation?: string` — profissão/trabalho;
  - `workRoutine?: string` — rotina de trabalho (turno, carga horária, se trabalha sentado/em pé, se come fora);
  - `foodRecall?: string` — recordatório alimentar (texto livre, descritivo).
- **Tela (`AnamnesisTab.tsx`):**
  - na seção "2. Anamnese & Estilo de Vida", logo no início: campo **"Profissão / Trabalho"** (input) e **"Rotina de trabalho"** (input, placeholder "Ex: Escritório 8h–18h, sentado, almoça fora");
  - nova seção **"3. Recordatório Alimentar"** (antes de Exames Laboratoriais, que vira seção 4), com um `textarea` grande (mínimo 10 linhas, redimensionável na vertical), rótulo "Descrição do recordatório (24h ou dia habitual)" e placeholder com exemplo por refeição e horário ("07h — Café da manhã: 1 pão francês com manteiga, café com açúcar…").
- **Relatório impresso (`PrintReportView.tsx`) e PDF da evolução:** mostrar profissão, rotina de trabalho e o recordatório (texto com quebras de linha preservadas — `whitespace-pre-wrap`).
- **Aceite:** os três campos salvam, reabrem ao carregar a consulta e aparecem no relatório impresso.

### Item 6 — Peso habitual abaixo do IMC
- **Tipos (`types.ts > Anthropometry`):** adicionar `usualWeight?: number` (kg).
- **Tela (`AnthropometryTab.tsx:91–103`):** logo abaixo do bloco do IMC, uma linha com:
  - campo **"Peso Habitual (kg)"** (input numérico, passo 0,1);
  - ao lado, a **variação em relação ao peso habitual**: `((peso atual − peso habitual) / peso habitual) × 100`, com sinal e 1 casa (ex.: "−6,2% em relação ao habitual"). Só mostrar quando os dois pesos forem > 0.
- **Relatório:** incluir peso habitual e variação na tabela de antropometria.
- **Aceite:** digitar peso atual 80 e habitual 85 mostra "−5,9%".

### Item 7 — Circunferência do peito
- **Tipos (`types.ts > Circumferences`):** adicionar `chest?: number` (cm).
- **Tela (`AnthropometryTab.tsx:106–180`):** novo campo **"Peito / Tórax"** como **primeiro** item da grade "Circunferências Corporais (cm)" (antes de Pescoço). A grade passa de 7 para 8 colunas (`md:grid-cols-8`, ou `md:grid-cols-4` em duas linhas se ficar apertado).
- **Onde mais aparece:** tabela comparativa (`ComparativeTab.tsx`, perto da linha 736, onde está `calf`), `PrintReportView.tsx` (tabela de circunferências, perto da linha 203) e `PrintEvolutionReportView.tsx`.
- Não entra em nenhuma fórmula de gordura existente (os protocolos atuais usam pescoço, cintura/abdômen e quadril).

### Item 8 — Equação de Tinsley no Gasto Energético
- **Fórmulas** (Tinsley, Graybeal & Moore, 2019, *Appl Physiol Nutr Metab* 44(4):397–406, desenvolvidas em atletas de físico/musculação):
  - **Tinsley (peso corporal):** `TMB = 24,8 × peso (kg) + 10`
  - **Tinsley (massa livre de gordura):** `TMB = 25,9 × MLG (kg) + 284`, usando `leanMassKg` já calculado em `calculations.ts:130`; só disponível quando houver % de gordura calculado (igual à Cunningham).
  - Coloque as duas fórmulas em constantes nomeadas com a referência em comentário, para facilitar a conferência.
- **Tipos:** `BmrFormula` ganha `'tinsley_peso' | 'tinsley_mlg'`; `CalculatedMetrics` ganha `bmrTinsleyPeso: number` e `bmrTinsleyMlg?: number`.
- **Cálculo (`calculations.ts:132–174`):** calcular as duas e incluir na escolha de `chosenBmr`.
- **Tela (`MetabolismTab.tsx`):** duas linhas novas na tabela de equações, com etiqueta "Atletas / Hipertrofia" e indicação clínica "Praticantes de musculação e atletas de físico". Botão "Adotar" igual às outras. Adicionar as duas opções no select "Fórmula Adotada".
- **Relatórios:** onde a fórmula adotada é exibida por nome, incluir os nomes novos.
- **Aceite:** peso 80 kg → Tinsley (peso) = 1994 kcal; MLG 65 kg → Tinsley (MLG) = 1968 kcal.

### Item 9 — Fator de Atividade com setas em vez de lista
- **Onde:** `MetabolismTab.tsx:178–211` (select de presets + campo manual).
- **O que fazer:** substituir por um **seletor compacto** (componente `ActivityFactorStepper.tsx`):
  - `[ ◀ ]  [ 1.55 ]  [ ▶ ]` — o valor do meio é um input que aceita digitação direta;
  - as setas somam/subtraem **0,10**; limites **1,00 a 2,00**; ao passar do limite, trava no limite;
  - valor digitado fora da faixa é ajustado para o limite ao sair do campo (`onBlur`); aceitar vírgula ou ponto;
  - exibir sempre com 2 casas (`1.55`, `1.60`);
  - segurar a seta (pressionar e manter) repete o passo — opcional, mas desejável;
  - abaixo, uma legenda que muda conforme o valor: `< 1,40` Sedentário · `1,40–1,59` Levemente ativo · `1,60–1,79` Moderadamente ativo · `1,80–1,99` Muito ativo · `2,00` Extremamente ativo.
- **Tipos:** `activityFactorPreset` deixa de ser usado. Mantenha o campo como opcional só para ler consultas antigas; o valor que vale é `activityFactor`.
- **Aceite:** em 1.55, clicar ▶ três vezes dá 1.85; digitar 2.4 e sair do campo vira 2.00.

### Item 10 — Macronutrientes em gramas (g/kg) ou em porcentagem
- **Onde:** `MetabolismTab.tsx:294–449` (seção "7. Prescrição de Macronutrientes") e `calculations.ts:179–191`.
- **Tipos (`EnergyPrescription`):** adicionar
  - `proteinMode?: 'gkg' | 'percent'`, `carbMode?: …`, `fatMode?: …` (padrão `'gkg'`);
  - `proteinPercent?: number`, `carbPercent?: number`, `fatPercent?: number` (% do VET).
- **Tela:** em cada card (Proteínas, Carboidratos, Gorduras), um seletor de duas opções **"g/kg" | "%"** acima do campo. Em `g/kg`, o campo é o atual. Em `%`, o campo é a porcentagem do VET. Nos dois modos, mostrar abaixo os **dois** valores equivalentes: gramas totais, g/kg e % do VET.
- **Cálculo:**
  - modo `gkg`: `gramas = gkg × peso` (como hoje);
  - modo `percent`: `gramas = (VET × percent / 100) / kcal_por_grama` (4 para PTN e CHO, 9 para LIP);
  - manter a regra atual de carboidrato "completar o VET" quando o valor for 0.
- **Validação:** se os três estiverem em `%` e a soma for diferente de 100%, mostrar aviso em âmbar "A soma das porcentagens está em X%". A barra "Diferença p/ VET" que já existe continua valendo para os modos misturados.
- **Aceite:** VET 2000 kcal, proteína em 25% → 125 g; alternar o card para g/kg mostra o g/kg equivalente ao peso do paciente.

### Item 11 — Lanche da Manhã no cardápio
- **Onde:** `src/data/tacoFoods.ts > createDefaultMealPlan` (linhas ~1399–1458) e `MealPlannerTab.tsx > handleAddMeal` (linhas ~82–94).
- **O que fazer:**
  - no cardápio modelo, inserir a refeição **"Lanche da Manhã"**, horário **10:00**, entre "Café da Manhã" (07:30) e "Almoço" (12:30), com uma sugestão simples (ex.: 1 fruta + 1 porção de oleaginosa) e substituições, no mesmo padrão das outras;
  - no cardápio já existente de um paciente, oferecer o botão **"+ Lanche da Manhã"** quando o plano não tiver nenhuma refeição com esse nome: ele insere a refeição vazia às 10:00;
  - ao adicionar qualquer refeição, **ordenar as refeições por horário** (hoje a nova vai sempre para o fim da lista), e reordenar também quando o usuário alterar o horário de uma refeição;
  - a impressão do cardápio segue a mesma ordem.
- **Aceite:** um cardápio modelo novo tem 6 refeições na ordem Café → Lanche da Manhã → Almoço → Lanche da Tarde → Jantar → Ceia.

---

## Fase C — Impressão

### Item 13 — A primeira página da impressão sai em branco com o nome do paciente
- **Problema (reproduzido):** ao clicar em "Imprimir Cardápio" ou "Imprimir Relatório", a **página 1** do PDF sai só com a faixa do paciente (breadcrumb, botões, nome, idade, objetivo, peso/IMC/%G/VET) e as abas de etapas; o documento de verdade começa **na página 2**. Causas:
  1. a faixa do paciente e a barra de abas em `PatientRecordView.tsx` (linhas 100–267) e os botões de navegação entre etapas não têm a classe `no-print`, então são impressos;
  2. a folha inteira do documento usa `.card-print`, que tem `page-break-inside: avoid` (`index.css`, bloco `@media print`). Como a folha é maior que uma página, o navegador a empurra para a página seguinte, e sobra uma página 1 só com a faixa.
- **O que fazer:**
  - aplicar `no-print` na faixa do paciente, na barra de abas e nos botões "Voltar/Avançar" de `PatientRecordView.tsx`;
  - no contêiner **externo** dos documentos (`PrintMealPlanView.tsx:66`, o equivalente em `PrintReportView.tsx` e `PrintEvolutionReportView.tsx`), trocar `card-print` por uma classe nova `print-doc` **sem** `page-break-inside: avoid` e sem margem/borda/sombra na impressão. Manter o `avoid` apenas em blocos internos pequenos (cada refeição, cada tabela);
  - em `@media print`, garantir `main { overflow: visible !important; }` e `min-height: auto` nos contêineres com `min-h-screen`/`overflow-y-auto`, para não cortar conteúdo;
  - o cabeçalho do documento (clínica, profissional, CRN) e o bloco **"Paciente: {nome}"** devem ficar no topo da **primeira** página impressa;
  - o nome do paciente também deve aparecer no rodapé de cada página (via elemento `position: fixed; bottom: 0` só na impressão, ou repetido no cabeçalho de tabela), para identificar folhas soltas.
- **Aceite automatizado:** com Playwright, abrir o prontuário de um paciente, acionar "Imprimir Cardápio" (substituir `window.print` por função vazia no teste), gerar `page.pdf({ format: 'A4' })` e verificar que o **texto da página 1** contém o nome da clínica e o nome do paciente e **não** contém "Trocar Paciente" nem "Salvar Consulta". Repetir para "Imprimir Relatório" e para a aba "7. PDF de Toda a Evolução". O script de referência está em `docs/teste-impressao.mjs`.

---

## Fase D — Tabela TACO completa

### Item 12 — Toda a Tabela TACO na base do aplicativo
- **Hoje:** `src/data/tacoFoods.ts` tem **66** alimentos escritos à mão, e alguns nem existem na TACO (whey, creatina, chia, quinoa, tilápia…), apesar de o comentário dizer "Base oficial da Tabela TACO".
- **Dados já preparados nesta pasta:**
  - `src/data/taco/taco_completa.json` — os **597 alimentos** da TACO 4ª edição (NEPA/UNICAMP, 2011), valores por 100 g, com os 15 grupos oficiais. Conferidos contra a planilha original. Para 4 itens a TACO original não traz os valores ("*"): estão com `dadosIncompletos: true`;
  - `src/data/taco/alimentos_complementares.json` — os **17** alimentos do app antigo que não existem na TACO, no grupo "Complementares (não-TACO)", com os valores antigos e a observação de que precisam ser conferidos no rótulo/fonte;
  - `src/data/taco/mapa_ids_antigos.json` — mapa `id antigo → id novo` (`taco-14` → `taco-410`, `taco-63` → `comp-63`…). As medidas caseiras e porções que já existiam foram levadas para os alimentos correspondentes; nos demais, porção = 100 g e medida = "100 g";
  - `scripts/gerar_seed_taco.py` — gera a migration `supabase/migrations/20260926120100_alimentos_taco.sql` a partir dos dois JSON (614 linhas: 597 + 17).
- **O que fazer:**
  - `TacoFoodItem` (`types.ts:74–92`) ganha os campos opcionais `tacoNumero`, `fonte`, `zinco100g`, `colesterol100g`, `umidade100g`, `dadosIncompletos`;
  - `tacoFoods.ts` passa a exportar `TACO_FOODS` = `taco_completa.json` + `alimentos_complementares.json` (import JSON do Vite; ativar `"resolveJsonModule": true` no `tsconfig.json`), e `TACO_CATEGORIES` = `'Todos'` + os grupos presentes nos dados, na ordem da TACO, com "Complementares (não-TACO)" por último. Apagar a lista escrita à mão;
  - atualizar os ids usados em `createDefaultMealPlan` pelo `mapa_ids_antigos.json`;
  - ao abrir consultas salvas, converter `tacoId` antigo pelo mapa (função `migrarTacoId`), para os cardápios antigos continuarem apontando para o alimento certo;
  - **busca:** com 614 itens, a busca por nome deve ignorar acentos e maiúsculas (`normalize('NFD')`), aceitar termos fora de ordem ("frango grelhado" encontra "Frango, peito, sem pele, grelhado") e mostrar no máximo 50 resultados por vez, com a contagem total;
  - no modal de alimentos, mostrar a fonte ("TACO nº 410" ou "Complementar") e um aviso quando `dadosIncompletos` for verdadeiro;
  - **na fase E**, a fonte da verdade passa a ser a tabela `alimentos_taco` do Supabase: carregar uma vez após o login e guardar em memória. O JSON local continua como reserva se a consulta falhar.
- **Aceite:** o modal mostra "614 alimentos"; buscar "feijao carioca" encontra "Feijão, carioca, cozido" (76 kcal, 4,8 g PTN); o cardápio modelo abre sem nenhum alimento faltando.

---

## Fase E — Supabase, login e dados na nuvem

### Item 1 — Projeto Supabase e página de login do nutricionista
**Arquivos prontos nesta pasta:**
- `supabase/migrations/20260926120000_schema_inicial.sql` — tabelas `profissionais`, `pacientes`, `consultas`, `agendamentos`, com RLS (cada nutricionista só vê os próprios dados) e um gatilho que cria o perfil do profissional no cadastro. **Testado** em Postgres 16 com `auth` simulado: isolamento entre duas contas, bloqueio de CPF duplicado, bloqueio de troca de CPF/CRN pelo app e nenhum acesso sem login;
- `supabase/migrations/20260926120100_alimentos_taco.sql` — tabela `alimentos_taco` com os 614 alimentos (leitura só para usuários logados);
- `supabase/functions/login-identificador/index.ts` — função que permite o login por CPF ou CRN (verificada com `deno check`);
- `supabase/LEIA-ME.md` — como criar o projeto, aplicar as migrations e publicar a função.

**Login (tela nova `src/pages/LoginPage.tsx`):**
- É a primeira tela quando não há sessão. Nada do app é renderizado sem sessão.
- Três abas: **E-mail** | **CPF** | **CRN**, todas com o campo **Senha**.
  - E-mail → `supabase.auth.signInWithPassword({ email, password })` direto.
  - CPF → máscara `000.000.000-00`, validação dos dígitos verificadores antes de enviar; chama a função `login-identificador` com `{ tipo: 'cpf', cpf, senha }`.
  - CRN → select da região (**CRN-1 a CRN-11**) + campo do número (aceita sufixo `/P` de inscrição provisória); chama a função com `{ tipo: 'crn', crnRegiao, crnNumero, senha }`. O número e a região são campos separados porque "CRN-1 145920" e "CRN-11 45920" ficariam iguais se digitados juntos.
  - Resposta da função: `{ access_token, refresh_token }` → `supabase.auth.setSession(...)`.
- Mensagem de erro única e genérica ("Credenciais inválidas…"), sem dizer se o CPF/CRN existe.
- Link **"Esqueci minha senha"** → `supabase.auth.resetPasswordForEmail` (pede o e-mail) e tela de nova senha no retorno (`/redefinir-senha`, com `supabase.auth.updateUser({ password })`).
- Link **"Criar conta"** → `src/pages/SignUpPage.tsx` com: nome completo, e-mail, CPF (validado), CRN (região + número), senha e confirmação (mínimo 8 caracteres). Chama `supabase.auth.signUp({ email, password, options: { data: { nome, cpf, crn_regiao, crn_numero } } })`; o gatilho do banco cria o perfil. Se o CPF ou o CRN já existir, o Supabase devolve erro de banco. Nesse caso mostrar: "Não foi possível criar a conta. Verifique se o CPF ou o CRN já estão cadastrados."
- Visual no mesmo padrão do app (esmeralda, cantos arredondados, Tailwind), responsivo, com logo "NutriPro".
- Todo campo com `<label htmlFor>` associado e botão de envio com o texto **"Entrar"** (acessibilidade; o teste de impressão usa esses rótulos para logar).
- Botão **"Sair"** no cartão do profissional na barra lateral (`App.tsx:616–628`) → `supabase.auth.signOut()`.

**Camada de dados (troca do `localStorage` pelo Supabase):**
- Instalar `@supabase/supabase-js`; cliente em `src/lib/supabase.ts` lendo `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Gerar tipos: `supabase gen types typescript` → `src/lib/database.types.ts`.
- Substituir `src/storage.ts` por `src/lib/db.ts` com funções **assíncronas** equivalentes: `listarPacientes`, `salvarPaciente`, `atualizarPaciente`, `listarConsultas`, `salvarConsulta`, `excluirConsulta`, `listarAgendamentos`, `salvarAgendamento`, `excluirAgendamento`, `carregarPerfil`, `salvarPerfil`, `listarAlimentos`. Fazer o mapeamento entre os nomes do banco (português, snake_case) e os tipos do front (`Patient`, `Consultation`…) dentro desse arquivo.
- `App.tsx` hoje carrega tudo de forma síncrona nos `useState(() => load...())`. Trocar por carregamento após o login, com estado de "carregando" e mensagem de erro com botão "Tentar de novo".
- Os ids passam a ser `uuid` gerados pelo banco. Remover `'p_' + Date.now()`, `'c_' + Date.now()` etc.
- `Appointment.patientName` deixa de ser gravado; vem de um join com `pacientes`.
- Remover os dados de exemplo ("Dra. Marina Silva", João Silva etc.) do fluxo normal. Conta nova começa vazia.
- **Importar dados antigos:** a opção "Restaurar backup" (no perfil, item 2) lê o JSON exportado pela versão antiga e grava pacientes, consultas e agendamentos no Supabase da conta logada, recriando os ids e as referências. Mostrar um resumo ao final ("12 pacientes, 30 consultas e 8 agendamentos importados").
- `ProfileModal`: nome, clínica, telefone e endereço de rodapé são editáveis; **CPF, CRN e e-mail aparecem só para leitura** (o banco bloqueia a alteração desses campos).

### E3 — Variáveis de ambiente
- `.env.example` já atualizado nesta pasta com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- **Nunca** colocar a `service_role key` no front nem em arquivo versionado. Ela só existe como segredo da Edge Function (o Supabase injeta sozinho).

### E4 — Segurança e LGPD (mínimo para produção)
- Em produção, restringir o CORS da função `login-identificador` ao domínio do app.
- Ativar a confirmação de e-mail no cadastro (Auth → Providers → Email) e senha mínima de 8 caracteres.
- Os dados de saúde de pacientes são dados sensíveis pela LGPD. Antes de ir para produção, revisar: termo de uso/privacidade para o nutricionista, região do projeto Supabase (preferir `sa-east-1`, São Paulo) e política de backup.

---

## Checklist final
- [ ] `npm run lint` e `npm run build` sem erros.
- [ ] Teste de impressão (item 13) passando nos três documentos.
- [ ] Metas do cardápio acompanham a aba 3 sem salvar a consulta (E5), e a impressão separa "Meta (VET)" de "Total do cardápio" (E6).
- [ ] Login funcionando pelas três formas (e-mail, CPF, CRN) numa conta de teste.
- [ ] Duas contas de teste: uma não vê pacientes da outra.
- [ ] Consulta criada na versão antiga (backup JSON) importa e abre sem erro, com o cardápio apontando para os alimentos certos.
- [ ] Nenhum texto afirmando "offline", "criptografado" ou "100% seguro".
- [ ] Um commit por item, com mensagem descrevendo o que mudou.
