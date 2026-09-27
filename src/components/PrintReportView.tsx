import React from 'react';
import { CalculatedMetrics, Consultation, Patient, ProfessionalProfile } from '../types';
import { formatarVariacaoPercentual, NOMES_FORMULA_TMB, variacaoPesoHabitual } from '../calculations';
import { ArrowLeft } from 'lucide-react';
import { PrintSheet } from './PrintSheet';

interface PrintReportViewProps {
  patient: Patient;
  consultation: Consultation;
  profile: ProfessionalProfile;
  calculatedMetrics: CalculatedMetrics;
  onBackToApp: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  patient,
  consultation,
  profile,
  calculatedMetrics,
  onBackToApp,
}) => {
  const calc = calculatedMetrics;
  const peso = consultation.anthropometry.weight;
  const gKg = (gramas: number) => (peso > 0 ? (gramas / peso).toFixed(1) : '--');
  const pctVet = (kcal: number) => (calc.vet > 0 ? Math.round((kcal / calc.vet) * 100) : 0);
  const variacaoHabitual = variacaoPesoHabitual(
    consultation.anthropometry.weight,
    consultation.anthropometry.usualWeight
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 print:max-w-none print:p-0">
      {/* Action Bar (Hidden on print) */}
      <div className="no-print flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl mb-6 shadow-xs">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Prontuário</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Dica: Na janela de impressão, selecione &quot;Salvar como PDF&quot;.
          </span>
        </div>
      </div>

      {/* Printable Sheet (Stylized for both screen preview and print) */}
      <div className="print-doc bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200">
        <PrintSheet paciente={patient.name} clinica={profile.clinic} documento="Relatório de avaliação nutricional">
        {/* Cabecalho Timbrado */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Relatório de Avaliação Nutricional
            </h1>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              Prontuário Clínico & Prescrição Dietoterápica
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-slate-900">{profile.name}</p>
            <p className="text-xs font-semibold text-emerald-800">{profile.crn}</p>
            <p className="text-xs text-slate-600">{profile.clinic}</p>
            <p className="text-xs text-slate-500">{profile.phone} • {profile.email}</p>
          </div>
        </div>

        {/* 1. Identificação do Paciente */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Paciente</span>
              <span className="text-sm font-bold text-slate-900">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Idade / Sexo</span>
              <span className="text-sm font-semibold text-slate-800">
                {patient.age} anos • {patient.sex === 'M' ? 'Masculino' : 'Feminino'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Data da Consulta</span>
              <span className="text-sm font-semibold text-slate-800">{consultation.date}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Objetivo</span>
              <span className="text-sm font-semibold text-slate-800">
                {patient.objective || 'Avaliação Nutricional'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Anamnese e Dados Clínicos */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 mb-2 border-b border-slate-200">
            1. Anamnese & Rotina de Vida
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-600">Profissão / Trabalho:</span>{' '}
              <span className="text-slate-900">{consultation.anamnesis.occupation || 'Não informado'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Rotina de trabalho:</span>{' '}
              <span className="text-slate-900">{consultation.anamnesis.workRoutine || 'Não informado'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Sono:</span>{' '}
              <span className="text-slate-900">{consultation.anamnesis.sleepHabit || 'Não informado'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Hidratação:</span>{' '}
              <span className="text-slate-900">{consultation.anamnesis.waterIntakeLiters || 'Não informado'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Hábito Intestinal:</span>{' '}
              <span className="text-slate-900">{consultation.anamnesis.bowelHabit || 'Não informado'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Atividade Física:</span>{' '}
              <span className="text-slate-900">{consultation.anamnesis.trainingRoutine || 'Não informado'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-600">Alergias / Aversões:</span>{' '}
              <span className="text-slate-900">{consultation.anamnesis.allergiesAversions || 'Nenhuma declarada'}</span>
            </div>
            {consultation.anamnesis.clinicalNotes && (
              <div className="col-span-2">
                <span className="font-semibold text-slate-600">Observações Clínicas:</span>{' '}
                <span className="text-slate-900">{consultation.anamnesis.clinicalNotes}</span>
              </div>
            )}
            {consultation.anamnesis.foodRecall && (
              <div className="col-span-2">
                <span className="font-semibold text-slate-600 block mb-0.5">Recordatório Alimentar:</span>
                <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                  {consultation.anamnesis.foodRecall}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Antropometria & Composição Corporal */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 mb-3 border-b border-slate-200">
            2. Avaliação Antropométrica & Diagnóstico Corporal
          </h2>

          <div className="grid grid-cols-4 gap-3 mb-4 text-center">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Peso Atual</span>
              <span className="text-base font-extrabold text-slate-900">
                {consultation.anthropometry.weight.toFixed(1)} kg
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Estatura</span>
              <span className="text-base font-extrabold text-slate-900">
                {consultation.anthropometry.height} cm
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">IMC</span>
              <span className="text-base font-extrabold text-slate-900">
                {calc.imc.toFixed(1)} <span className="text-[10px] font-normal">({calc.imcClassification})</span>
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">RCQ</span>
              <span className="text-base font-extrabold text-slate-900">
                {calc.rcq > 0 ? calc.rcq.toFixed(2) : '--'}
              </span>
            </div>
          </div>

          {consultation.anthropometry.usualWeight ? (
            <div className="grid grid-cols-2 gap-3 mb-4 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Peso Habitual</span>
                <span className="text-base font-extrabold text-slate-900">
                  {consultation.anthropometry.usualWeight.toFixed(1)} kg
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Variação em relação ao habitual
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {variacaoHabitual !== null ? formatarVariacaoPercentual(variacaoHabitual) : '--'}
                </span>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                % Gordura Corporal ({consultation.anthropometry.fatProtocol.toUpperCase()})
              </span>
              <span className="text-lg font-black text-emerald-900">
                {calc.bodyFatPercent > 0 ? `${calc.bodyFatPercent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Massa Gorda</span>
              <span className="text-lg font-black text-slate-900">
                {calc.fatMassKg > 0 ? `${calc.fatMassKg.toFixed(1)} kg` : '--'}
              </span>
            </div>
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Massa Magra</span>
              <span className="text-lg font-black text-blue-900">
                {calc.leanMassKg > 0 ? `${calc.leanMassKg.toFixed(1)} kg` : '--'}
              </span>
            </div>
          </div>

          {/* Tabela de Circunferências e Dobras */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-slate-700 mb-1">Circunferências (cm):</p>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1">Peito / Tórax:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.chest || '--'} cm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pescoço:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.neck || '--'} cm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Cintura:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.waist || '--'} cm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Abdômen:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.abdomen || '--'} cm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Quadril:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.hip || '--'} cm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Braço Relaxado:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.relaxedArm || '--'} cm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Coxa:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.thigh || '--'} cm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Panturrilha:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.circumferences.calf || '--'} cm</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="font-bold text-slate-700 mb-1">Dobras Cutâneas (mm):</p>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1">Tríceps:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.skinfolds.triceps || '--'} mm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Subescapular:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.skinfolds.subscapular || '--'} mm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Supra-ilíaca:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.skinfolds.suprailiac || '--'} mm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Abdominal:</td>
                    <td className="py-1 font-bold text-right">{consultation.anthropometry.skinfolds.abdominal || '--'} mm</td>
                  </tr>
                  <tr>
                    <td className="py-1">Soma 7 Dobras:</td>
                    <td className="py-1 font-bold text-right">{calc.skinfoldsSum7 || '--'} mm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Prescrição Energética e Metas Nutricionais */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 mb-3 border-b border-slate-200">
            3. Planejamento Energético & Prescrição Dietética
          </h2>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center mb-3">
            <div>
              <span className="text-xs text-slate-600 block">Taxa Metabólica Basal (TMB):</span>
              <span className="text-sm font-bold text-slate-900">{Math.round(calc.chosenBmr)} kcal/dia</span>
              <span className="text-[10px] text-slate-500 block">
                Fórmula: {NOMES_FORMULA_TMB[consultation.prescription.bmrFormula] ?? 'Mifflin-St Jeor'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-600 block">Gasto Total Estimado (GET):</span>
              <span className="text-sm font-bold text-slate-900">{Math.round(calc.get)} kcal/dia</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-800 font-bold block uppercase">Meta Prescrita (VET):</span>
              <span className="text-xl font-black text-emerald-900">{Math.round(calc.vet)} kcal/dia</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2 border border-slate-200 rounded">
              <span className="font-bold text-slate-700 block">Proteínas</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {calc.proteinGrams}g
              </span>
              <span className="text-[11px] text-slate-500">
                {gKg(calc.proteinGrams)} g/kg • {pctVet(calc.proteinKcal)}% do VET ({calc.proteinKcal} kcal)
              </span>
            </div>

            <div className="p-2 border border-slate-200 rounded">
              <span className="font-bold text-slate-700 block">Carboidratos</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {calc.carbGrams}g
              </span>
              <span className="text-[11px] text-slate-500">
                {gKg(calc.carbGrams)} g/kg • {pctVet(calc.carbKcal)}% do VET ({calc.carbKcal} kcal)
              </span>
            </div>

            <div className="p-2 border border-slate-200 rounded">
              <span className="font-bold text-slate-700 block">Lipídios</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {calc.fatGrams}g
              </span>
              <span className="text-[11px] text-slate-500">
                {gKg(calc.fatGrams)} g/kg • {pctVet(calc.fatKcal)}% do VET ({calc.fatKcal} kcal)
              </span>
            </div>
          </div>
        </div>

        {/* Assinatura e Carimbo */}
        <div className="pt-8 mt-8 border-t border-slate-300 flex justify-between items-end text-xs">
          <div>
            <p className="text-slate-500">Documento gerado e validado em:</p>
            <p className="font-semibold text-slate-800">
              {new Date().toLocaleDateString('pt-BR')} • {profile.clinic}
            </p>
          </div>

          <div className="text-center w-64">
            <div className="border-b border-slate-400 pb-1 mb-1">
              <p className="font-bold text-slate-900">{profile.name}</p>
              <p className="text-[11px] text-slate-600">{profile.crn}</p>
            </div>
            <p className="text-[10px] text-slate-500">Assinatura & Carimbo do Profissional</p>
          </div>
        </div>
        </PrintSheet>
      </div>
    </div>
  );
};
