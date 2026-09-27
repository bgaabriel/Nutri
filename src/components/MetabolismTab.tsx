import React from 'react';
import { BmrFormula, CalculatedMetrics, EnergyPrescription } from '../types';
import { Flame, PieChart } from 'lucide-react';

interface MetabolismTabProps {
  prescription: EnergyPrescription;
  calculated: CalculatedMetrics;
  onUpdatePrescription: (updated: Partial<EnergyPrescription>) => void;
}

export const MetabolismTab: React.FC<MetabolismTabProps> = ({
  prescription,
  calculated,
  onUpdatePrescription,
}) => {
  const handleFaPresetChange = (val: string) => {
    if (val === 'manual') {
      onUpdatePrescription({ activityFactorPreset: 'manual' });
    } else {
      const num = parseFloat(val) || 1.55;
      onUpdatePrescription({
        activityFactorPreset: val,
        activityFactor: num,
      });
    }
  };

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
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fator de Atividade (FA)
            </label>
            <div className="space-y-2">
              <select
                value={prescription.activityFactorPreset}
                onChange={(e) => handleFaPresetChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              >
                <option value="1.2">1.2 - Sedentário (pouco ou nenhum exercício)</option>
                <option value="1.375">1.375 - Levemente Ativo (treino 1-3x/sem)</option>
                <option value="1.55">1.55 - Moderadamente Ativo (treino 3-5x/sem)</option>
                <option value="1.725">1.725 - Muito Ativo (treino diário intenso)</option>
                <option value="1.9">1.9 - Extremamente Ativo (atletas 2x/dia)</option>
                <option value="manual">Personalizado (Digitar valor exato)</option>
              </select>

              {prescription.activityFactorPreset === 'manual' && (
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="2.5"
                  value={prescription.activityFactor}
                  onChange={(e) =>
                    onUpdatePrescription({ activityFactor: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-sm focus:border-emerald-600 outline-none"
                  placeholder="Ex: 1.62"
                />
              )}
            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Proteínas */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-emerald-800">Proteínas</span>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                4 kcal/g
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="4.0"
                  value={prescription.proteinGKg}
                  onChange={(e) =>
                    onUpdatePrescription({ proteinGKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold text-sm focus:border-emerald-600 outline-none"
                />
                <span className="text-xs text-slate-600 font-medium">g / kg peso</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs flex justify-between">
                <span className="text-slate-500">Total:</span>
                <span className="font-bold text-slate-900">
                  {calculated.proteinGrams}g ({calculated.proteinKcal} kcal)
                </span>
              </div>
            </div>
          </div>

          {/* Carboidratos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-blue-800">Carboidratos</span>
              <span className="text-xs font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                4 kcal/g
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  value={prescription.carbGKg}
                  onChange={(e) =>
                    onUpdatePrescription({ carbGKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold text-sm focus:border-emerald-600 outline-none"
                />
                <span className="text-xs text-slate-600 font-medium">g / kg peso</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs flex justify-between">
                <span className="text-slate-500">Total:</span>
                <span className="font-bold text-slate-900">
                  {calculated.carbGrams}g ({calculated.carbKcal} kcal)
                </span>
              </div>
            </div>
          </div>

          {/* Gorduras */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-amber-800">Lipídios / Gorduras</span>
              <span className="text-xs font-mono bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                9 kcal/g
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0.3"
                  max="2.5"
                  value={prescription.fatGKg}
                  onChange={(e) =>
                    onUpdatePrescription({ fatGKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold text-sm focus:border-emerald-600 outline-none"
                />
                <span className="text-xs text-slate-600 font-medium">g / kg peso</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs flex justify-between">
                <span className="text-slate-500">Total:</span>
                <span className="font-bold text-slate-900">
                  {calculated.fatGrams}g ({calculated.fatKcal} kcal)
                </span>
              </div>
            </div>
          </div>
        </div>

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
