export type Sex = 'M' | 'F';

export type BodyFatProtocol = 'marinha' | 'faulkner' | 'jp7' | 'jp3';

export type BMRFormula = 'mifflin' | 'harris' | 'fao' | 'katch';

export interface Anthropometry {
  peso: number; // kg
  altura: number; // cm
  cPescoco: number; // cm
  cCintura: number; // cm
  cAbdomen: number; // cm
  cQuadril: number; // cm
  cBraco: number; // cm
  cCoxa: number; // cm
  cPanturrilha: number; // cm
}

export interface Skinfolds {
  dTri: number; // Tríceps (mm)
  dSub: number; // Subescapular (mm)
  dPei: number; // Peitoral (mm)
  dAxi: number; // Axilar Média (mm)
  dSup: number; // Supra-ilíaca (mm)
  dAbd: number; // Abdominal (mm)
  dCox: number; // Coxa (mm)
}

export interface Anamnese {
  sono: string;
  aguaLitros: string;
  habitoIntestinal: string;
  rotinaTreino: string;
  alergiasAversoes: string;
  medicamentosSuplementos: string;
  historicoPatologico: string;
  queixaPrincipal: string;
}

export interface ExamesLab {
  glicemiaJejum: string;
  hba1c: string;
  colesterolTotal: string;
  colesterolHdl: string;
  colesterolLdl: string;
  triglicerideos: string;
  tsh: string;
  vitaminaD: string;
  creatinina: string;
  outrosExames: string;
}

export interface EnergyPlan {
  formulaAdotada: BMRFormula;
  fatorAtividade: number;
  fatorAtividadePreset: string;
  ajusteKcal: number;
  protGPorKg: number;
  carbGPorKg: number;
  gordGPorKg: number;
}

export interface FoodItem {
  id: string;
  nome: string;
  quantidadeG: number;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}

export interface Meal {
  id: string;
  nome: string;
  horario: string;
  alimentos: FoodItem[];
}

export interface ConsultationRecord {
  id: string;
  data: string; // ISO or DD/MM/YYYY
  notas: string;
  antropometria: Anthropometry;
  dobras: Skinfolds;
  anamnese: Anamnese;
  exames: ExamesLab;
  energia: EnergyPlan;
  refeicoes?: Meal[];
  // Calculated stored metrics for quick comparison
  calculos: {
    imc: number;
    imcClass: string;
    rcq: number;
    rcqRisco: boolean;
    protocoloGordura: BodyFatProtocol;
    percGordura: number;
    massaGorda: number;
    massaMagra: number;
    somaDobras: number;
    tmb: number;
    get: number;
    vet: number;
  };
}

export interface Patient {
  id: string;
  nome: string;
  idade: number;
  sexo: Sex;
  cpf?: string;
  telefone?: string;
  email?: string;
  profissao?: string;
  objetivoPrincipal: string;
  dataCriacao: string;
  historico: ConsultationRecord[];
}

export interface ProfessionalProfile {
  nome: string;
  titulo: string;
  registro: string; // CRN
  clinica: string;
  contato: string;
  cidade: string;
}
