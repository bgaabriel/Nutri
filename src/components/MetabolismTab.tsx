import React from 'react';
import { BmrFormula, CalculatedMetrics, EnergyPrescription, MacroMode } from '../types';
import { Flame, PieChart } from 'lucide-react';
import { ActivityFactorStepper } from './ActivityFactorStepper';

interface MetabolismTabProps {
  prescription: EnergyPrescription;
  calculated: CalculatedMetrics;
  /** Peso atual (kg), para converter entre g/kg e % do VET */
  peso: number;
  onUpdatePrescription: (updated: Partial<EnergyPrescription>) => void;
}

export const MetabolismTab: React.FC<MetabolismTabProps> = ({
  prescription,
  calculated,
  peso,
  onUpdatePrescription,
}) => {
  // Aviso de soma só quando os três macros estão em %
  const somaPercentuais =
    prescription.proteinMode === 'percent' &&
    prescription.carbMode === 'percent' &&
    prescription.fatMode === 'percent'
      ? (prescription.proteinPercent || 0) + (prescription.carbPercent || 0) + (prescription.fatPercent || 0)
      : null;

  const totalMacroKcal = calculated.proteinKcal + calculated.carbKcal + calculated.fatKcal;
  const pProt = totalMacroKcal > 0 ? (calculated.proteinKcal / totalMacroKcal) * 100 : 0;
  const pCarb = totalMacroKcal > 0 ? (calculated.carbKcal / totalMacroKcal) * 100 : 0;
  const pFat = totalMacroKcal > 0 ? (calculated.fatKcal / totalMacroKcal) * 100 : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 6. TMB e Gasto Energético */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">6. Taxa Metabólica Basal (TMB) & Gasto Energético</h2>
            <p className="text-xs text-slate-500">
              Comparativo de fórmulas preditivas e prescrição calórica
            </p>
          </div>
        </div>

        {/* Tabela de Fórmulas */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="pb-2.5 font-bold">Equação Preditiva</th>
                <th className="pb-2.5 font-bold">TMB Estimada</th>
                <th className="pb-2.5 font-bold">Indicação Clínica</th>
                <th className="pb-2.5 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className={prescription.bmrFormula === 'mifflin' ? 'bg-emerald-50/50' : ''}>
                <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                  <span>Mifflin-St Jeor (1990)</span>
                  {calculated.imc >= 25 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                      Recomendada p/ Sobrepeso
                    </span>
                  )}
                </td>
                <td className="py-3 font-mono font-bold text-slate-900">
                  {Math.round(calculated.bmrMifflin)} kcal
                </td>
                <td className="py-3 text-xs text-slate-500">Adultos gerais, sobrepeso e obesidade</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onUpdatePrescription({ bmrFormula: 'mifflin' })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      prescription.bmrFormula === 'mifflin'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {prescription.bmrFormula === 'mifflin' ? 'Adotada ✓' : 'Adotar'}
                  </button>
                </td>
              </tr>

              <tr className={prescription.bmrFormula === 'harris' ? 'bg-emerald-50/50' : ''}>
                <td className="py-3 font-semibold text-slate-900">Harris-Benedict (Revisada 1984)</td>
                <td className="py-3 font-mono font-bold text-slate-900">
                  {Math.round(calculated.bmrHarris)} kcal
                </td>
                <td className="py-3 text-xs text-slate-500">População eutrófica geral e prática clínica tradicional</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onUpdatePrescription({ bmrFormula: 'harris' })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      prescription.bmrFormula === 'harris'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {prescription.bmrFormula === 'harris' ? 'Adotada ✓' : 'Adotar'}
                  </button>
                </td>
              </tr>

              <tr className={prescription.bmrFormula === 'fao' ? 'bg-emerald-50/50' : ''}>
                <td className="py-3 font-semibold text-slate-900">FAO / WHO / UNU</td>
                <td className="py-3 font-mono font-bold text-slate-900">
                  {calculated.bmrFao > 0 ? `${Math.round(calculated.bmrFao)} kcal` : '--'}
                </td>
                <td className="py-3 text-xs text-slate-500">Diretrizes internacionais por faixa etária</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onUpdatePrescription({ bmrFormula: 'fao' })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      prescription.bmrFormula === 'fao'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {prescription.bmrFormula === 'fao' ? 'Adotada ✓' : 'Adotar'}
                  </button>
                </td>
              </tr>

              {calculated.bmrCunningham && (
                <tr className={prescription.bmrFormula === 'cunningham' ? 'bg-emerald-50/50' : ''}>
                  <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span>Cunningham (Massa Magra)</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold">
                      Atletas & Composição
                    </span>
                  </td>
                  <td className="py-3 font-mono font-bold text-blue-700">
                    {Math.round(calculated.bmrCunningham)} kcal
                  </td>
                  <td className="py-3 text-xs text-slate-500">
                    Baseada em {calculated.leanMassKg.toFixed(1)} kg de massa magra
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onUpdatePrescription({ bmrFormula: 'cunningham' })}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        prescription.bmrFormula === 'cunningham'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {prescription.bmrFormula === 'cunningham' ? 'Adotada ✓' : 'Adotar'}
                    </button>
                  </td>
                </tr>
              )}

              {(
                [
                  {
                    id: 'tinsley_peso' as const,
                    nome: 'Tinsley (Peso Corporal)',
                    valor: calculated.bmrTinsleyPeso,
                    base: null as string | null,
                  },
                  {
                    id: 'tinsley_mlg' as const,
                    nome: 'Tinsley (Massa Livre de Gordura)',
                    valor: calculated.bmrTinsleyMlg,
                    base: `Baseada em ${calculated.leanMassKg.toFixed(1)} kg de massa livre de gordura`,
                  },
                ]
              )
                .filter((f) => f.valor && f.valor > 0)
                .map((f) => (
                  <tr key={f.id} className={prescription.bmrFormula === f.id ? 'bg-emerald-50/50' : ''}>
                    <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span>{f.nome}</span>
                      <span className="bg-violet-100 text-violet-800 text-[10px] px-2 py-0.5 rounded font-bold">
                        Atletas / Hipertrofia
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-violet-700">{Math.round(f.valor || 0)} kcal</td>
                    <td className="py-3 text-xs text-slate-500">
                      Praticantes de musculação e atletas de físico
                      {f.base && <span className="block">{f.base}</span>}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onUpdatePrescription({ bmrFormula: f.id })}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          prescription.bmrFormula === f.id
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {prescription.bmrFormula === f.id ? 'Adotada ✓' : 'Adotar'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Configurações do VET */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fórmula Adotada (Prescrição)
            </label>
            <select
              value={prescription.bmrFormula}
              onChange={(e) => onUpdatePrescription({ bmrFormula: e.target.value as BmrFormula })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            >
              <option value="mifflin">Mifflin-St Jeor</option>
              <option value="harris">Harris-Benedict</option>
              <option value="fao">FAO / WHO / UNU</option>
              {calculated.bmrCunningham && <option value="cunningham">Cunningham (Massa Magra)</option>}
              {calculated.bmrTinsleyPeso > 0 && (
                <option value="tinsley_peso">Tinsley (Peso Corporal)</option>
              )}
              {calculated.bmrTinsleyMlg && (
                <option value="tinsley_mlg">Tinsley (Massa Livre de Gordura)</option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="fator-atividade" className="block text-xs font-semibold text-slate-700 mb-1">
              Fator de Atividade (FA)
            </label>
            <ActivityFactorStepper
              id="fator-atividade"
              value={prescription.activityFactor || 1}
              onChange={(activityFactor) => onUpdatePrescription({ activityFactor })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ajuste de Meta (kcal)
            </label>
            <input
              type="number"
              step="50"
              value={prescription.targetKcalAdjustment}
              onChange={(e) =>
                onUpdatePrescription({ targetKcalAdjustment: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
            {/* Quick adjust chips */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button
                type="button"
                onClick={() => onUpdatePrescription({ targetKcalAdjustment: -500 })}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                -500 (Déficit)
              </button>
              <button
                type="button"
                onClick={() => onUpdatePrescription({ targetKcalAdjustment: -300 })}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                -300 (Leve)
              </button>
              <button
                type="button"
                onClick={() => onUpdatePrescription({ targetKcalAdjustment: 0 })}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                0 (Manutenção)
              </button>
              <button
                type="button"
                onClick={() => onUpdatePrescription({ targetKcalAdjustment: 300 })}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                +300 (Superávit)
              </button>
            </div>
          </div>
        </div>

        {/* Destaque GET e VET */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-bold">
              Gasto Energético Total (GET)
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Math.round(calculated.get)} <span className="text-sm font-normal text-slate-500">kcal/dia</span>
            </span>
            <p className="text-[11px] text-slate-500">
              TMB ({Math.round(calculated.chosenBmr)} kcal) × FA ({prescription.activityFactor})
            </p>
          </div>

          <div className="h-10 w-px bg-slate-200 hidden md:block" />

          <div className="space-y-1 text-center md:text-right">
            <span className="text-xs text-emerald-800 block uppercase tracking-wider font-bold">
              Meta Prescrita / VET Diário
            </span>
            <span className="text-3xl font-black text-emerald-700 font-mono">
              {Math.round(calculated.vet)} <span className="text-sm font-normal text-slate-600">kcal</span>
            </span>
            <p className="text-[11px] text-slate-600 font-medium">
              {prescription.targetKcalAdjustment < 0
                ? `Déficit de ${Math.abs(prescription.targetKcalAdjustment)} kcal planejado`
                : prescription.targetKcalAdjustment > 0
                ? `Superávit de +${prescription.targetKcalAdjustment} kcal planejado`
                : 'Estratégia normocalórica'}
            </p>
          </div>
        </div>
      </div>

      {/* 7. Distribuição de Macronutrientes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">7. Prescrição de Macronutrientes (g/kg & VET)</h2>
            <p className="text-xs text-slate-500">
              Divisão dietética estratégica para o plano alimentar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
          <MacroCard
            titulo="Proteínas"
            corTitulo="text-emerald-800"
            corEtiqueta="bg-emerald-100 text-emerald-800"
            kcalPorGrama={4}
            modo={prescription.proteinMode ?? 'gkg'}
            gKg={prescription.proteinGKg}
            percentual={prescription.proteinPercent}
            passoGKg={0.1}
            gramas={calculated.proteinGrams}
            kcal={calculated.proteinKcal}
            peso={peso}
            vet={calculated.vet}
            onChange={(v) =>
              onUpdatePrescription({
                ...(v.modo !== undefined && { proteinMode: v.modo }),
                ...(v.gKg !== undefined && { proteinGKg: v.gKg }),
                ...(v.percentual !== undefined && { proteinPercent: v.percentual }),
              })
            }
          />
          <MacroCard
            titulo="Carboidratos"
            corTitulo="text-blue-800"
            corEtiqueta="bg-blue-100 text-blue-800"
            kcalPorGrama={4}
            modo={prescription.carbMode ?? 'gkg'}
            gKg={prescription.carbGKg}
            percentual={prescription.carbPercent}
            passoGKg={0.1}
            gramas={calculated.carbGrams}
            kcal={calculated.carbKcal}
            peso={peso}
            vet={calculated.vet}
            dica="Deixe em 0 para completar o VET"
            onChange={(v) =>
              onUpdatePrescription({
                ...(v.modo !== undefined && { carbMode: v.modo }),
                ...(v.gKg !== undefined && { carbGKg: v.gKg }),
                ...(v.percentual !== undefined && { carbPercent: v.percentual }),
              })
            }
          />
          <MacroCard
            titulo="Lipídios / Gorduras"
            corTitulo="text-amber-800"
            corEtiqueta="bg-amber-100 text-amber-800"
            kcalPorGrama={9}
            modo={prescription.fatMode ?? 'gkg'}
            gKg={prescription.fatGKg}
            percentual={prescription.fatPercent}
            passoGKg={0.05}
            gramas={calculated.fatGrams}
            kcal={calculated.fatKcal}
            peso={peso}
            vet={calculated.vet}
            onChange={(v) =>
              onUpdatePrescription({
                ...(v.modo !== undefined && { fatMode: v.modo }),
                ...(v.gKg !== undefined && { fatGKg: v.gKg }),
                ...(v.percentual !== undefined && { fatPercent: v.percentual }),
              })
            }
          />
        </div>

        {somaPercentuais !== null && Math.abs(somaPercentuais - 100) > 0.05 && (
          <div className="mb-4 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800">
            A soma das porcentagens está em {somaPercentuais.toFixed(1).replace('.', ',').replace(',0', '')}%
          </div>
        )}

        {/* Proporção Calórica em Barra */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span className="font-semibold">Divisão Percentual das Calorias:</span>
            <span>
              PTN: <strong className="text-emerald-700">{pProt.toFixed(0)}%</strong> • CHO:{' '}
              <strong className="text-blue-700">{pCarb.toFixed(0)}%</strong> • LIP:{' '}
              <strong className="text-amber-700">{pFat.toFixed(0)}%</strong>
            </span>
          </div>
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${pProt}%` }}
              title={`Proteínas: ${pProt.toFixed(1)}%`}
            />
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${pCarb}%` }}
              title={`Carboidratos: ${pCarb.toFixed(1)}%`}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${pFat}%` }}
              title={`Lipídios: ${pFat.toFixed(1)}%`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2">
            <span>Soma dos macronutrientes: {Math.round(totalMacroKcal)} kcal</span>
            <span>
              Diferença p/ VET:{' '}
              <strong
                className={
                  Math.abs(calculated.vet - totalMacroKcal) < 50
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }
              >
                {Math.round(totalMacroKcal - calculated.vet)} kcal
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MacroCardProps {
  titulo: string;
  corTitulo: string;
  corEtiqueta: string;
  kcalPorGrama: number;
  modo: MacroMode;
  gKg: number;
  percentual?: number;
  passoGKg: number;
  gramas: number;
  kcal: number;
  peso: number;
  vet: number;
  dica?: string;
  onChange: (v: { modo?: MacroMode; gKg?: number; percentual?: number }) => void;
}

/** Card de um macronutriente, prescrito em g/kg de peso ou em % do VET. */
const MacroCard: React.FC<MacroCardProps> = ({
  titulo,
  corTitulo,
  corEtiqueta,
  kcalPorGrama,
  modo,
  gKg,
  percentual,
  passoGKg,
  gramas,
  kcal,
  peso,
  vet,
  dica,
  onChange,
}) => {
  const gKgEquivalente = peso > 0 ? gramas / peso : 0;
  const percentualEquivalente = vet > 0 ? (kcal / vet) * 100 : 0;

  // Ao trocar de modo, o campo novo já vem com o valor equivalente ao atual
  const trocarModo = (novo: MacroMode) => {
    if (novo === modo) return;
    if (novo === 'percent') {
      onChange({ modo: novo, percentual: Math.round(percentualEquivalente * 10) / 10 });
    } else {
      onChange({ modo: novo, gKg: Math.round(gKgEquivalente * 100) / 100 });
    }
  };

  const opcao = (m: MacroMode, rotulo: string) => (
    <button
      type="button"
      onClick={() => trocarModo(m)}
      aria-pressed={modo === m}
      className={`flex-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
        modo === m ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <span className={`text-sm font-bold ${corTitulo}`}>{titulo}</span>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${corEtiqueta}`}>
          {kcalPorGrama} kcal/g
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex bg-slate-200/70 p-0.5 rounded-lg w-32" role="group" aria-label={`Modo de ${titulo}`}>
          {opcao('gkg', 'g/kg')}
          {opcao('percent', '%')}
        </div>
        <div className="flex items-center gap-2">
          {modo === 'gkg' ? (
            <>
              <input
                type="number"
                step={passoGKg}
                min="0"
                value={gKg}
                onChange={(e) => onChange({ gKg: parseFloat(e.target.value) || 0 })}
                className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold text-sm focus:border-emerald-600 outline-none"
              />
              <span className="text-xs text-slate-600 font-medium">g / kg peso</span>
            </>
          ) : (
            <>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={percentual ?? 0}
                onChange={(e) => onChange({ percentual: parseFloat(e.target.value) || 0 })}
                className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold text-sm focus:border-emerald-600 outline-none"
              />
              <span className="text-xs text-slate-600 font-medium">% do VET</span>
            </>
          )}
        </div>
        {dica && <p className="text-[10px] text-slate-400">{dica}</p>}
        <div className="pt-2 border-t border-slate-200 text-xs space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Total:</span>
            <span className="font-bold text-slate-900">
              {gramas}g ({kcal} kcal)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Equivale a:</span>
            <span className="font-semibold text-slate-700">
              {gKgEquivalente.toFixed(2)} g/kg • {percentualEquivalente.toFixed(1)}% do VET
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
