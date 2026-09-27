import React from 'react';
import { Patient, Consultation, ProfessionalProfile, MealPlan, CalculatedMetrics } from '../types';
import { sumMealNutrients, createDefaultMealPlan, ordenarRefeicoesPorHorario } from '../data/tacoFoods';
import { ArrowLeft, Droplet, Flame } from 'lucide-react';
import { PrintSheet } from './PrintSheet';

interface PrintMealPlanViewProps {
  patient: Patient;
  consultation: Consultation;
  profile: ProfessionalProfile;
  calculatedMetrics: CalculatedMetrics;
  onBackToApp: () => void;
}

export const PrintMealPlanView: React.FC<PrintMealPlanViewProps> = ({
  patient,
  consultation,
  profile,
  calculatedMetrics,
  onBackToApp,
}) => {
  const targetKcal = Math.round(calculatedMetrics.vet);
  const plan: MealPlan =
    consultation.mealPlan && consultation.mealPlan.refeicoes.length > 0
      ? consultation.mealPlan
      : createDefaultMealPlan(patient.id, targetKcal, consultation.anthropometry.weight || 70);

  const allItems = plan.refeicoes.flatMap((m) => m.alimentos);
  const totals = sumMealNutrients(allItems);

  const weight = consultation.anthropometry.weight || 70;
  const waterLiters = (plan.metaAguaMl / 1000).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 print:max-w-none print:p-0">
      {/* Barra de Ações (Oculta na impressão) */}
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
            Dica: No diálogo de impressão, escolha &quot;Salvar como PDF&quot;.
          </span>
        </div>
      </div>

      {/* Folha do Cardápio para Impressão */}
      <div className="print-doc bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200">
        <PrintSheet paciente={patient.name} clinica={profile.clinic} documento="Plano alimentar">
        {/* Cabeçalho Timbrado Profissional */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {profile.clinic || 'Clínica de Nutrição Clínica & Esportiva'}
            </h1>
            <p className="text-base font-bold text-emerald-800 mt-0.5">
              {profile.name} • {profile.crn}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Contato: {profile.phone} • {profile.email}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              Plano Alimentar Individualizado
            </span>
            <p className="text-xs text-slate-400 mt-1">Data: {consultation.date || new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* 1. Identificação do Paciente e Metas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold">Paciente:</span>
            <strong className="text-slate-900 text-sm">{patient.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Idade / Sexo:</span>
            <strong className="text-slate-900">
              {patient.age} anos • {patient.sex === 'M' ? 'Masculino' : 'Feminino'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Peso Atual:</span>
            <strong className="text-slate-900">{weight} kg</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Objetivo Principal:</span>
            <strong className="text-slate-900">{patient.objective}</strong>
          </div>
        </div>

        {/* 2. Banner de Metas (prescrição) x Total do cardápio */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl mb-6 text-xs space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-emerald-800 font-semibold block text-[11px] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Meta (VET)
              </span>
              <span className="font-mono font-black text-slate-900 text-base">{targetKcal} kcal</span>
            </div>

            <div>
              <span className="text-emerald-800 font-semibold block text-[11px]">Total do cardápio</span>
              <span className="font-mono font-black text-slate-900 text-base">
                {Math.round(totals.kcal)} kcal
              </span>
            </div>

            <div>
              <span className="text-emerald-800 font-semibold block text-[11px] flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-blue-500" /> Meta de Água
              </span>
              <span className="font-mono font-bold text-blue-700 text-sm">{waterLiters} Litros/dia</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-emerald-200/80">
            {[
              { rotulo: 'Proteínas', meta: calculatedMetrics.proteinGrams, total: totals.prot },
              { rotulo: 'Carboidratos', meta: calculatedMetrics.carbGrams, total: totals.carb },
              { rotulo: 'Gorduras', meta: calculatedMetrics.fatGrams, total: totals.lip },
            ].map((m) => (
              <div key={m.rotulo}>
                <span className="text-emerald-800 font-semibold block text-[11px]">{m.rotulo}</span>
                <span className="font-mono text-slate-900 block">
                  Meta: <strong>{Math.round(m.meta)} g</strong>
                  {weight > 0 && ` (${(m.meta / weight).toFixed(1)} g/kg)`}
                </span>
                <span className="font-mono text-slate-600 block">
                  Cardápio: <strong>{Math.round(m.total)} g</strong>
                  {weight > 0 && ` (${(m.total / weight).toFixed(1)} g/kg)`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Refeições Detalhadas */}
        <div className="space-y-5 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
            <span>Distribuição das Refeições Diárias</span>
            <span className="text-xs normal-case font-normal text-slate-500">
              Alimentos da Tabela TACO / Medidas Caseiras
            </span>
          </h2>

          {ordenarRefeicoesPorHorario(plan.refeicoes).map((meal, idx) => {
            const mTotals = sumMealNutrients(meal.alimentos);

            return (
              <div
                key={meal.id}
                className="border border-slate-200 rounded-xl overflow-hidden page-break-inside-avoid"
              >
                {/* Header da Refeição */}
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {idx + 1}. {meal.nome}
                    </span>
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-mono font-bold">
                      {meal.horario}
                    </span>
                  </div>
                  <div className="text-slate-600 font-mono text-xs">
                    <strong className="text-slate-900">{Math.round(mTotals.kcal)} kcal</strong> • P:{mTotals.prot.toFixed(1)}g • C:{mTotals.carb.toFixed(1)}g • G:{mTotals.lip.toFixed(1)}g
                  </div>
                </div>

                {/* Tabela de Alimentos da Refeição */}
                <div className="p-3">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                        <th className="py-1 px-2 font-bold">Alimento</th>
                        <th className="py-1 px-2 font-bold w-20">Porção</th>
                        <th className="py-1 px-2 font-bold">Medida Caseira</th>
                        <th className="py-1 px-2 font-bold text-right w-16">Kcal</th>
                        <th className="py-1 px-2 font-bold">Opção de Substituição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {meal.alimentos.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5 px-2 font-medium text-slate-900">
                            {item.nome}
                          </td>
                          <td className="py-1.5 px-2 font-mono text-slate-700">
                            {item.quantidadeG}g
                          </td>
                          <td className="py-1.5 px-2 text-slate-600">
                            {item.medidaCaseira || '--'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                            {Math.round(item.kcal)}
                          </td>
                          <td className="py-1.5 px-2 text-slate-500 italic text-[11px]">
                            {item.substituicoes || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {meal.observacoes && (
                    <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      <strong>Orientação da refeição:</strong> {meal.observacoes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Resumo de Micronutrientes Totais */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-6 text-xs page-break-inside-avoid">
          <h3 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
            Micronutrientes & Fibras Totais do Dia
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-slate-700">
            <div>
              <span className="text-slate-500 block text-[10px]">Fibras</span>
              <strong className="text-slate-900 font-mono text-sm">{totals.fibra.toFixed(1)}g</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Cálcio</span>
              <strong className="text-slate-900 font-mono text-sm">{Math.round(totals.calcio)} mg</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Ferro</span>
              <strong className="text-slate-900 font-mono text-sm">{totals.ferro.toFixed(1)} mg</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Potássio</span>
              <strong className="text-slate-900 font-mono text-sm">{Math.round(totals.potassio)} mg</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Magnésio</span>
              <strong className="text-slate-900 font-mono text-sm">{Math.round(totals.magnesio)} mg</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Vitamina C</span>
              <strong className="text-slate-900 font-mono text-sm">{Math.round(totals.vitc)} mg</strong>
            </div>
          </div>
        </div>

        {/* 5. Orientações Gerais e Recomendações */}
        <div className="border-t border-slate-300 pt-4 mb-8 text-xs text-slate-600 space-y-1.5 page-break-inside-avoid">
          <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">
            Orientações Gerais da Conduta Nutricional
          </h3>
          <p>
            • <strong>Hidratação:</strong> Ingerir ao menos {waterLiters}L de água filtrada ao longo do dia, longe das grandes refeições (evitar líquidos 30 minutos antes e 1 hora após almoço/jantar).
          </p>
          <p>
            • <strong>Mastigação:</strong> Alimente-se com calma, sem telas ou distrações. Mastigue bem os alimentos para otimizar a digestão enzimática e sinalização de saciedade.
          </p>
          <p>
            • <strong>Temperos Naturais:</strong> Utilize alho, cebola, açafrão, orégano, cheiro-verde e azeite extravirgem cru. Evite temperos ultraprocessados prontos ricos em sódio.
          </p>
          {plan.orientacoesGerais && (
            <p>• <strong>Nota específica:</strong> {plan.orientacoesGerais}</p>
          )}
        </div>

        {/* Assinatura do Profissional */}
        <div className="pt-10 flex flex-col items-center justify-center text-center page-break-inside-avoid">
          <div className="w-64 border-b border-slate-900 mb-1" />
          <p className="text-sm font-bold text-slate-900">{profile.name}</p>
          <p className="text-xs text-slate-600">{profile.crn} • Nutricionista Responsável</p>
        </div>
        </PrintSheet>
      </div>
    </div>
  );
};
