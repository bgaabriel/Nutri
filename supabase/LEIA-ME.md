# Supabase — como colocar no ar

## 1. Criar o projeto
1. Entre em https://supabase.com/dashboard e crie um projeto novo (nome sugerido: `nutripro-clinico`).
2. Região: **South America (São Paulo) — sa-east-1**, por causa da LGPD e da latência.
3. Guarde a senha do banco num gerenciador de senhas.
4. Em **Project Settings → API**, copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`
   e coloque no arquivo `.env.local` na raiz do projeto (modelo em `.env.example`).
   A **service_role key não vai para o `.env.local`** nem para o código do front.

## 2. Aplicar as migrations
Com a Supabase CLI (`npm i -g supabase` ou `npx supabase`):

```bash
npx supabase login
npx supabase link --project-ref <ref-do-projeto>   # o ref está na URL do painel
npx supabase db push                               # aplica supabase/migrations/*.sql em ordem
```

Sem CLI: abra **SQL Editor** no painel e rode, nesta ordem, o conteúdo de
`20260926120000_schema_inicial.sql` e depois `20260926120100_alimentos_taco.sql`.

Conferência rápida no SQL Editor:
```sql
select count(*) from public.alimentos_taco;   -- deve dar 614
```

## 3. Publicar a função de login por CPF/CRN
```bash
npx supabase functions deploy login-identificador --no-verify-jwt
```
`--no-verify-jwt` é necessário porque a função é chamada **antes** de o usuário ter sessão.
O Supabase injeta sozinho `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` na função.

Em produção, troque `'Access-Control-Allow-Origin': '*'` em `functions/login-identificador/index.ts` pelo domínio do app.

## 4. Ajustes no painel (Authentication)
- **Providers → Email:** habilitado; ative "Confirm email".
- **Policies de senha:** mínimo 8 caracteres.
- **URL Configuration:** adicione a URL do app (e `http://localhost:3000` para desenvolvimento) em *Site URL* / *Redirect URLs*, para o link de "Esqueci minha senha" voltar para `/redefinir-senha`.

## 5. Regenerar o seed da TACO (só se os JSON mudarem)
```bash
python3 scripts/gerar_seed_taco.py
```
Se a migration já tiver sido aplicada, crie uma **nova** migration com as alterações em vez de editar a antiga.

## O que as migrations garantem (testado em Postgres 16)
- Cada nutricionista só lê e altera os próprios pacientes, consultas e agendamentos (RLS).
- Não dá para criar consulta ou agendamento apontando para paciente de outra conta.
- CPF e CRN são únicos; cadastro com CPF/CRN já usado é recusado.
- CPF, CRN e e-mail não podem ser alterados pelo app (só nome, clínica, telefone e rodapé).
- Sem login, nenhuma tabela retorna dados, inclusive a de alimentos.
