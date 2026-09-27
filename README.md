# NutriPro Clínico

Sistema web para nutricionistas: agenda, prontuário (anamnese, antropometria, gasto energético,
cardápio com a Tabela TACO completa, evolução) e impressão de cardápio e relatórios.

- Front: React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- Backend: Supabase (Auth + Postgres com RLS + Edge Function `login-identificador`)

## Rodar localmente

**Pré-requisito:** Node.js 20+.

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (Supabase → Project Settings → API). Só a chave pública (anon) vai para o front;
   **nunca** coloque a `service_role key` no `.env.local` nem em arquivo versionado.
3. `npm run dev` → http://localhost:3000

Como criar o projeto Supabase, aplicar as migrations e publicar a função: `supabase/LEIA-ME.md`.

## Comandos

```bash
npm run dev                      # servidor de desenvolvimento
npm run lint                     # tsc --noEmit
npm run build                    # build de produção em dist/
npm run test:impressao           # impressão (Playwright + pdfjs); ver docs/teste-impressao.mjs
npm run test:supabase-simulado   # front completo com o Supabase simulado
```

Os dois testes precisam do app em `npx vite preview --port 4173` em outro terminal.
