# Prompt para colar no Claude Code

Abra o Claude Code na pasta do projeto (a que contém `CLAUDE.md`) e cole o texto abaixo.

---

```
Você vai evoluir o NutriPro Clínico para a versão 2.

1. Leia o CLAUDE.md e depois o docs/ESPECIFICACAO.md inteiro antes de mexer em qualquer arquivo.
2. Monte uma lista de tarefas seguindo as fases da especificação (0, A, B, C, D, E), um item por tarefa.
3. Execute na ordem das fases. Ao terminar cada item:
   - rode `npm run lint` e `npm run build` e corrija o que quebrar;
   - confira o critério de aceite do item;
   - faça um commit com a mensagem "item N: <resumo>" listando o que foi removido/alterado.
4. No item 13, instale playwright e pdfjs-dist como devDependencies e rode `node docs/teste-impressao.mjs` com o app em `npx vite preview --port 4173`. Os três documentos precisam passar.
5. Antes da fase E, confira se existe `.env.local` com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Se não existir, PARE e me peça as chaves, explicando o passo a passo de supabase/LEIA-ME.md. Não invente chaves e não use a service_role no front.
6. Na fase E, aplique as migrations de supabase/migrations com `npx supabase db push` e publique a função com `npx supabase functions deploy login-identificador --no-verify-jwt` (me peça para rodar `npx supabase login` se precisar de autenticação).
7. Se algum ponto da especificação estiver ambíguo ou conflitar com o código, escolha a opção mais simples que cumpra o objetivo do item, siga em frente e anote a decisão no final.
8. No fim, me entregue: o que foi feito por item, o que ficou pendente, as decisões que você tomou e como testar o login (e-mail, CPF e CRN) com uma conta de teste.
```

---

## Dicas
- Se a sessão ficar longa, peça "continue a partir do próximo item pendente da especificação": os commits e a lista de tarefas mostram onde parou.
- Para revisar uma fase antes de seguir, peça "pare ao final da fase A para eu testar".
- A pasta `node_modules` não vai no pacote: rode `npm install` antes de tudo.
