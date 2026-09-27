-- =====================================================================
-- NutriPro Clínico — Schema inicial
-- Profissionais (nutricionistas), pacientes, consultas e agendamentos.
-- Cada nutricionista só enxerga e altera os PRÓPRIOS dados (RLS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Função utilitária: mantém updated_at atualizado
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- PROFISSIONAIS (1 linha por usuário do Supabase Auth)
-- ---------------------------------------------------------------------
create table public.profissionais (
  id               uuid primary key references auth.users (id) on delete cascade,
  nome             text not null check (char_length(nome) between 3 and 150),
  email            text not null unique,
  cpf              text not null unique check (cpf ~ '^[0-9]{11}$'),          -- só dígitos
  crn_regiao       smallint not null check (crn_regiao between 1 and 11),     -- CRN-1 a CRN-11
  crn_numero       text not null check (crn_numero ~ '^[0-9]{1,7}(/P)?$'),    -- ex: 45920 ou 12345/P
  clinica          text,
  telefone         text,
  endereco_rodape  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (crn_regiao, crn_numero)
);

create trigger trg_profissionais_updated_at
  before update on public.profissionais
  for each row execute function public.set_updated_at();

alter table public.profissionais enable row level security;

create policy "profissional le o proprio perfil"
  on public.profissionais for select to authenticated
  using (id = (select auth.uid()));

create policy "profissional atualiza o proprio perfil"
  on public.profissionais for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- CPF, CRN e e-mail são identificadores de login: não podem ser trocados pelo app.
-- (Troca desses campos deve ser feita pelo suporte, direto no banco.)
revoke update on public.profissionais from authenticated;
grant update (nome, clinica, telefone, endereco_rodape) on public.profissionais to authenticated;

-- Cria o registro em profissionais automaticamente no cadastro (signUp).
-- O front envia nome, cpf, crn_regiao e crn_numero em options.data (raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profissionais (id, nome, email, cpf, crn_regiao, crn_numero)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nome',
    lower(new.email),
    regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf', ''), '[^0-9]', '', 'g'),
    (new.raw_user_meta_data ->> 'crn_regiao')::smallint,
    upper(regexp_replace(coalesce(new.raw_user_meta_data ->> 'crn_numero', ''), '[^0-9/Pp]', '', 'g'))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- PACIENTES
-- ---------------------------------------------------------------------
create table public.pacientes (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null default auth.uid() references public.profissionais (id) on delete cascade,
  nome             text not null check (char_length(nome) between 2 and 150),
  idade            smallint check (idade between 0 and 130),
  sexo             char(1) not null check (sexo in ('M', 'F')),
  telefone         text,
  email            text,
  objetivo         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_pacientes_profissional on public.pacientes (profissional_id);

create trigger trg_pacientes_updated_at
  before update on public.pacientes
  for each row execute function public.set_updated_at();

alter table public.pacientes enable row level security;

create policy "pacientes: select proprios" on public.pacientes for select to authenticated
  using (profissional_id = (select auth.uid()));
create policy "pacientes: insert proprios" on public.pacientes for insert to authenticated
  with check (profissional_id = (select auth.uid()));
create policy "pacientes: update proprios" on public.pacientes for update to authenticated
  using (profissional_id = (select auth.uid()))
  with check (profissional_id = (select auth.uid()));
create policy "pacientes: delete proprios" on public.pacientes for delete to authenticated
  using (profissional_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- CONSULTAS (prontuário). Blocos clínicos em JSONB, espelhando os tipos
-- do front (Anamnesis, Anthropometry, EnergyPrescription, MealPlan,
-- CalculatedMetrics) para não travar a evolução do formulário.
-- ---------------------------------------------------------------------
create table public.consultas (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null default auth.uid() references public.profissionais (id) on delete cascade,
  paciente_id      uuid not null references public.pacientes (id) on delete cascade,
  data             date not null default current_date,
  titulo           text not null,
  anamnese         jsonb not null default '{}'::jsonb,
  antropometria    jsonb not null default '{}'::jsonb,
  prescricao       jsonb not null default '{}'::jsonb,
  cardapio         jsonb,
  calculado        jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_consultas_profissional on public.consultas (profissional_id);
create index idx_consultas_paciente_data on public.consultas (paciente_id, data);

create trigger trg_consultas_updated_at
  before update on public.consultas
  for each row execute function public.set_updated_at();

alter table public.consultas enable row level security;

create policy "consultas: select proprias" on public.consultas for select to authenticated
  using (profissional_id = (select auth.uid()));
create policy "consultas: insert proprias" on public.consultas for insert to authenticated
  with check (
    profissional_id = (select auth.uid())
    and exists (select 1 from public.pacientes p
                where p.id = paciente_id and p.profissional_id = (select auth.uid()))
  );
create policy "consultas: update proprias" on public.consultas for update to authenticated
  using (profissional_id = (select auth.uid()))
  with check (
    profissional_id = (select auth.uid())
    and exists (select 1 from public.pacientes p
                where p.id = paciente_id and p.profissional_id = (select auth.uid()))
  );
create policy "consultas: delete proprias" on public.consultas for delete to authenticated
  using (profissional_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- AGENDAMENTOS
-- ---------------------------------------------------------------------
create table public.agendamentos (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null default auth.uid() references public.profissionais (id) on delete cascade,
  paciente_id      uuid not null references public.pacientes (id) on delete cascade,
  data             date not null,
  hora             time not null,
  duracao_min      smallint not null default 60 check (duracao_min between 5 and 480),
  tipo             text not null check (tipo in ('primeira_consulta','retorno','antropometria','bioimpedancia','ajuste_plano')),
  status           text not null default 'agendado'
                   check (status in ('agendado','confirmado','em_atendimento','concluido','cancelado')),
  modalidade       text not null default 'presencial' check (modalidade in ('presencial','online')),
  observacoes      text,
  valor            numeric(10,2),
  pago             boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_agendamentos_profissional_data on public.agendamentos (profissional_id, data);

create trigger trg_agendamentos_updated_at
  before update on public.agendamentos
  for each row execute function public.set_updated_at();

alter table public.agendamentos enable row level security;

create policy "agendamentos: select proprios" on public.agendamentos for select to authenticated
  using (profissional_id = (select auth.uid()));
create policy "agendamentos: insert proprios" on public.agendamentos for insert to authenticated
  with check (
    profissional_id = (select auth.uid())
    and exists (select 1 from public.pacientes p
                where p.id = paciente_id and p.profissional_id = (select auth.uid()))
  );
create policy "agendamentos: update proprios" on public.agendamentos for update to authenticated
  using (profissional_id = (select auth.uid()))
  with check (
    profissional_id = (select auth.uid())
    and exists (select 1 from public.pacientes p
                where p.id = paciente_id and p.profissional_id = (select auth.uid()))
  );
create policy "agendamentos: delete proprios" on public.agendamentos for delete to authenticated
  using (profissional_id = (select auth.uid()));
