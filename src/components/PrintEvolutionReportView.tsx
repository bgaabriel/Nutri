import React, { useState, useMemo } from 'react';
import { CalculatedMetrics, Consultation, Patient, ProfessionalProfile } from '../types';
import { parseDataConsulta } from '../utils/date';
import { calculateAllMetrics } from '../calculations';
import {
  Printer,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Scale,
  Activity,
  Calendar,
  Copy,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react';

interface PrintEvolutionReportViewProps {
  patient: Patient;
  currentConsultation: Consultation;
  consultationHistory: Consultation[];
  profile: ProfessionalProfile;
  /** Métricas ao vivo da consulta em edição (a consulta atual ainda não tem `calculated`). */
  calculatedMetrics: CalculatedMetrics;
  onBackToApp: () => void;
}

export const PrintEvolutionReportView: React.FC<PrintEvolutionReportViewProps> = ({
  patient,
  currentConsultation,
  consultationHistory,
  profile,
  calculatedMetrics,
  onBackToApp,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [customNotes, setCustomNotes] = useState(() => {
    return 'Paciente demonstra excelente comprometimento com a reeducação alimentar e o plano prescrito, apresentando evolução favorável na composição corporal. Seguiremos com as metas ajustadas para a próxima fase.';
  });

  // Consolidate all historical consultations plus current consultation
  const allSessions = useMemo(() => {
    const list: Consultation[] = [...consultationHistory];

    // Add current session if not already in history (com as métricas ao vivo)
    const alreadySaved = list.some((c) => c.id === currentConsultation.id);
    if (!alreadySaved) {
      list.push({ ...currentConsultation, calculated: calculatedMetrics });
    }

    const tempo = (c: Consultation) => parseDataConsulta(c.date)?.getTime() ?? 0;

    // Sort chronologically (oldest to newest); a ordenação é estável, então a
    // consulta atual fica depois das salvas no mesmo dia
    return list
      .map((c) => ({
        ...c,
        calculated:
          c.calculated ||
          calculateAllMetrics(patient.age, patient.sex, c.anthropometry, c.prescription),
      }))
      .sort((a, b) => tempo(a) - tempo(b));
  }, [patient, currentConsultation, consultationHistory, calculatedMetrics]);

  const initialSession = allSessions.length > 0 ? allSessions[0] : null;
  const latestSession = allSessions.length > 0 ? allSessions[allSessions.length - 1] : null;

  // Global deltas
  const deltas = useMemo(() => {
    if (!initialSession || !latestSession) return null;

    const wInit = initialSession.anthropometry.weight;
    const wLatest = latestSession.anthropometry.weight;
    const weightDelta = wLatest - wInit;

    const fatInit = initialSession.calculated?.bodyFatPercent || 0;
    const fatLatest = latestSession.calculated?.bodyFatPercent || 0;
    const fatDelta = fatLatest - fatInit;

    const leanInit = initialSession.calculated?.leanMassKg || 0;
    const leanLatest = latestSession.calculated?.leanMassKg || 0;
    const leanDelta = leanLatest - leanInit;

    const fatKgInit = initialSession.calculated?.fatMassKg || 0;
    const fatKgLatest = latestSession.calculated?.fatMassKg || 0;
    const fatKgDelta = fatKgLatest - fatKgInit;

    const waistInit = initialSession.anthropometry.circumferences?.waist || 0;
    const waistLatest = latestSession.anthropometry.circumferences?.waist || 0;
    const waistDelta = waistLatest - waistInit;

    const abdomenInit = initialSession.anthropometry.circumferences?.abdomen || 0;
    const abdomenLatest = latestSession.anthropometry.circumferences?.abdomen || 0;
    const abdomenDelta = abdomenLatest - abdomenInit;

    return {
      weight: { init: wInit, current: wLatest, delta: weightDelta },
      fatPct: { init: fatInit, current: fatLatest, delta: fatDelta },
      leanMass: { init: leanInit, current: leanLatest, delta: leanDelta },
      fatMass: { init: fatKgInit, current: fatKgLatest, delta: fatKgDelta },
      waist: { init: waistInit, current: waistLatest, delta: waistDelta },
      abdomen: { init: abdomenInit, current: abdomenLatest, delta: abdomenDelta },
    };
  }, [initialSession, latestSession]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = () => {
    if (!deltas || !initialSession || !latestSession) return;

    const msg = `*RESUMO DA EVOLUÇÃO NUTRICIONAL - NUTRIÇÃO CLÍNICA*
Olá, ${patient.name}! Aqui está o consolidado dos seus resultados:

📅 *Acompanhamento:* ${initialSession.date} até ${latestSession.date} (${allSessions.length} avaliações)
⚖️ *Peso Corporal:* ${deltas.weight.init.toFixed(1)}kg ➡️ ${deltas.weight.current.toFixed(1)}kg (${deltas.weight.delta <= 0 ? '' : '+'}${deltas.weight.delta.toFixed(1)}kg)
🔥 *Gordura Corporal:* ${deltas.fatPct.init.toFixed(1)}% ➡️ ${deltas.fatPct.current.toFixed(1)}% (${deltas.fatPct.delta <= 0 ? '' : '+'}${deltas.fatPct.delta.toFixed(1)}%)
💪 *Massa Magra:* ${deltas.leanMass.init.toFixed(1)}kg ➡️ ${deltas.leanMass.current.toFixed(1)}kg (${deltas.leanMass.delta >= 0 ? '+' : ''}${deltas.leanMass.delta.toFixed(1)}kg)
📏 *Cintura:* ${deltas.waist.init.toFixed(1)}cm ➡️ ${deltas.waist.current.toFixed(1)}cm (${deltas.waist.delta <= 0 ? '' : '+'}${deltas.waist.delta.toFixed(1)}cm)

_${customNotes}_

Profissional: *${profile.name}* (CRN: ${profile.crn})`;

    navigator.clipboard.writeText(msg);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  // Sparkline coordinates calculator for SVG charts
  const getPoints = (values: number[], height: number, width: number) => {
    if (values.length <= 1) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padding = 16;
    const innerH = height - padding * 2;

    return values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * (width - 40) + 20;
        const y = height - padding - ((val - min) / range) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const weights = allSessions.map((s) => s.anthropometry.weight);
  const fats = allSessions.map((s) => s.calculated?.bodyFatPercent || 0);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Action Bar (Hidden on print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl mb-6 shadow-xs">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Prontuário</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Copiar resumo textual para colar no WhatsApp do paciente"
          >
            {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedWhatsApp ? 'Copiado para WhatsApp!' : 'Copiar p/ WhatsApp'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Salvar como PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Formatted for both screen preview, digital sharing and physical print) */}
      <div className="card-print bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 space-y-7">
        {/* Cabecalho Timbrado */}
        <div className="border-b-2 border-emerald-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-200">
                Laudo Longitudinal
              </span>
              <span className="text-xs font-bold text-slate-500">
                {profile.clinic || 'Clínica Nutricional'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              Relatório Consolidado de Evolução Nutricional
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
              Acompanhamento Longitudinal da Composição Corporal & Metas Clínicas
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="text-base font-black text-slate-900">{profile.name}</p>
            <p className="text-xs font-bold text-emerald-700">CRN: {profile.crn}</p>
            <p className="text-xs text-slate-600">{profile.email}</p>
            <p className="text-xs text-slate-500">{profile.phone}</p>
          </div>
        </div>

        {/* 1. Dados Cadastrais do Paciente */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Paciente</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Idade / Sexo</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {patient.age} anos • {patient.sex === 'M' ? 'Masculino' : 'Feminino'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Período de Acompanhamento</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {initialSession?.date || '—'} até {latestSession?.date || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Consultas Mapeadas</span>
              <span className="text-sm font-black text-emerald-700 block mt-0.5">
                {allSessions.length} sessões registradas
              </span>
            </div>
          </div>

          {latestSession &&
            (latestSession.anamnesis.occupation ||
              latestSession.anamnesis.workRoutine ||
              latestSession.anamnesis.foodRecall) && (
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Profissão / Trabalho</span>
                  <span className="text-slate-800 block mt-0.5">
                    {latestSession.anamnesis.occupation || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Rotina de trabalho</span>
                  <span className="text-slate-800 block mt-0.5">
                    {latestSession.anamnesis.workRoutine || 'Não informado'}
                  </span>
                </div>
                {latestSession.anamnesis.foodRecall && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">
                      Recordatório alimentar (consulta mais recente)
                    </span>
                    <p className="text-slate-800 mt-0.5 whitespace-pre-wrap leading-relaxed">
                      {latestSession.anamnesis.foodRecall}
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* 2. Destaques da Evolução Global (Primeira vs. Última Consulta) */}
        {deltas && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resultados Acumulados no Período</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                Comparativo da 1ª avaliação com o estado clínico atual
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Peso */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Peso Corporal</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {deltas.weight.current.toFixed(1)} <span className="text-xs font-normal">kg</span>
                </span>
                <span
                  className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.2 rounded-md ${
                    deltas.weight.delta <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {deltas.weight.delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {deltas.weight.delta <= 0 ? '' : '+'}
                  {deltas.weight.delta.toFixed(1)} kg
                </span>
              </div>

              {/* % Gordura */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">% Gordura (BF)</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {deltas.fatPct.current.toFixed(1)} <span className="text-xs font-normal">%</span>
                </span>
                <span
                  className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.2 rounded-md ${
                    deltas.fatPct.delta <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {deltas.fatPct.delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {deltas.fatPct.delta <= 0 ? '' : '+'}
                  {deltas.fatPct.delta.toFixed(1)}%
                </span>
              </div>

              {/* Massa Magra */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Massa Magra</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {deltas.leanMass.current.toFixed(1)} <span className="text-xs font-normal">kg</span>
                </span>
                <span
                  className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.2 rounded-md ${
                    deltas.leanMass.delta >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {deltas.leanMass.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {deltas.leanMass.delta >= 0 ? '+' : ''}
                  {deltas.leanMass.delta.toFixed(1)} kg
                </span>
              </div>

              {/* Massa Gorda */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Massa Gorda</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {deltas.fatMass.current.toFixed(1)} <span className="text-xs font-normal">kg</span>
                </span>
                <span
                  className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.2 rounded-md ${
                    deltas.fatMass.delta <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {deltas.fatMass.delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {deltas.fatMass.delta <= 0 ? '' : '+'}
                  {deltas.fatMass.delta.toFixed(1)} kg
                </span>
              </div>

              {/* Cintura */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Cintura</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {deltas.waist.current.toFixed(1)} <span className="text-xs font-normal">cm</span>
                </span>
                <span
                  className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.2 rounded-md ${
                    deltas.waist.delta <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {deltas.waist.delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {deltas.waist.delta <= 0 ? '' : '+'}
                  {deltas.waist.delta.toFixed(1)} cm
                </span>
              </div>

              {/* Abdômen */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Abdômen</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {deltas.abdomen.current.toFixed(1)} <span className="text-xs font-normal">cm</span>
                </span>
                <span
                  className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.2 rounded-md ${
                    deltas.abdomen.delta <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {deltas.abdomen.delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {deltas.abdomen.delta <= 0 ? '' : '+'}
                  {deltas.abdomen.delta.toFixed(1)} cm
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Curvas Visuais da Evolução (SVG vetorial nativo de alta precisão para impressão & digital) */}
        {allSessions.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gráfico 1: Evolução do Peso */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Curva de Peso Corporal (kg)</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  {weights[0].toFixed(1)}kg ➡️ {weights[weights.length - 1].toFixed(1)}kg
                </span>
              </div>
              <div className="h-28 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 340 100" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getPoints(weights, 100, 340)}
                  />
                  {weights.map((val, idx) => {
                    const min = Math.min(...weights);
                    const max = Math.max(...weights);
                    const range = max - min || 1;
                    const x = (idx / (weights.length - 1)) * (340 - 40) + 20;
                    const y = 100 - 16 - ((val - min) / range) * 68;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="4" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                        <text
                          x={x}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#0f172a"
                        >
                          {val.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1 px-1">
                <span>{allSessions[0].date}</span>
                <span>{allSessions[allSessions.length - 1].date}</span>
              </div>
            </div>

            {/* Gráfico 2: Evolução do % de Gordura */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Curva de Gordura Corporal (% BF)</span>
                </span>
                <span className="text-[11px] font-bold text-blue-800">
                  {fats[0].toFixed(1)}% ➡️ {fats[fats.length - 1].toFixed(1)}%
                </span>
              </div>
              <div className="h-28 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 340 100" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getPoints(fats, 100, 340)}
                  />
                  {fats.map((val, idx) => {
                    const min = Math.min(...fats);
                    const max = Math.max(...fats);
                    const range = max - min || 1;
                    const x = (idx / (fats.length - 1)) * (340 - 40) + 20;
                    const y = 100 - 16 - ((val - min) / range) * 68;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="4" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
                        <text
                          x={x}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#0f172a"
                        >
                          {val.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1 px-1">
                <span>{allSessions[0].date}</span>
                <span>{allSessions[allSessions.length - 1].date}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Tabela Cronológica Consolidada de Todas as Consultas */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Histórico Detalhado das Consultas</span>
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Data / Sessão</th>
                  <th className="py-2.5 px-3">Peso</th>
                  <th className="py-2.5 px-3">IMC</th>
                  <th className="py-2.5 px-3">% Gordura</th>
                  <th className="py-2.5 px-3">Massa Magra</th>
                  <th className="py-2.5 px-3">Massa Gorda</th>
                  <th className="py-2.5 px-3">Peito</th>
                  <th className="py-2.5 px-3">Cintura</th>
                  <th className="py-2.5 px-3">Abdômen</th>
                  <th className="py-2.5 px-3">Meta (VET)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSessions.map((s, idx) => {
                  const isLatest = idx === allSessions.length - 1;
                  const isFirst = idx === 0;

                  return (
                    <tr
                      key={s.id || idx}
                      className={isLatest ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-slate-50/50'}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{s.date}</span>
                          {isLatest && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                              Atual
                            </span>
                          )}
                          {isFirst && allSessions.length > 1 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-bold">
                              1ª Sessão
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {s.anthropometry.weight.toFixed(1)} kg
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.calculated?.imc ? `${s.calculated.imc.toFixed(1)} kg/m²` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-700">
                        {s.calculated?.bodyFatPercent
                          ? `${s.calculated.bodyFatPercent.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.calculated?.leanMassKg ? `${s.calculated.leanMassKg.toFixed(1)} kg` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.calculated?.fatMassKg ? `${s.calculated.fatMassKg.toFixed(1)} kg` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.anthropometry.circumferences?.chest
                          ? `${s.anthropometry.circumferences.chest.toFixed(1)} cm`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.anthropometry.circumferences?.waist
                          ? `${s.anthropometry.circumferences.waist.toFixed(1)} cm`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.anthropometry.circumferences?.abdomen
                          ? `${s.anthropometry.circumferences.abdomen.toFixed(1)} cm`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800">
                        {s.calculated?.vet
                          ? `${Math.round(s.calculated.vet)} kcal`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Parecer & Parecer Clínico (Editável na tela pelo nutricionista) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Parecer & Considerações Clínicas da Evolução</span>
            </h2>
            <span className="text-[10px] text-slate-400 no-print">
              (Clique para editar antes de gerar o PDF)
            </span>
          </div>

          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            rows={3}
            className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-3 leading-relaxed outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-y"
            placeholder="Digite aqui as considerações clínicas sobre a evolução do paciente..."
          />
        </div>

        {/* 6. Assinatura e Carimbo Profissional */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <p className="font-semibold text-slate-700">Documento Clínico Confidencial</p>
            <p>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Emitido via NutriPro Software Clínico</p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <div className="w-56 border-b border-slate-400 mx-auto sm:ml-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-900">{profile.name}</p>
            <p className="text-[11px] font-semibold text-emerald-800">Nutricionista • CRN {profile.crn}</p>
            <p className="text-[10px] text-slate-500">{profile.clinic}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
