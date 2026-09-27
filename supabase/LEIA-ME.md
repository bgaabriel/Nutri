# Supabase — como colocar no ar

## Situação atual (27/09/2026)
Já feito pelo Claude Code, pelo conector do Supabase:
- projeto **nutripro-clinico** (ref `fdqflqazohspcxbredus`), região **sa-east-1 (São Paulo)**, plano gratuito;
- migrations aplicadas: `schema_inicial`, `alimentos_taco` (tabela + 614 alimentos em 4 partes,
  conferidos por checksum contra os JSON), `revoga_execucao_handle_new_user` e `indice_agendamentos_paciente`;
- função `login-identificador` publicada sem verificação de JWT;
- Security Advisor sem avisos; RLS conferido com duas contas simuladas (transação desfeita no fim).

**Atenção à CLI:** as migrations foram aplicadas pelo conector, então as versões gravadas no banco
(`20260927151442`…) são diferentes dos nomes dos arquivos desta pasta, e a TACO entrou em 4 partes.
Antes de usar `npx supabase db push` neste projeto, rode `npx supabase migration list` e alinhe o
histórico com `npx supabase migration repair` (ou continue aplicando mudanças novas pelo SQL Editor).

**Falta fazer no painel** (não dá para configurar pelo conector):
- Authentication → Sign In / Providers → Email: conferir que **Confirm email** está ligado e definir
  **senha mínima de 8 caracteres**;
- Authentication → URL Configuration: **Site URL** com o endereço do app e, em **Redirect URLs**,
  `<endereço do app>/redefinir-senha` e `http://localhost:3000/**`;
- Edge Functions → Secrets: `APP_ORIGINS` com o domínio do app (restringe o CORS da função; sem ele,
  qualquer origem é aceita);
- o e-mail padrão do Supabase tem limite baixo de envios por hora: para produção, configure um SMTP
  próprio (Authentication → Emails → SMTP).

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

Em produção, defina o segredo `APP_ORIGINS` (Edge Functions → Secrets) com o domínio do app, separado
por vírgula se houver mais de um. Sem ele a função aceita qualquer origem.

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

## LGPD e produção (checklist)
Os dados de saúde dos pacientes são **dados pessoais sensíveis** (LGPD, art. 5º, II e art. 11). Antes de
abrir para outros nutricionistas:
- [ ] termo de uso e política de privacidade para o nutricionista (quem é o controlador e o operador,
      finalidade, retenção, direitos do titular);
- [ ] manter o projeto em **sa-east-1** (já está);
- [ ] política de backup: o plano gratuito não tem backup diário recuperável pelo painel; avalie o
      plano Pro (backups diários) e oriente o uso de "Exportar backup (JSON)" no perfil;
- [ ] `APP_ORIGINS`, Confirm email, senha mínima de 8 e Redirect URLs (lista acima);
- [ ] SMTP próprio para os e-mails de confirmação e de nova senha;
- [ ] rodar Security Advisor e Performance Advisor depois de cada mudança de schema.
