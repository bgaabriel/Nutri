# NutriPro Clínico — instruções para o Claude Code

Sistema web para nutricionistas: agenda, prontuário (anamnese, antropometria, gasto energético, cardápio com Tabela TACO, evolução) e impressão de cardápio/relatórios.

## Stack
- React 19 + TypeScript + Vite 6 + Tailwind CSS 4 (plugin `@tailwindcss/vite`)
- Ícones `lucide-react`, gráficos `recharts`
- Backend: **Supabase** (Auth + Postgres com RLS + Edge Function) — entra na fase E da especificação
- Hoje os dados ficam no `localStorage` (`src/storage.ts`); isso será substituído

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
- `src/calculations.ts` — IMC, RCQ, % gordura, TMB (Mifflin, Harris, FAO, Cunningham), GET, VET, macros
- `src/types.ts` — todos os tipos
- `src/data/tacoFoods.ts` — base de alimentos atual (66 itens) + cardápio modelo
- `src/data/taco/` — TACO completa (597) + 17 complementares + mapa de ids antigos, prontos para o item 12
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
- Para conferir impressão: `docs/teste-impressao.mjs` (Playwright + pdfjs-dist).

## Comandos
```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # tsc --noEmit
npm run build
```
