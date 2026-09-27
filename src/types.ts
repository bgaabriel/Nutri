export type Sex = 'M' | 'F';

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  phone?: string;
  email?: string;
  objective: string;
  createdAt: string;
}

export interface LabExams {
  fastingGlucose: string;
  totalCholesterol: string;
  hdlCholesterol: string;
  triglycerides: string;
  otherExams: string;
}

export interface Anamnesis {
  occupation?: string; // profissão / trabalho
  workRoutine?: string; // turno, carga horária, sentado/em pé, se come fora
  foodRecall?: string; // recordatório alimentar (24h ou dia habitual), texto livre
  sleepHabit: string;
  waterIntakeLiters: string;
  bowelHabit: string;
  trainingRoutine: string;
  allergiesAversions: string;
  clinicalNotes: string;
  labExams: LabExams;
}

export type FatProtocol = 'marinha' | 'faulkner' | 'jp7' | 'jp3';

export interface Circumferences {
  neck: number;
  waist: number;
  abdomen: number;
  hip: number;
  relaxedArm: number;
  thigh: number;
  calf: number;
}

export interface Skinfolds {
  triceps: number;
  subscapular: number;
  chest: number;
  midaxillary: number;
  suprailiac: number;
  abdominal: number;
  thigh: number;
}

export interface Anthropometry {
  weight: number; // kg
  height: number; // cm
  circumferences: Circumferences;
  skinfolds: Skinfolds;
  fatProtocol: FatProtocol;
}

export type BmrFormula = 'mifflin' | 'harris' | 'fao' | 'cunningham';

export interface EnergyPrescription {
  bmrFormula: BmrFormula;
  activityFactorPreset: string;
  activityFactor: number;
  targetKcalAdjustment: number;
  proteinGKg: number;
  carbGKg: number;
  fatGKg: number;
}

export interface TacoFoodItem {
  id: string;
  nome: string;
  grupo: string;
  porcaoPadraoG: number;
  medidaCaseira: string;
  kcal100g: number;
  prot100g: number;
  carb100g: number;
  lip100g: number;
  fibra100g: number; // g
  sodio100g: number; // mg
  calcio100g: number; // mg
  ferro100g: number; // mg
  potassio100g: number; // mg
  magnesio100g: number; // mg
  vitc100g: number; // mg
  fosforo100g?: number; // mg
}

export interface MealFoodItem {
  id: string;
  tacoId: string;
  nome: string;
  grupo: string;
  quantidadeG: number;
  medidaCaseira: string;
  kcal: number;
  prot: number;
  carb: number;
  lip: number;
  fibra: number;
  sodio: number;
  calcio: number;
  ferro: number;
  potassio: number;
  magnesio: number;
  vitc: number;
  substituicoes?: string;
}

export interface Meal {
  id: string;
  nome: string;
  horario: string;
  alimentos: MealFoodItem[];
  observacoes?: string;
}

export interface MealPlan {
  id: string;
  titulo: string;
  dataCriacao: string;
  refeicoes: Meal[];
  metaAguaMl: number;
  orientacoesGerais?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  title: string;
  anamnesis: Anamnesis;
  anthropometry: Anthropometry;
  prescription: EnergyPrescription;
  mealPlan?: MealPlan;
  calculated?: CalculatedMetrics;
}

export interface CalculatedMetrics {
  imc: number;
  imcClassification: string;
  rcq: number;
  rcqRisk: boolean;
  rcqText: string;
  bodyFatPercent: number;
  fatMassKg: number;
  leanMassKg: number;
  bmrMifflin: number;
  bmrHarris: number;
  bmrFao: number;
  bmrCunningham?: number;
  chosenBmr: number;
  get: number;
  vet: number;
  proteinGrams: number;
  proteinKcal: number;
  carbGrams: number;
  carbKcal: number;
  fatGrams: number;
  fatKcal: number;
  skinfoldsSum7: number;
  skinfoldsSum4: number;
}

export interface ProfessionalProfile {
  name: string;
  crn: string;
  clinic: string;
  phone: string;
  email: string;
  address?: string; // endereço do consultório / observação de rodapé
}

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado';

export type AppointmentType =
  | 'primeira_consulta'
  | 'retorno'
  | 'antropometria'
  | 'bioimpedancia'
  | 'ajuste_plano';

export type AppointmentModality = 'presencial' | 'online';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
  durationMinutes: number; // ex: 45, 60
  type: AppointmentType;
  status: AppointmentStatus;
  modality: AppointmentModality;
  notes?: string;
  price?: number;
  paid?: boolean;
}
