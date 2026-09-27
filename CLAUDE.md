# NutriPro Clínico — instruções para o Claude Code

Sistema web para nutricionistas: agenda, prontuário (anamnese, antropometria, gasto energético, cardápio com Tabela TACO, evolução) e impressão de cardápio/relatórios.

## Stack
- React 19 + TypeScript + Vite 6 + Tailwind CSS 4 (plugin `@tailwindcss/vite`)
- Ícones `lucide-react`, gráficos `recharts`
- Backend: **Supabase** (Auth + Postgres com RLS + Edge Function `login-identificador`), projeto `nutripro-clinico` em sa-east-1
- Dados: `src/lib/db.ts` (funções assíncronas; o mapeamento banco ↔ tipos do front fica lá). Chaves em `.env.local` (ver `.env.example`)

## Documento principal
**Leia `docs/ESPECIFICACAO.md` inteiro antes de começar.** Ele lista as 14 alterações pedidas e 6 correções extras, com arquivos, linhas, critérios de aceite e a ordem das fases.

## Mapa do código
- `src/App.tsx` — estado global, navegação (`panorama` | `pacientes` | `prontuario`), barra lateral e cabeçalho
- `src/components/OverviewDashboard.tsx` — Panorama + calendário (dia/semana/mês)
- `src/components/PatientsDirectoryView.tsx` — lista de pacientes
- `src/components/PatientsModal.tsx` — cadastrar/trocar paciente
- `src/components/PatientRecordView.tsx` — prontuário: faixa do paciente, abas de etapas e navegação
- Abas: `AnamnesisTab`, `AnthropometryTab`, `MetabolismTab`, `MealPlannerTab`, `ComparativeTab`
- Impressão: `PrintMealPlanView`, `PrintReportView`, `PrintEvolutionReportView` + regras `@media print` em `src/index.css`
- `src/calculations.ts` — IMC, RCQ, % gordura, TMB (Mifflin, Harris, FAO, Cunningham, Tinsley), GET, VET, macros (g/kg ou %)
- `src/types.ts` — todos os tipos
- `src/data/tacoFoods.ts` — base de alimentos (TACO 597 + 17 complementares, trocada pela tabela `alimentos_taco` após o login), busca, migração de ids antigos e cardápio modelo
- `src/data/taco/` — JSON da TACO, complementares e mapa de ids antigos
- `src/lib/` — cliente Supabase, tipos gerados do banco e camada de dados
- `src/pages/` — login, cadastro e nova senha
- `supabase/` — migrations testadas, Edge Function de login por CPF/CRN, `LEIA-ME.md`

## Regras de trabalho
- Interface, textos, nomes de telas e mensagens em **português do Brasil**.
- Mantenha o visual atual: tons esmeralda/slate, `rounded-xl`/`rounded-2xl`, textos `text-xs`/`text-sm`.
- Campos novos nos tipos são **opcionais** e ganham valor padrão na leitura: consultas antigas precisam continuar abrindo.
- **Um commit por item** da especificação. `npm run lint` e `npm run build` precisam passar antes de cada commit.
- Regra das duplicidades: se o mesmo botão aparece no cabeçalho do app e dentro da página, **fica o de dentro**.
- Não escreva no app que os dados são "offline", "criptografados" ou "100% seguros" se não for literalmente verdade.
- Nunca coloque a `service_role key` do Supabase no front ou em arquivo versionado.
- Para datas "de hoje", use a data **local** (ver E1), nunca `toISOString().split('T')[0]`.
- Para conferir impressão: `docs/teste-impressao.mjs` (Playwright + pdfjs-dist). Para o fluxo logado sem acesso ao Supabase: `docs/teste-supabase-simulado.mjs`.

## Comandos
```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # tsc --noEmit
npm run build
npm run test:impressao          # com o app em npx vite preview --port 4173
npm run test:supabase-simulado
```
