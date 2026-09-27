import React, { useMemo } from 'react';
import { Consultation, Patient } from '../types';
import { parseDataConsulta } from '../utils/date';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarChart3, Database, FileText, Users, X } from 'lucide-react';

interface ConsultorioReportViewProps {
  patients: Patient[];
  consultations: Consultation[];
  onClose: () => void;
}

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const ConsultorioReportView: React.FC<ConsultorioReportViewProps> = ({
  patients,
  consultations,
  onClose,
}) => {
  // Pacientes com pelo menos uma consulta gravada, do atendimento mais recente para o mais antigo
  const emAcompanhamento = useMemo(() => {
    return patients
      .map((p) => {
        const datas = consultations
          .filter((c) => c.patientId === p.id)
          .map((c) => parseDataConsulta(c.date))
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime());
        return { patient: p, total: consultations.filter((c) => c.patientId === p.id).length, ultima: datas[0] };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => (b.ultima?.getTime() || 0) - (a.ultima?.getTime() || 0));
  }, [patients, consultations]);

  // Consultas gravadas por mês, nos últimos 6 meses (incluindo o atual)
  const porMes = useMemo(() => {
    const hoje = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      return { ano: d.getFullYear(), mes: d.getMonth(), rotulo: `${MESES_CURTOS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, consultas: 0 };
    });
    consultations.forEach((c) => {
      const d = parseDataConsulta(c.date);
      if (!d) return;
      const alvo = meses.find((m) => m.ano === d.getFullYear() && m.mes === d.getMonth());
      if (alvo) alvo.consultas++;
    });
    return meses;
  }, [consultations]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Relatório do consultório</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Totais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Pacientes cadastrados</span>
                <span className="text-2xl font-black text-slate-900">{patients.length}</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Prontuários (consultas) gravados</span>
                <span className="text-2xl font-black text-slate-900">{consultations.length}</span>
              </div>
            </div>
          </div>

          {/* Consultas por mês */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">Consultas por mês (últimos 6 meses)</h4>
            <div className="h-48 border border-slate-200 rounded-2xl p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                  <Tooltip formatter={(v) => [v, 'Consultas']} />
                  <Bar dataKey="consultas" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pacientes em acompanhamento */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Pacientes em acompanhamento ({emAcompanhamento.length})
            </h4>
            {emAcompanhamento.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhuma consulta gravada até o momento.</p>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left font-bold px-3 py-2">Paciente</th>
                      <th className="text-left font-bold px-3 py-2">Objetivo</th>
                      <th className="text-center font-bold px-3 py-2">Consultas</th>
                      <th className="text-right font-bold px-3 py-2">Última consulta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emAcompanhamento.map(({ patient, total, ultima }) => (
                      <tr key={patient.id}>
                        <td className="px-3 py-2 font-semibold text-slate-900">{patient.name}</td>
                        <td className="px-3 py-2 text-slate-600">{patient.objective}</td>
                        <td className="px-3 py-2 text-center text-slate-900 font-bold">{total}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {ultima ? ultima.toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Armazenamento */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
            <Database className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Armazenamento dos dados:</strong> os dados ficam
              armazenados no servidor (Supabase, região São Paulo), com acesso restrito à sua conta: cada
              nutricionista só consegue ler e alterar os próprios pacientes, consultas e agendamentos. Use
              &quot;Exportar backup (JSON)&quot; no perfil para guardar uma cópia própria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
