import React from 'react';
import {
  Patient,
  Consultation,
  ProfessionalProfile,
  Anamnesis,
  Anthropometry,
  EnergyPrescription,
  CalculatedMetrics,
  MealPlan,
} from '../types';
import { AnamnesisTab } from './AnamnesisTab';
import { AnthropometryTab } from './AnthropometryTab';
import { MetabolismTab } from './MetabolismTab';
import { MealPlannerTab } from './MealPlannerTab';
import { ComparativeTab } from './ComparativeTab';
import { PrintReportView } from './PrintReportView';
import { PrintMealPlanView } from './PrintMealPlanView';
import { PrintEvolutionReportView } from './PrintEvolutionReportView';
import {
  ArrowLeft,
  FileText,
  Scale,
  Flame,
  Utensils,
  GitCompare,
  Printer,
  Save,
  Users,
  ChevronRight,
  Sparkles,
  Phone,
} from 'lucide-react';

export type ClinicalStage =
  | 'anamnese'
  | 'antropometria'
  | 'metabolismo'
  | 'cardapio'
  | 'comparativo'
  | 'relatorio'
  | 'imprimirCardapio'
  | 'evolucaoPdf';

interface PatientRecordViewProps {
  patient: Patient;
  consultation: Consultation;
  consultationHistory: Consultation[];
  profile: ProfessionalProfile;
  calculatedMetrics: CalculatedMetrics;
  activeStage: ClinicalStage;
  onChangeStage: (stage: ClinicalStage) => void;
  onBackToPatients: () => void;
  onOpenSwitchPatientModal: () => void;
  onSaveConsultation: () => void;
  onUpdatePatient: (updatedFields: Partial<Patient>) => void;
  onUpdateAnamnesis: (updated: Partial<Anamnesis>) => void;
  onUpdateAnthropometry: (updated: Partial<Anthropometry>) => void;
  onUpdatePrescription: (updated: Partial<EnergyPrescription>) => void;
  onUpdateMealPlan: (plan: MealPlan) => void;
  onLoadConsultation: (session: Consultation) => void;
  onDeleteConsultation: (id: string) => void;
}

export const PatientRecordView: React.FC<PatientRecordViewProps> = ({
  patient,
  consultation,
  consultationHistory,
  profile,
  calculatedMetrics,
  activeStage,
  onChangeStage,
  onBackToPatients,
  onOpenSwitchPatientModal,
  onSaveConsultation,
  onUpdatePatient,
  onUpdateAnamnesis,
  onUpdateAnthropometry,
  onUpdatePrescription,
  onUpdateMealPlan,
  onLoadConsultation,
  onDeleteConsultation,
}) => {
  const stages: { id: ClinicalStage; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'anamnese', label: '1. Dados & Anamnese', icon: FileText },
    { id: 'antropometria', label: '2. Antropometria & Medidas', icon: Scale },
    { id: 'metabolismo', label: '3. Gasto Energético & VET', icon: Flame },
    { id: 'cardapio', label: '4. Montagem de Cardápio (TACO)', icon: Utensils },
    { id: 'comparativo', label: '5. Evolução & Comparativo', icon: GitCompare },
    { id: 'relatorio', label: '6. Relatório do Paciente', icon: Printer },
    { id: 'evolucaoPdf', label: '7. PDF de Toda a Evolução', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Patient Card Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        {/* Breadcrumb row */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              onClick={onBackToPatients}
              className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lista de Pacientes</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">Prontuário de {patient.name}</span>
          </div>

          {/* Quick Header Actions: Botões de Imprimir e Salvar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenSwitchPatientModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Trocar Paciente</span>
            </button>

            <button
              onClick={onSaveConsultation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Consulta</span>
            </button>

            {/* Botão de Imprimir Cardápio */}
            <button
              onClick={() => {
                onChangeStage('imprimirCardapio');
                setTimeout(() => {
                  window.print();
                }, 200);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-all cursor-pointer"
              title="Imprimir Cardápio e Dieta Prescrita"
            >
              <Utensils className="w-3.5 h-3.5 text-emerald-700" />
              <span>Imprimir Cardápio</span>
            </button>

            {/* Botão de Imprimir Relatório do Paciente */}
            <button
              onClick={() => {
                onChangeStage('relatorio');
                setTimeout(() => {
                  window.print();
                }, 200);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
              title="Imprimir Laudo Clínico e Antropometria Completa"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir Relatório</span>
            </button>

          </div>
        </div>

        {/* Patient identity strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-2xs ${
                patient.sex === 'M' ? 'bg-emerald-600' : 'bg-teal-600'
              }`}
            >
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {patient.name}
                </h1>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
                  {patient.age} anos • {patient.sex === 'M' ? 'Masculino' : 'Feminino'}
                </span>
                {patient.phone && (
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {patient.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                  {patient.objective || 'Avaliação Nutricional'}
                </span>
                <span>•</span>
                <span>Consulta Ativa: <strong>{consultation.date}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge from Current draft */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Peso</span>
              <span className="font-black text-slate-900 text-sm">
                {consultation.anthropometry.weight.toFixed(1)} kg
              </span>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">IMC</span>
              <span className="font-black text-slate-900 text-sm">
                {calculatedMetrics.imc.toFixed(1)}
              </span>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">% Gordura</span>
              <span className="font-black text-emerald-700 text-sm">
                {calculatedMetrics.bodyFatPercent > 0
                  ? `${calculatedMetrics.bodyFatPercent.toFixed(1)}%`
                  : '--'}
              </span>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">VET Meta</span>
              <span className="font-black text-slate-900 text-sm">
                {calculatedMetrics.vet > 0 ? `${Math.round(calculatedMetrics.vet)} kcal` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Stages Segmented Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isCurrent = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => onChangeStage(stage.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Clinical Stage Component Render */}
      <div className="min-h-[400px]">
        {activeStage === 'anamnese' && (
          <div className="space-y-6">
            <AnamnesisTab
              patient={patient}
              anamnesis={consultation.anamnesis}
              onUpdatePatient={onUpdatePatient}
              onUpdateAnamnesis={onUpdateAnamnesis}
            />
            {/* Step navigation prompt */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => onChangeStage('antropometria')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Avançar para 2. Antropometria & Medidas</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStage === 'antropometria' && (
          <div className="space-y-6">
            <AnthropometryTab
              anthropometry={consultation.anthropometry}
              calculated={calculatedMetrics}
              onUpdateAnthropometry={onUpdateAnthropometry}
            />
            {/* Step navigation prompts */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onChangeStage('anamnese')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para 1. Dados & Anamnese</span>
              </button>
              <button
                onClick={() => onChangeStage('metabolismo')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Avançar para 3. Gasto Energético & VET</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStage === 'metabolismo' && (
          <div className="space-y-6">
            <MetabolismTab
              prescription={consultation.prescription}
              calculated={calculatedMetrics}
              peso={consultation.anthropometry.weight}
              onUpdatePrescription={onUpdatePrescription}
            />
            {/* Step navigation prompts */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onChangeStage('antropometria')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para 2. Antropometria</span>
              </button>
              <button
                onClick={() => onChangeStage('cardapio')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Avançar para 4. Montagem de Cardápio (TACO)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStage === 'cardapio' && (
          <div className="space-y-6">
            <MealPlannerTab
              patient={patient}
              consultation={consultation}
              calculatedMetrics={calculatedMetrics}
              onUpdateMealPlan={onUpdateMealPlan}
            />
            {/* Step navigation prompts */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onChangeStage('metabolismo')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para 3. Gasto Energético</span>
              </button>
              <button
                onClick={() => onChangeStage('comparativo')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Avançar para 5. Evolução & Comparativo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStage === 'comparativo' && (
          <div className="space-y-6">
            <ComparativeTab
              patient={patient}
              currentConsultation={consultation}
              consultationHistory={consultationHistory}
              onLoadConsultation={onLoadConsultation}
              onDeleteConsultation={onDeleteConsultation}
            />
            {/* Step navigation prompts */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onChangeStage('cardapio')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para 4. Montagem de Cardápio</span>
              </button>
              <button
                onClick={() => onChangeStage('relatorio')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Avançar para 6. Relatório do Paciente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStage === 'relatorio' && (
          <div className="space-y-6">
            <PrintReportView
              patient={patient}
              consultation={consultation}
              profile={profile}
              calculatedMetrics={calculatedMetrics}
              onBackToApp={() => onChangeStage('cardapio')}
            />
          </div>
        )}

        {activeStage === 'evolucaoPdf' && (
          <div className="space-y-6">
            <PrintEvolutionReportView
              patient={patient}
              currentConsultation={consultation}
              consultationHistory={consultationHistory}
              profile={profile}
              calculatedMetrics={calculatedMetrics}
              onBackToApp={() => onChangeStage('comparativo')}
            />
          </div>
        )}

        {activeStage === 'imprimirCardapio' && (
          <div className="space-y-6">
            <PrintMealPlanView
              patient={patient}
              consultation={consultation}
              profile={profile}
              calculatedMetrics={calculatedMetrics}
              onBackToApp={() => onChangeStage('cardapio')}
            />
          </div>
        )}
      </div>
    </div>
  );
};
