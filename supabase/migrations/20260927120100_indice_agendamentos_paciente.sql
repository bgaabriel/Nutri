-- Índice da chave estrangeira agendamentos.paciente_id (usado no ON DELETE CASCADE e nos filtros por paciente).
-- Apontado pelo Performance Advisor do Supabase.
create index if not exists idx_agendamentos_paciente on public.agendamentos (paciente_id);
