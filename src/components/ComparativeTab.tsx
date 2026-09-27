import React, { useState, useMemo } from 'react';
import { Consultation, Patient } from '../types';
import { calculateAllMetrics } from '../calculations';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  GitCompare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  TrendingUp,
  Filter,
  Scale,
  Activity,
} from 'lucide-react';

interface MiniChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | null; dataKey?: string }>;
  label?: string;
  unit: string;
}

const MiniChartTooltip: React.FC<MiniChartTooltipProps> = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length && payload[0]?.value !== undefined && payload[0]?.value !== null) {
    const val = Number(payload[0].value);
    return (
      <div className="bg-slate-900/95 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80 backdrop-blur-xs">
        <p className="font-semibold text-[10px] text-slate-300">{label}</p>
        <p className="font-mono font-bold text-emerald-400 mt-0.5">
          {val.toFixed(1)} {unit}
        </p>
      </div>
    );
  }
  return null;
};

interface ComparativeTabProps {
  patient: Patient;
  currentConsultation: Consultation;
  consultationHistory: Consultation[];
  onLoadConsultation: (consultation: Consultation) => void;
  onDeleteConsultation: (id: string) => void;
}

export const ComparativeTab: React.FC<ComparativeTabProps> = ({
  patient,
  currentConsultation,
  consultationHistory,
  onLoadConsultation,
  onDeleteConsultation,
}) => {
  // All consultations including the active draft "Consulta Atual"
  const allSessions = useMemo(() => {
    const calculatedCurrent = calculateAllMetrics(
      patient.age,
      patient.sex,
      currentConsultation.anthropometry,
      currentConsultation.prescription
    );

    const activeDraft: Consultation = {
      ...currentConsultation,
      id: 'current_active',
      date: `${currentConsultation.date} (Hoje / Ativa)`,
      calculated: calculatedCurrent,
    };

    const evaluatedHistory = consultationHistory.map((c) => ({
      ...c,
      calculated:
        c.calculated ||
        calculateAllMetrics(patient.age, patient.sex, c.anthropometry, c.prescription),
    }));

    return [...evaluatedHistory, activeDraft];
  }, [patient, currentConsultation, consultationHistory]);

  // Default: compare last saved consultation (if any) with current active draft
  const [id1, setId1] = useState<string>(() => {
    return consultationHistory.length > 0
      ? consultationHistory[consultationHistory.length - 1].id
      : 'current_active';
  });
  const [id2, setId2] = useState<string>('current_active');

  const s1 = allSessions.find((s) => s.id === id1) || allSessions[0];
  const s2 = allSessions.find((s) => s.id === id2) || allSessions[allSessions.length - 1];

  // Presets de Período de Comparação
  const handleSelectPreset = (preset: 'ultima' | 'primeira' | 'penultima') => {
    if (consultationHistory.length === 0) return;

    if (preset === 'ultima') {
      // Compara a última consulta salva com a atual
      setId1(consultationHistory[consultationHistory.length - 1].id);
      setId2('current_active');
    } else if (preset === 'primeira') {
      // Compara a primeira consulta histórica com a atual
      setId1(consultationHistory[0].id);
      setId2('current_active');
    } else if (preset === 'penultima' && consultationHistory.length >= 2) {
      // Compara a primeira com a última do histórico
      setId1(consultationHistory[0].id);
      setId2(consultationHistory[consultationHistory.length - 1].id);
    }
  };

  // Deltas principais calculados
  const weightDiff =
    s1?.anthropometry.weight && s2?.anthropometry.weight
      ? s2.anthropometry.weight - s1.anthropometry.weight
      : 0;

  const fatDiff =
    s1?.calculated?.bodyFatPercent && s2?.calculated?.bodyFatPercent
      ? s2.calculated.bodyFatPercent - s1.calculated.bodyFatPercent
      : 0;

  const leanDiff =
    s1?.calculated?.leanMassKg && s2?.calculated?.leanMassKg
      ? s2.calculated.leanMassKg - s1.calculated.leanMassKg
      : 0;

  const waistDiff =
    s1?.anthropometry.circumferences.waist && s2?.anthropometry.circumferences.waist
      ? s2.anthropometry.circumferences.waist - s1.anthropometry.circumferences.waist
      : 0;

  // Mini gráficos: evolução das últimas 5 consultas (ordem cronológica)
  const last5TrendData = useMemo(() => {
    // Filtrar ou ordenar até 5 consultas mais recentes
    const sessions = allSessions.slice(-5);
    return sessions.map((s, idx) => {
      const isCurrentDraft = s.id === 'current_active';
      const cleanDate = s.date.replace(' (Hoje / Ativa)', '').trim();

      // Encurta a data para caber de forma limpa no eixo X
      let shortLabel = cleanDate;
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length >= 2) {
          shortLabel = `${parts[0]}/${parts[1]}`;
        }
      } else if (cleanDate.includes('-')) {
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
          shortLabel = `${parts[2]}/${parts[1]}`;
        }
      }
      if (isCurrentDraft) {
        shortLabel = 'Atual';
      }

      const weight =
        s.anthropometry?.weight && s.anthropometry.weight > 0
          ? Number(s.anthropometry.weight.toFixed(1))
          : null;

      const fat =
        s.calculated?.bodyFatPercent && s.calculated.bodyFatPercent > 0
          ? Number(s.calculated.bodyFatPercent.toFixed(1))
          : null;

      return {
        id: s.id,
        name: shortLabel,
        fullDate: s.date,
        title: s.title || `Consulta ${idx + 1}`,
        peso: weight,
        gordura: fat,
        isCurrent: isCurrentDraft,
      };
    });
  }, [allSessions]);

  // Deltas da tendência dos mini gráficos (primeiro ponto vs último ponto disponível)
  const weightTrend = useMemo(() => {
    const validWeights = last5TrendData
      .filter((d) => d.peso !== null && d.peso !== undefined)
      .map((d) => d.peso as number);

    if (validWeights.length < 2) {
      return { delta: 0, current: validWeights[0] || 0, hasTrend: false };
    }
    const first = validWeights[0];
    const current = validWeights[validWeights.length - 1];
    return {
      delta: Number((current - first).toFixed(1)),
      current,
      hasTrend: true,
    };
  }, [last5TrendData]);

  const fatTrend = useMemo(() => {
    const validFats = last5TrendData
      .filter((d) => d.gordura !== null && d.gordura !== undefined)
      .map((d) => d.gordura as number);

    if (validFats.length < 2) {
      return { delta: 0, current: validFats[0] || 0, hasTrend: false };
    }
    const first = validFats[0];
    const current = validFats[validFats.length - 1];
    return {
      delta: Number((current - first).toFixed(1)),
      current,
      hasTrend: true,
    };
  }, [last5TrendData]);

  // Helper for row comparison
  const renderRow = (
    label: string,
    val1: number | undefined,
    val2: number | undefined,
    unit: string,
    invertColors: boolean = false
  ) => {
    if (val1 === undefined || val2 === undefined) return null;
    const diff = val2 - val1;
    const isSignificant = Math.abs(diff) > 0.05;

    let colorClass = 'text-slate-600 font-medium';
    if (isSignificant) {
      if (invertColors) {
        // Higher is better (e.g. Massa Magra)
        colorClass = diff > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';
      } else {
        // Lower is better (e.g. Peso, Gordura, Abdômen)
        colorClass = diff < 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';
      }
    }

    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="py-2.5 px-3 text-slate-800 font-semibold">{label}</td>
        <td className="py-2.5 px-3 text-slate-600 font-mono text-xs">
          {val1 > 0 ? `${val1.toFixed(1)} ${unit}` : '--'}
        </td>
        <td className="py-2.5 px-3 text-slate-900 font-mono font-bold text-xs">
          {val2 > 0 ? `${val2.toFixed(1)} ${unit}` : '--'}
        </td>
        <td className="py-2.5 px-3">
          {isSignificant ? (
            <span className={`inline-flex items-center gap-1 font-mono text-xs ${colorClass}`}>
              {diff > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {diff > 0 ? '+' : ''}
              {diff.toFixed(1)} {unit}
            </span>
          ) : (
            <span className="text-slate-400 text-xs font-mono">Sem alteração (0.0)</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Comparador Dinâmico de Sessões */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Acompanhamento de Evolução & Comparativo
              </h2>
              <p className="text-xs text-slate-500">
                Selecione o período ou compare a consulta atual diretamente com a última
              </p>
            </div>
          </div>

        </div>

        {/* Botões Rápidos de Período de Comparação */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-5 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" /> Período Rápido:
          </span>

          <button
            onClick={() => handleSelectPreset('ultima')}
            disabled={consultationHistory.length === 0}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            Última Consulta vs Atual
          </button>

          <button
            onClick={() => handleSelectPreset('primeira')}
            disabled={consultationHistory.length === 0}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            Primeira Consulta (Início) vs Atual
          </button>

          {consultationHistory.length >= 2 && (
            <button
              onClick={() => handleSelectPreset('penultima')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 rounded-lg font-semibold transition-all"
            >
              Primeira vs Última Salva
            </button>
          )}
        </div>

        {/* Seletores Manuais de Consultas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-200 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data 1 (Sessão de Referência / Base)
            </label>
            <select
              value={id1}
              onChange={(e) => setId1(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-emerald-600 outline-none"
            >
              {allSessions.map((s) => (
                <option key={`s1_${s.id}`} value={s.id}>
                  {s.date} - {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data 2 (Sessão de Comparação / Recente)
            </label>
            <select
              value={id2}
              onChange={(e) => setId2(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-emerald-600 outline-none"
            >
              {allSessions.map((s) => (
                <option key={`s2_${s.id}`} value={s.id}>
                  {s.date} - {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mini Gráficos de Linha: Evolução das Últimas 5 Consultas */}
        <div className="mb-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Evolução Temporal (Últimas 5 Consultas)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Curva de tendência do peso e do percentual de gordura do paciente
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto shadow-2xs">
              {last5TrendData.length} {last5TrendData.length === 1 ? 'consulta mapeada' : 'consultas mapeadas'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gráfico 1: Peso Corporal */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Evolução do Peso</h4>
                    <span className="text-[10px] text-slate-500 block">kg ao longo das sessões</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black font-mono text-slate-900 leading-tight">
                    {weightTrend.current ? `${weightTrend.current.toFixed(1)} kg` : '--'}
                  </div>
                  {weightTrend.hasTrend && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        weightTrend.delta < 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : weightTrend.delta > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {weightTrend.delta > 0 ? '+' : ''}
                      {weightTrend.delta.toFixed(1)} kg na janela
                    </span>
                  )}
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-36 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last5TrendData} margin={{ top: 12, right: 12, left: -24, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[
                        (min: number) => (Number.isFinite(min) ? Math.floor(min - 1) : 'auto'),
                        (max: number) => (Number.isFinite(max) ? Math.ceil(max + 1) : 'auto'),
                      ]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip content={(props: any) => <MiniChartTooltip {...props} unit="kg" />} />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#ffffff', stroke: '#059669', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {last5TrendData.length < 2 && (
                <p className="text-[10px] text-slate-400 italic text-center mt-2">
                  1 consulta registrada. Adicione retornos para visualizar a curva contínua.
                </p>
              )}
            </div>

            {/* Gráfico 2: % de Gordura */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Evolução de Gordura Corporal</h4>
                    <span className="text-[10px] text-slate-500 block">% BF ao longo das sessões</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black font-mono text-slate-900 leading-tight">
                    {fatTrend.current ? `${fatTrend.current.toFixed(1)}%` : '--'}
                  </div>
                  {fatTrend.hasTrend && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        fatTrend.delta < 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : fatTrend.delta > 0
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {fatTrend.delta > 0 ? '+' : ''}
                      {fatTrend.delta.toFixed(1)}% na janela
                    </span>
                  )}
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-36 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last5TrendData} margin={{ top: 12, right: 12, left: -24, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[
                        (min: number) => (Number.isFinite(min) ? Math.floor(min - 1) : 'auto'),
                        (max: number) => (Number.isFinite(max) ? Math.ceil(max + 1) : 'auto'),
                      ]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={(props: any) => <MiniChartTooltip {...props} unit="%" />} />
                    <Line
                      type="monotone"
                      dataKey="gordura"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#ffffff', stroke: '#0284c7', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {last5TrendData.length < 2 && (
                <p className="text-[10px] text-slate-400 italic text-center mt-2">
                  1 consulta registrada. Adicione retornos para visualizar a curva contínua.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Destaques da Evolução no Período Selecionado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          {/* Peso */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-xs block font-medium">Variação de Peso</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-slate-900">
                {weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1)} kg
              </span>
              {Math.abs(weightDiff) > 0.1 && (
                <span
                  className={`text-xs font-bold ${
                    weightDiff < 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {weightDiff < 0 ? '↓ Redução' : '↑ Ganho'}
                </span>
              )}
            </div>
          </div>

          {/* % Gordura */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-xs block font-medium">% de Gordura</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-slate-900">
                {fatDiff > 0 ? `+${fatDiff.toFixed(1)}` : fatDiff.toFixed(1)}%
              </span>
              {Math.abs(fatDiff) > 0.1 && (
                <span
                  className={`text-xs font-bold ${
                    fatDiff < 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {fatDiff < 0 ? '↓ Queima' : '↑ Aumento'}
                </span>
              )}
            </div>
          </div>

          {/* Massa Magra */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-xs block font-medium">Massa Magra</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-slate-900">
                {leanDiff > 0 ? `+${leanDiff.toFixed(1)}` : leanDiff.toFixed(1)} kg
              </span>
              {Math.abs(leanDiff) > 0.1 && (
                <span
                  className={`text-xs font-bold ${
                    leanDiff > 0 ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {leanDiff > 0 ? '↑ Ganho' : '↓ Queda'}
                </span>
              )}
            </div>
          </div>

          {/* Cintura */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-xs block font-medium">Cintura</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-slate-900">
                {waistDiff > 0 ? `+${waistDiff.toFixed(1)}` : waistDiff.toFixed(1)} cm
              </span>
              {Math.abs(waistDiff) > 0.1 && (
                <span
                  className={`text-xs font-bold ${
                    waistDiff < 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {waistDiff < 0 ? '↓ Afinamento' : '↑ Aumento'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Comparação Completa */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="py-3 px-3 font-bold">Indicador Clínico</th>
                <th className="py-3 px-3 font-bold">{s1?.date || 'Data 1'}</th>
                <th className="py-3 px-3 font-bold">{s2?.date || 'Data 2'}</th>
                <th className="py-3 px-3 font-bold">Evolução (Diferença)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Header Seção: Composição Corporal */}
              <tr className="bg-slate-100/60">
                <td
                  colSpan={4}
                  className="py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-800"
                >
                  Composição Corporal & Gordura
                </td>
              </tr>
              {renderRow('Peso Total', s1?.anthropometry.weight, s2?.anthropometry.weight, 'kg')}
              {renderRow('IMC', s1?.calculated?.imc, s2?.calculated?.imc, 'kg/m²')}
              {renderRow(
                '% Gordura Corporal',
                s1?.calculated?.bodyFatPercent,
                s2?.calculated?.bodyFatPercent,
                '%'
              )}
              {renderRow('Massa Gorda', s1?.calculated?.fatMassKg, s2?.calculated?.fatMassKg, 'kg')}
              {renderRow(
                'Massa Magra',
                s1?.calculated?.leanMassKg,
                s2?.calculated?.leanMassKg,
                'kg',
                true
              )}

              {/* Header Seção: Circunferências */}
              <tr className="bg-slate-100/60">
                <td
                  colSpan={4}
                  className="py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-800"
                >
                  Medidas & Circunferências (cm)
                </td>
              </tr>
              {renderRow(
                'Peito / Tórax',
                s1 ? s1.anthropometry.circumferences.chest ?? 0 : undefined,
                s2 ? s2.anthropometry.circumferences.chest ?? 0 : undefined,
                'cm',
                true
              )}
              {renderRow(
                'Cintura',
                s1?.anthropometry.circumferences.waist,
                s2?.anthropometry.circumferences.waist,
                'cm'
              )}
              {renderRow(
                'Abdômen',
                s1?.anthropometry.circumferences.abdomen,
                s2?.anthropometry.circumferences.abdomen,
                'cm'
              )}
              {renderRow(
                'Quadril',
                s1?.anthropometry.circumferences.hip,
                s2?.anthropometry.circumferences.hip,
                'cm'
              )}
              {renderRow(
                'Pescoço',
                s1?.anthropometry.circumferences.neck,
                s2?.anthropometry.circumferences.neck,
                'cm'
              )}
              {renderRow(
                'Braço Relaxado',
                s1?.anthropometry.circumferences.relaxedArm,
                s2?.anthropometry.circumferences.relaxedArm,
                'cm',
                true
              )}
              {renderRow(
                'Coxa Medial',
                s1?.anthropometry.circumferences.thigh,
                s2?.anthropometry.circumferences.thigh,
                'cm',
                true
              )}
              {renderRow(
                'Panturrilha',
                s1?.anthropometry.circumferences.calf,
                s2?.anthropometry.circumferences.calf,
                'cm',
                true
              )}

              {/* Header Seção: Dobras Cutâneas */}
              <tr className="bg-slate-100/60">
                <td
                  colSpan={4}
                  className="py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-800"
                >
                  Dobras Cutâneas (mm)
                </td>
              </tr>
              {renderRow('Tríceps', s1?.anthropometry.skinfolds.triceps, s2?.anthropometry.skinfolds.triceps, 'mm')}
              {renderRow('Subescapular', s1?.anthropometry.skinfolds.subscapular, s2?.anthropometry.skinfolds.subscapular, 'mm')}
              {renderRow('Abdominal', s1?.anthropometry.skinfolds.abdominal, s2?.anthropometry.skinfolds.abdominal, 'mm')}
              {renderRow('Suprailíaca', s1?.anthropometry.skinfolds.suprailiac, s2?.anthropometry.skinfolds.suprailiac, 'mm')}
              {renderRow('Coxa', s1?.anthropometry.skinfolds.thigh, s2?.anthropometry.skinfolds.thigh, 'mm')}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico Temporal de Consultas Realizadas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Histórico de Consultas Salvas deste Paciente ({consultationHistory.length})
        </h3>

        {consultationHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Nenhuma consulta salva anteriormente no histórico deste paciente. Clique em &quot;Salvar Consulta&quot;, no topo do prontuário, para registrar esta avaliação.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {consultationHistory.map((c, idx) => (
              <div
                key={c.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{c.date}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {c.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Peso: {c.anthropometry.weight}kg • Cintura: {c.anthropometry.circumferences.waist}cm • VET: {c.calculated?.vet ? `${Math.round(c.calculated.vet)} kcal` : '—'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadConsultation(c)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Carregar no Prontuário
                  </button>
                  <button
                    onClick={() => onDeleteConsultation(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Excluir do histórico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
