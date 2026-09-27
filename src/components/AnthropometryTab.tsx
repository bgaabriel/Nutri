import React from 'react';
import { Anthropometry, CalculatedMetrics, FatProtocol } from '../types';
import { formatarVariacaoPercentual, variacaoPesoHabitual } from '../calculations';
import { Scale, HeartCrack, Layers } from 'lucide-react';

interface AnthropometryTabProps {
  anthropometry: Anthropometry;
  calculated: CalculatedMetrics;
  onUpdateAnthropometry: (updated: Partial<Anthropometry>) => void;
}

export const AnthropometryTab: React.FC<AnthropometryTabProps> = ({
  anthropometry,
  calculated,
  onUpdateAnthropometry,
}) => {
  const { weight, height, circumferences, skinfolds, fatProtocol } = anthropometry;
  const variacaoHabitual = variacaoPesoHabitual(weight, anthropometry.usualWeight);

  const updateCirc = (field: keyof typeof circumferences, val: number) => {
    onUpdateAnthropometry({
      circumferences: {
        ...circumferences,
        [field]: val,
      },
    });
  };

  const updateFold = (field: keyof typeof skinfolds, val: number) => {
    onUpdateAnthropometry({
      skinfolds: {
        ...skinfolds,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 4. Antropometria e Circunferências */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">4. Antropometria & Circunferências</h2>
              <p className="text-xs text-slate-500">Dimensões corporais e indicadores biométricos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status IMC:</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase ${
                calculated.imc < 18.5
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : calculated.imc < 25
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : calculated.imc < 30
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {calculated.imc.toFixed(1)} kg/m² • {calculated.imcClassification}
            </span>
          </div>
        </div>

        {/* Peso e Altura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Peso Atual (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight || ''}
              onChange={(e) => onUpdateAnthropometry({ weight: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-base focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Altura (cm)</label>
            <input
              type="number"
              value={height || ''}
              onChange={(e) => onUpdateAnthropometry({ height: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-base focus:border-emerald-600 outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-medium">Índice de Massa Corporal (IMC)</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {calculated.imc.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">kg/m²</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Faixa Eutrófica (OMS)</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">18.5 - 24.9 kg/m²</p>
            </div>
          </div>

          {/* Peso habitual, logo abaixo do IMC */}
          <div>
            <label htmlFor="peso-habitual" className="block text-xs font-semibold text-slate-700 mb-1">
              Peso Habitual (kg)
            </label>
            <input
              id="peso-habitual"
              type="number"
              step="0.1"
              value={anthropometry.usualWeight || ''}
              onChange={(e) => onUpdateAnthropometry({ usualWeight: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-base focus:border-emerald-600 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-1 md:col-span-3 flex items-end pb-2">
            {variacaoHabitual !== null ? (
              <p className="text-sm text-slate-700">
                <strong
                  className={`font-mono text-base ${
                    variacaoHabitual < 0 ? 'text-amber-700' : variacaoHabitual > 0 ? 'text-orange-700' : 'text-emerald-700'
                  }`}
                >
                  {formatarVariacaoPercentual(variacaoHabitual)}
                </strong>{' '}
                em relação ao habitual
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Informe o peso habitual para ver a variação em relação ao peso atual.
              </p>
            )}
          </div>
        </div>

        {/* Circunferências */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Circunferências Corporais (cm)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Peito / Tórax</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.chest || ''}
                onChange={(e) => updateCirc('chest', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pescoço</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.neck || ''}
                onChange={(e) => updateCirc('neck', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cintura</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.waist || ''}
                onChange={(e) => updateCirc('waist', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Abdômen</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.abdomen || ''}
                onChange={(e) => updateCirc('abdomen', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quadril</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.hip || ''}
                onChange={(e) => updateCirc('hip', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Braço Rel.</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.relaxedArm || ''}
                onChange={(e) => updateCirc('relaxedArm', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Coxa</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.thigh || ''}
                onChange={(e) => updateCirc('thigh', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Panturrilha</label>
              <input
                type="number"
                step="0.1"
                value={circumferences.calf || ''}
                onChange={(e) => updateCirc('calf', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* RCQ Bar */}
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 mt-3">
            <div className="flex items-center gap-2">
              <HeartCrack className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">
                Relação Cintura / Quadril (RCQ):{' '}
                <strong className="text-emerald-700 font-mono text-base">
                  {calculated.rcq > 0 ? calculated.rcq.toFixed(2) : '--'}
                </strong>
              </span>
            </div>
            {calculated.rcq > 0 && (
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase ${
                  calculated.rcqRisk
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {calculated.rcqText}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Dobras Cutâneas e Composição Corporal */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">5. Dobras Cutâneas (mm) & Composição</h2>
              <p className="text-xs text-slate-500">Espessura do tecido adiposo e protocolos validados</p>
            </div>
          </div>
        </div>

        {/* Dobras grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tríceps</label>
            <input
              type="number"
              step="0.5"
              value={skinfolds.triceps || ''}
              onChange={(e) => updateFold('triceps', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subescapular</label>
            <input
              type="number"
              step="0.5"
              value={skinfolds.subscapular || ''}
              onChange={(e) => updateFold('subscapular', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Peitoral</label>
            <input
              type="number"
              step="0.5"
              value={skinfolds.chest || ''}
              onChange={(e) => updateFold('chest', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Axilar Média</label>
            <input
              type="number"
              step="0.5"
              value={skinfolds.midaxillary || ''}
              onChange={(e) => updateFold('midaxillary', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Supra-ilíaca</label>
            <input
              type="number"
              step="0.5"
              value={skinfolds.suprailiac || ''}
              onChange={(e) => updateFold('suprailiac', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Abdominal</label>
            <input
              type="number"
              step="0.5"
              value={skinfolds.abdominal || ''}
              onChange={(e) => updateFold('abdominal', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Coxa</label>
            <input
              type="number"
              step="0.5"
              value={skinfolds.thigh || ''}
              onChange={(e) => updateFold('thigh', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            />
          </div>
        </div>

        {/* Protocolo Selection & Resumo */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Protocolo de Composição Corporal
            </label>
            <select
              value={fatProtocol}
              onChange={(e) => onUpdateAnthropometry({ fatProtocol: e.target.value as FatProtocol })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all"
            >
              <option value="marinha">US Navy - Marinha (Usa Circunferências)</option>
              <option value="faulkner">Faulkner (4 dobras: Tríceps, Subesc, Supra-il, Abd)</option>
              <option value="jp7">Jackson & Pollock (7 dobras completas)</option>
              <option value="jp3">Jackson & Pollock (3 dobras resumidas)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {fatProtocol === 'marinha'
                ? 'Ideal quando não dispuser de adipômetro. Baseado em Abdômen, Pescoço, Quadril e Altura.'
                : fatProtocol === 'faulkner'
                ? 'Amplamente utilizado no Brasil para adultos e esportistas.'
                : 'Padrão clínico rigoroso para monitoramento de atletas e pacientes.'}
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-semibold block mb-1">Gordura Corporal</span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                {calculated.bodyFatPercent > 0 ? `${calculated.bodyFatPercent.toFixed(1)}%` : '--'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-semibold block mb-1">Massa Gorda</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {calculated.fatMassKg > 0 ? `${calculated.fatMassKg.toFixed(1)} kg` : '--'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-semibold block mb-1">Massa Magra</span>
              <span className="text-xl font-black text-blue-700 font-mono">
                {calculated.leanMassKg > 0 ? `${calculated.leanMassKg.toFixed(1)} kg` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Composition Ratio */}
        {calculated.bodyFatPercent > 0 && (
          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5">
              <span className="font-semibold">Distribuição de Massa:</span>
              <span>
                Massa Magra:{' '}
                <strong className="text-blue-700 font-bold">
                  {(100 - calculated.bodyFatPercent).toFixed(1)}%
                </strong>{' '}
                • Gordura:{' '}
                <strong className="text-emerald-700 font-bold">
                  {calculated.bodyFatPercent.toFixed(1)}%
                </strong>
              </span>
            </div>
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, 100 - calculated.bodyFatPercent))}%` }}
                title="Massa Magra"
              />
              <div
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, calculated.bodyFatPercent))}%` }}
                title="Massa Gorda"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
