import { Appointment, Consultation, Patient, ProfessionalProfile } from './types';

const PATIENTS_STORAGE_KEY = 'nutripro_patients_v1';
const CONSULTATIONS_STORAGE_KEY = 'nutripro_consultations_v1';
const PROFILE_STORAGE_KEY = 'nutripro_profile_v1';
const APPOINTMENTS_STORAGE_KEY = 'nutripro_appointments_v1';

export const defaultProfile: ProfessionalProfile = {
  name: 'Dra. Marina Silva',
  crn: 'CRN-3 45920',
  clinic: 'Clínica NutriPro & Performance',
  phone: '(11) 98765-4321',
  email: 'dra.marina@nutripro.com.br',
};

const getIsoDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const initialAppointments: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'p1',
    patientName: 'João Silva',
    date: getIsoDate(0), // Hoje
    time: '09:00',
    durationMinutes: 60,
    type: 'retorno',
    status: 'confirmado',
    modality: 'presencial',
    notes: 'Avaliação de bioimpedância + ajuste do déficit calórico.',
    price: 250,
    paid: true,
  },
  {
    id: 'apt-2',
    patientId: 'p2',
    patientName: 'Beatriz Alcântara',
    date: getIsoDate(0), // Hoje
    time: '14:30',
    durationMinutes: 60,
    type: 'retorno',
    status: 'agendado',
    modality: 'presencial',
    notes: 'Apresentar novos exames de sangue (perfil lipídico e glicemia).',
    price: 250,
    paid: false,
  },
  {
    id: 'apt-3',
    patientId: 'p3',
    patientName: 'Carlos Eduardo Santos',
    date: getIsoDate(1), // Amanhã
    time: '10:00',
    durationMinutes: 90,
    type: 'antropometria',
    status: 'confirmado',
    modality: 'presencial',
    notes: 'Reavaliação de dobras cutâneas (protocolo 7 dobras) pré-competição.',
    price: 300,
    paid: true,
  },
  {
    id: 'apt-4',
    patientId: 'p1',
    patientName: 'João Silva',
    date: getIsoDate(7), // Próxima semana
    time: '11:00',
    durationMinutes: 45,
    type: 'ajuste_plano',
    status: 'agendado',
    modality: 'online',
    notes: 'Check-in semanal online e adaptação de pré-treino.',
    price: 180,
    paid: false,
  },
  {
    id: 'apt-5',
    patientId: 'p2',
    patientName: 'Beatriz Alcântara',
    date: getIsoDate(-3), // Passada
    time: '16:00',
    durationMinutes: 60,
    type: 'primeira_consulta',
    status: 'concluido',
    modality: 'presencial',
    notes: 'Anamnese completa e introdução ao plano alimentar.',
    price: 280,
    paid: true,
  },
];

export const initialPatients: Patient[] = [
  {
    id: 'p1',
    name: 'João Silva',
    age: 30,
    sex: 'M',
    phone: '(11) 99123-4567',
    email: 'joao.silva@email.com',
    objective: 'Hipertrofia & Redução de % Gordura',
    createdAt: '2026-01-10',
  },
  {
    id: 'p2',
    name: 'Beatriz Alcântara',
    age: 28,
    sex: 'F',
    phone: '(11) 98844-2211',
    email: 'beatriz.a@email.com',
    objective: 'Emagrecimento & Reeducação Alimentar',
    createdAt: '2026-02-15',
  },
  {
    id: 'p3',
    name: 'Carlos Eduardo Santos',
    age: 35,
    sex: 'M',
    phone: '(11) 97755-9988',
    email: 'cadu.santos@email.com',
    objective: 'Performance Esportiva (Triathlon)',
    createdAt: '2026-03-01',
  },
];

export const initialConsultations: Consultation[] = [
  {
    id: 'cons1',
    patientId: 'p1',
    date: '10/01/2026',
    title: 'Consulta Inicial (Avaliação Global)',
    anamnesis: {
      sleepHabit: '6 a 7 horas, sono agitado, acorda cansado',
      waterIntakeLiters: '1.2 Litros/dia',
      bowelHabit: 'Constipado (a cada 2-3 dias)',
      trainingRoutine: 'Musculação 2 a 3x na semana (baixa intensidade)',
      allergiesAversions: 'Intolerância moderada a lactose. Aversão a peixes e fígado.',
      clinicalNotes: 'Uso contínuo de Omeprazol em jejum. Queixa de azia pós-prandial.',
      labExams: {
        fastingGlucose: '98 mg/dL',
        totalCholesterol: '215 mg/dL',
        hdlCholesterol: '40 mg/dL',
        triglycerides: '165 mg/dL',
        otherExams: 'Vitamina D: 22 ng/mL (insuficiente), TSH: 2.1 mUI/L',
      },
    },
    anthropometry: {
      weight: 92.0,
      height: 175,
      circumferences: {
        neck: 42,
        waist: 98.0,
        abdomen: 104.0,
        hip: 108.0,
        relaxedArm: 34.0,
        thigh: 61.0,
        calf: 39.0,
      },
      skinfolds: {
        triceps: 16,
        subscapular: 22,
        chest: 14,
        midaxillary: 15,
        suprailiac: 26,
        abdominal: 32,
        thigh: 25,
      },
      fatProtocol: 'marinha',
    },
    prescription: {
      bmrFormula: 'mifflin',
      activityFactorPreset: '1.375',
      activityFactor: 1.375,
      targetKcalAdjustment: -400,
      proteinGKg: 1.8,
      carbGKg: 2.8,
      fatGKg: 0.8,
    },
  },
  {
    id: 'cons2',
    patientId: 'p1',
    date: '10/04/2026',
    title: 'Retorno 90 dias (Evolução 1)',
    anamnesis: {
      sleepHabit: '7 horas regulares, melhora na disposição matinal',
      waterIntakeLiters: '2.0 Litros/dia',
      bowelHabit: 'Regularizado (diário)',
      trainingRoutine: 'Musculação 4x/semana + 20min cardio 3x',
      allergiesAversions: 'Sem lactose na rotina, boa adaptação aos substitutos',
      clinicalNotes: 'Desmame de Omeprazol iniciado com médico. Sem queixas de azia.',
      labExams: {
        fastingGlucose: '91 mg/dL',
        totalCholesterol: '185 mg/dL',
        hdlCholesterol: '46 mg/dL',
        triglycerides: '128 mg/dL',
        otherExams: 'Vitamina D: 38 ng/mL (adequado)',
      },
    },
    anthropometry: {
      weight: 88.5,
      height: 175,
      circumferences: {
        neck: 41,
        waist: 92.0,
        abdomen: 98.0,
        hip: 105.0,
        relaxedArm: 33.5,
        thigh: 59.5,
        calf: 38.5,
      },
      skinfolds: {
        triceps: 14,
        subscapular: 19,
        chest: 12,
        midaxillary: 12,
        suprailiac: 22,
        abdominal: 28,
        thigh: 21,
      },
      fatProtocol: 'marinha',
    },
    prescription: {
      bmrFormula: 'mifflin',
      activityFactorPreset: '1.55',
      activityFactor: 1.55,
      targetKcalAdjustment: -450,
      proteinGKg: 2.0,
      carbGKg: 3.0,
      fatGKg: 0.75,
    },
  },
];

export function loadPatients(): Patient[] {
  try {
    const saved = localStorage.getItem(PATIENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao carregar pacientes do localStorage', e);
  }
  savePatients(initialPatients);
  return initialPatients;
}

export function savePatients(patients: Patient[]) {
  try {
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
  } catch (e) {
    console.error('Erro ao salvar pacientes', e);
  }
}

export function loadConsultations(): Consultation[] {
  try {
    const saved = localStorage.getItem(CONSULTATIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao carregar consultas do localStorage', e);
  }
  saveConsultations(initialConsultations);
  return initialConsultations;
}

export function saveConsultations(consultations: Consultation[]) {
  try {
    localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(consultations));
  } catch (e) {
    console.error('Erro ao salvar consultas', e);
  }
}

export function loadAppointments(): Appointment[] {
  try {
    const saved = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao carregar agendamentos do localStorage', e);
  }
  saveAppointments(initialAppointments);
  return initialAppointments;
}

export function saveAppointments(appointments: Appointment[]) {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error('Erro ao salvar agendamentos', e);
  }
}

export function loadProfile(): ProfessionalProfile {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Erro ao carregar perfil', e);
  }
  return defaultProfile;
}

export function saveProfile(profile: ProfessionalProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Erro ao salvar perfil', e);
  }
}

export function exportBackupData(): string {
  const data = {
    version: '1.1',
    exportDate: new Date().toISOString(),
    profile: loadProfile(),
    patients: loadPatients(),
    consultations: loadConsultations(),
    appointments: loadAppointments(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.patients && Array.isArray(parsed.patients)) {
      savePatients(parsed.patients);
    }
    if (parsed.consultations && Array.isArray(parsed.consultations)) {
      saveConsultations(parsed.consultations);
    }
    if (parsed.appointments && Array.isArray(parsed.appointments)) {
      saveAppointments(parsed.appointments);
    }
    if (parsed.profile) {
      saveProfile(parsed.profile);
    }
    return true;
  } catch (err) {
    console.error('Erro ao importar backup:', err);
    return false;
  }
}
