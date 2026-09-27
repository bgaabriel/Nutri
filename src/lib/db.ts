/**
 * Camada de dados: substitui o antigo storage.ts (localStorage) pelo Supabase.
 * Aqui fica todo o mapeamento entre os nomes do banco (português, snake_case) e os
 * tipos do front (Patient, Consultation…). O isolamento entre contas é garantido pelas
 * políticas RLS: cada consulta só enxerga as linhas do profissional logado.
 */
import { supabase } from './supabase';
import type { Database, Json } from './database.types';
import type {
  Anamnesis,
  Anthropometry,
  Appointment,
  AppointmentModality,
  AppointmentStatus,
  AppointmentType,
  CalculatedMetrics,
  Consultation,
  EnergyPrescription,
  MealPlan,
  Patient,
  ProfessionalProfile,
  Sex,
  TacoFoodItem,
} from '../types';
import { migrarConsulta } from '../data/tacoFoods';
import { dataLocalISO, parseDataConsulta } from '../utils/date';

type Linha<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

/** Erro do Supabase vira Error com mensagem em português. */
function falhou(acao: string, erro: { message: string } | null): never {
  throw new Error(`Não foi possível ${acao}. ${erro?.message ?? ''}`.trim());
}

const comoJson = (valor: unknown) => valor as Json;

// ---------------------------------------------------------------------------
// Datas: o banco guarda 'AAAA-MM-DD'; as consultas do front usam 'DD/MM/AAAA'
// ---------------------------------------------------------------------------
function dataBancoParaConsulta(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function dataConsultaParaBanco(data: string): string {
  const d = parseDataConsulta(data);
  return d ? dataLocalISO(d) : dataLocalISO(new Date());
}

// ---------------------------------------------------------------------------
// Pacientes
// ---------------------------------------------------------------------------
function paraPaciente(l: Linha<'pacientes'>): Patient {
  return {
    id: l.id,
    name: l.nome,
    age: l.idade ?? 0,
    sex: (l.sexo === 'F' ? 'F' : 'M') as Sex,
    phone: l.telefone ?? undefined,
    email: l.email ?? undefined,
    objective: l.objetivo ?? '',
    createdAt: dataLocalISO(new Date(l.created_at)),
  };
}

export type NovoPaciente = Omit<Patient, 'id' | 'createdAt'>;

function camposPaciente(p: Partial<NovoPaciente>) {
  return {
    ...(p.name !== undefined && { nome: p.name }),
    ...(p.age !== undefined && { idade: p.age }),
    ...(p.sex !== undefined && { sexo: p.sex }),
    ...(p.phone !== undefined && { telefone: p.phone || null }),
    ...(p.email !== undefined && { email: p.email || null }),
    ...(p.objective !== undefined && { objetivo: p.objective }),
  };
}

export async function listarPacientes(): Promise<Patient[]> {
  const { data, error } = await supabase.from('pacientes').select('*').order('created_at');
  if (error) falhou('carregar os pacientes', error);
  return data.map(paraPaciente);
}

export async function salvarPaciente(p: NovoPaciente): Promise<Patient> {
  const { data, error } = await supabase
    .from('pacientes')
    .insert({ nome: p.name, sexo: p.sex, ...camposPaciente(p) })
    .select()
    .single();
  if (error) falhou('cadastrar o paciente', error);
  return paraPaciente(data);
}

export async function atualizarPaciente(id: string, campos: Partial<NovoPaciente>): Promise<void> {
  const { error } = await supabase.from('pacientes').update(camposPaciente(campos)).eq('id', id);
  if (error) falhou('atualizar o paciente', error);
}

// ---------------------------------------------------------------------------
// Consultas (prontuário)
// ---------------------------------------------------------------------------
function paraConsulta(l: Linha<'consultas'>): Consultation {
  return migrarConsulta({
    id: l.id,
    patientId: l.paciente_id,
    date: dataBancoParaConsulta(l.data),
    title: l.titulo,
    anamnesis: l.anamnese as unknown as Anamnesis,
    anthropometry: l.antropometria as unknown as Anthropometry,
    prescription: l.prescricao as unknown as EnergyPrescription,
    mealPlan: (l.cardapio as unknown as MealPlan | null) ?? undefined,
    calculated: (l.calculado as unknown as CalculatedMetrics | null) ?? undefined,
  });
}

function camposConsulta(c: Consultation) {
  return {
    paciente_id: c.patientId,
    data: dataConsultaParaBanco(c.date),
    titulo: c.title || 'Consulta',
    anamnese: comoJson(c.anamnesis),
    antropometria: comoJson(c.anthropometry),
    prescricao: comoJson(c.prescription),
    cardapio: c.mealPlan ? comoJson(c.mealPlan) : null,
    calculado: c.calculated ? comoJson(c.calculated) : null,
  };
}

export async function listarConsultas(): Promise<Consultation[]> {
  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .order('data')
    .order('created_at');
  if (error) falhou('carregar as consultas', error);
  return data.map(paraConsulta);
}

/** Grava uma consulta nova (o id do rascunho é descartado; o banco gera o uuid). */
export async function salvarConsulta(c: Consultation): Promise<Consultation> {
  const { data, error } = await supabase.from('consultas').insert(camposConsulta(c)).select().single();
  if (error) falhou('salvar a consulta', error);
  return paraConsulta(data);
}

export async function excluirConsulta(id: string): Promise<void> {
  const { error } = await supabase.from('consultas').delete().eq('id', id);
  if (error) falhou('excluir a consulta', error);
}

// ---------------------------------------------------------------------------
// Agendamentos (o nome do paciente vem do join com pacientes, não é gravado)
// ---------------------------------------------------------------------------
type LinhaAgendamento = Linha<'agendamentos'> & { pacientes: { nome: string } | null };

function paraAgendamento(l: LinhaAgendamento): Appointment {
  return {
    id: l.id,
    patientId: l.paciente_id,
    patientName: l.pacientes?.nome ?? 'Paciente removido',
    date: l.data,
    time: l.hora.slice(0, 5),
    durationMinutes: l.duracao_min,
    type: l.tipo as AppointmentType,
    status: l.status as AppointmentStatus,
    modality: l.modalidade as AppointmentModality,
    notes: l.observacoes ?? undefined,
    price: l.valor ?? undefined,
    paid: l.pago,
  };
}

export type DadosAgendamento = Omit<Appointment, 'id' | 'patientName'>;

function camposAgendamento(a: DadosAgendamento) {
  return {
    paciente_id: a.patientId,
    data: a.date,
    hora: a.time,
    duracao_min: a.durationMinutes,
    tipo: a.type,
    status: a.status,
    modalidade: a.modality,
    observacoes: a.notes || null,
    valor: a.price ?? null,
    pago: !!a.paid,
  };
}

const COLUNAS_AGENDAMENTO = '*, pacientes(nome)';

export async function listarAgendamentos(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('agendamentos')
    .select(COLUNAS_AGENDAMENTO)
    .order('data')
    .order('hora');
  if (error) falhou('carregar a agenda', error);
  return (data as LinhaAgendamento[]).map(paraAgendamento);
}

/** Cria (sem id) ou atualiza (com id) um agendamento. */
export async function salvarAgendamento(a: DadosAgendamento, id?: string): Promise<Appointment> {
  const consulta = id
    ? supabase.from('agendamentos').update(camposAgendamento(a)).eq('id', id)
    : supabase.from('agendamentos').insert(camposAgendamento(a));
  const { data, error } = await consulta.select(COLUNAS_AGENDAMENTO).single();
  if (error) falhou('salvar o agendamento', error);
  return paraAgendamento(data as LinhaAgendamento);
}

export async function excluirAgendamento(id: string): Promise<void> {
  const { error } = await supabase.from('agendamentos').delete().eq('id', id);
  if (error) falhou('excluir o agendamento', error);
}

// ---------------------------------------------------------------------------
// Perfil do profissional (CPF, CRN e e-mail não podem ser alterados pelo app)
// ---------------------------------------------------------------------------
export async function carregarPerfil(): Promise<ProfessionalProfile> {
  const { data, error } = await supabase.from('profissionais').select('*').maybeSingle();
  if (error) falhou('carregar o perfil', error);
  if (!data) throw new Error('Perfil do profissional não encontrado para esta conta.');
  return {
    name: data.nome,
    crn: `CRN-${data.crn_regiao} ${data.crn_numero}`,
    crnRegiao: data.crn_regiao,
    crnNumero: data.crn_numero,
    cpf: data.cpf,
    clinic: data.clinica ?? '',
    phone: data.telefone ?? '',
    email: data.email,
    address: data.endereco_rodape ?? '',
  };
}

export async function salvarPerfil(perfil: ProfessionalProfile): Promise<void> {
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) throw new Error('Sessão expirada. Entre novamente.');
  const { error } = await supabase
    .from('profissionais')
    .update({
      nome: perfil.name,
      clinica: perfil.clinic || null,
      telefone: perfil.phone || null,
      endereco_rodape: perfil.address || null,
    })
    .eq('id', usuario.user.id);
  if (error) falhou('salvar o perfil', error);
}

// ---------------------------------------------------------------------------
// Tabela TACO
// ---------------------------------------------------------------------------
export async function listarAlimentos(): Promise<TacoFoodItem[]> {
  const { data, error } = await supabase.from('alimentos_taco').select('*').order('id');
  if (error) falhou('carregar a Tabela TACO', error);
  return data.map((a) => ({
    id: a.id,
    tacoNumero: a.taco_numero,
    nome: a.nome,
    grupo: a.grupo,
    fonte: a.fonte,
    porcaoPadraoG: Number(a.porcao_padrao_g),
    medidaCaseira: a.medida_caseira,
    kcal100g: Number(a.kcal_100g),
    prot100g: Number(a.prot_100g),
    carb100g: Number(a.carb_100g),
    lip100g: Number(a.lip_100g),
    fibra100g: Number(a.fibra_100g),
    sodio100g: Number(a.sodio_mg_100g),
    calcio100g: Number(a.calcio_mg_100g),
    ferro100g: Number(a.ferro_mg_100g),
    potassio100g: Number(a.potassio_mg_100g),
    magnesio100g: Number(a.magnesio_mg_100g),
    vitc100g: Number(a.vitc_mg_100g),
    fosforo100g: Number(a.fosforo_mg_100g),
    zinco100g: Number(a.zinco_mg_100g),
    colesterol100g: Number(a.colesterol_mg_100g),
    umidade100g: a.umidade_100g === null ? null : Number(a.umidade_100g),
    dadosIncompletos: a.dados_incompletos,
  }));
}

// ---------------------------------------------------------------------------
// Backup: exportar e restaurar (inclusive o JSON da versão antiga, que usava localStorage)
// ---------------------------------------------------------------------------
export interface Backup {
  version?: string;
  exportDate?: string;
  profile?: ProfessionalProfile;
  patients?: Patient[];
  consultations?: Consultation[];
  appointments?: Appointment[];
}

export function montarBackup(
  perfil: ProfessionalProfile,
  pacientes: Patient[],
  consultas: Consultation[],
  agendamentos: Appointment[]
): string {
  const backup: Backup = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    profile: perfil,
    patients: pacientes,
    consultations: consultas,
    appointments: agendamentos,
  };
  return JSON.stringify(backup, null, 2);
}

export interface ResumoImportacao {
  pacientes: number;
  consultas: number;
  agendamentos: number;
  ignorados: number;
}

/**
 * Grava no Supabase da conta logada os pacientes, consultas e agendamentos de um
 * backup JSON (formato da versão antiga ou da atual). Os ids são recriados pelo
 * banco e as referências (consulta → paciente, agendamento → paciente) são refeitas.
 * O perfil do backup não é importado: CPF, CRN e e-mail vêm do cadastro da conta.
 */
export async function importarBackup(conteudo: string): Promise<ResumoImportacao> {
  let backup: Backup;
  try {
    backup = JSON.parse(conteudo);
  } catch {
    throw new Error('O arquivo não é um backup JSON válido.');
  }
  const pacientes = Array.isArray(backup.patients) ? backup.patients : [];
  const consultas = Array.isArray(backup.consultations) ? backup.consultations : [];
  const agendamentos = Array.isArray(backup.appointments) ? backup.appointments : [];
  if (!pacientes.length && !consultas.length && !agendamentos.length) {
    throw new Error('O arquivo não tem pacientes, consultas nem agendamentos.');
  }

  const resumo: ResumoImportacao = { pacientes: 0, consultas: 0, agendamentos: 0, ignorados: 0 };
  const novoId = new Map<string, string>();

  for (const p of pacientes) {
    const criado = await salvarPaciente({
      name: p.name,
      age: Number(p.age) || 0,
      sex: p.sex === 'F' ? 'F' : 'M',
      phone: p.phone,
      email: p.email,
      objective: p.objective || '',
    });
    novoId.set(p.id, criado.id);
    resumo.pacientes++;
  }

  const linhasConsultas = consultas.flatMap((c) => {
    const pacienteId = novoId.get(c.patientId);
    if (!pacienteId) {
      resumo.ignorados++;
      return [];
    }
    return [camposConsulta(migrarConsulta({ ...c, patientId: pacienteId }))];
  });
  if (linhasConsultas.length) {
    const { error } = await supabase.from('consultas').insert(linhasConsultas);
    if (error) falhou('importar as consultas', error);
    resumo.consultas = linhasConsultas.length;
  }

  const linhasAgendamentos = agendamentos.flatMap((a) => {
    const pacienteId = novoId.get(a.patientId);
    if (!pacienteId) {
      resumo.ignorados++;
      return [];
    }
    return [camposAgendamento({ ...a, patientId: pacienteId, durationMinutes: a.durationMinutes || 60 })];
  });
  if (linhasAgendamentos.length) {
    const { error } = await supabase.from('agendamentos').insert(linhasAgendamentos);
    if (error) falhou('importar os agendamentos', error);
    resumo.agendamentos = linhasAgendamentos.length;
  }

  return resumo;
}
