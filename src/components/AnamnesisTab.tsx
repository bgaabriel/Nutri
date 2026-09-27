import React from 'react';
import { Anamnesis, Patient, Sex } from '../types';
import { User, Activity, HeartPulse } from 'lucide-react';

interface AnamnesisTabProps {
  patient: Patient;
  anamnesis: Anamnesis;
  onUpdatePatient: (updated: Partial<Patient>) => void;
  onUpdateAnamnesis: (updated: Partial<Anamnesis>) => void;
}

export const AnamnesisTab: React.FC<AnamnesisTabProps> = ({
  patient,
  anamnesis,
  onUpdatePatient,
  onUpdateAnamnesis,
}) => {
  const updateLabExam = (field: keyof Anamnesis['labExams'], value: string) => {
    onUpdateAnamnesis({
      labExams: {
        ...anamnesis.labExams,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Perfil do Paciente */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">1. Identificação do Paciente</h2>
            <p className="text-xs text-slate-500">Dados cadastrais básicos e dados de contato</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              value={patient.name}
              onChange={(e) => onUpdatePatient({ name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Idade (anos)</label>
            <input
              type="number"
              value={patient.age}
              onChange={(e) => onUpdatePatient({ age: Number(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sexo Biológico</label>
            <select
              value={patient.sex}
              onChange={(e) => onUpdatePatient({ sex: e.target.value as Sex })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Objetivo Nutricional Principal
            </label>
            <input
              type="text"
              value={patient.objective}
              onChange={(e) => onUpdatePatient({ objective: e.target.value })}
              placeholder="Ex: Hipertrofia, Redução de Gordura Corporal, Dislipidemia"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              value={patient.phone || ''}
              onChange={(e) => onUpdatePatient({ phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              value={patient.email || ''}
              onChange={(e) => onUpdatePatient({ email: e.target.value })}
              placeholder="paciente@exemplo.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Anamnese Clínica e Estilo de Vida */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">2. Anamnese & Estilo de Vida</h2>
            <p className="text-xs text-slate-500">Hábitos diários, ritmo biológico e atividade física</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Qualidade do Sono</label>
            <input
              type="text"
              value={anamnesis.sleepHabit}
              onChange={(e) => onUpdateAnamnesis({ sleepHabit: e.target.value })}
              placeholder="Ex: 7 horas, sono agitado, acorda cansado..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ingestão Hídrica Média</label>
            <input
              type="text"
              value={anamnesis.waterIntakeLiters}
              onChange={(e) => onUpdateAnamnesis({ waterIntakeLiters: e.target.value })}
              placeholder="Ex: 1.5 a 2 Litros/dia"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hábito Intestinal (Escala Bristol)</label>
            <input
              type="text"
              value={anamnesis.bowelHabit}
              onChange={(e) => onUpdateAnamnesis({ bowelHabit: e.target.value })}
              placeholder="Ex: Diário, Bristol tipo 3 ou 4 / Constipado (3x/sem)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rotina de Treinos & Atividades Físicas
            </label>
            <input
              type="text"
              value={anamnesis.trainingRoutine}
              onChange={(e) => onUpdateAnamnesis({ trainingRoutine: e.target.value })}
              placeholder="Ex: Musculação 4x na semana + corrida 2x (moderada)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alergias, Intolerâncias e Aversões Alimentares
            </label>
            <input
              type="text"
              value={anamnesis.allergiesAversions}
              onChange={(e) => onUpdateAnamnesis({ allergiesAversions: e.target.value })}
              placeholder="Ex: Intolerância à lactose, alergia a camarão, aversão a coentro e fígado"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Histórico Clínico, Patologias e Medicamentos em Uso
            </label>
            <textarea
              rows={2}
              value={anamnesis.clinicalNotes}
              onChange={(e) => onUpdateAnamnesis({ clinicalNotes: e.target.value })}
              placeholder="Ex: Hipertensão em uso de Losartana 50mg, refluxo gastroesofágico, cirurgias prévias..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none resize-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Exames Laboratoriais */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">3. Exames Laboratoriais</h2>
            <p className="text-xs text-slate-500">Parâmetros bioquímicos e marcadores metabólicos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Glicemia de Jejum</label>
            <input
              type="text"
              value={anamnesis.labExams.fastingGlucose}
              onChange={(e) => updateLabExam('fastingGlucose', e.target.value)}
              placeholder="ex: 88 mg/dL"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Colesterol Total</label>
            <input
              type="text"
              value={anamnesis.labExams.totalCholesterol}
              onChange={(e) => updateLabExam('totalCholesterol', e.target.value)}
              placeholder="ex: 185 mg/dL"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">HDL-Colesterol</label>
            <input
              type="text"
              value={anamnesis.labExams.hdlCholesterol}
              onChange={(e) => updateLabExam('hdlCholesterol', e.target.value)}
              placeholder="ex: 52 mg/dL"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Triglicerídeos</label>
            <input
              type="text"
              value={anamnesis.labExams.triglycerides}
              onChange={(e) => updateLabExam('triglycerides', e.target.value)}
              placeholder="ex: 120 mg/dL"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Outros Exames e Marcadores (Hemograma, Ferritina, TSH, Vitamina D, etc.)
            </label>
            <textarea
              rows={2}
              value={anamnesis.labExams.otherExams}
              onChange={(e) => updateLabExam('otherExams', e.target.value)}
              placeholder="Ex: Vitamina D: 35 ng/mL, Ferritina: 90 ng/mL, Creatinina: 0.9 mg/dL, PCR ultrassensível: 0.8 mg/L"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none resize-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
