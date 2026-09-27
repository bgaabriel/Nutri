import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentModality, AppointmentStatus, AppointmentType, Patient } from '../types';
import type { DadosAgendamento } from '../lib/db';
import { X, Calendar, Clock, User, CheckCircle2, Trash2, Video, Building2 } from 'lucide-react';
import { hojeLocalISO } from '../utils/date';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Sem id cria um agendamento novo; com id atualiza o existente. */
  onSave: (dados: DadosAgendamento, id?: string) => void;
  onDelete: (id: string) => void;
  appointment?: Appointment | null;
  patients: Patient[];
  initialDate?: string;
  defaultPatientId?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  appointment,
  patients,
  initialDate,
  defaultPatientId,
}) => {
  const effectiveAppointment = appointment;
  const effectiveDate = initialDate;

  const [patientId, setPatientId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [type, setType] = useState<AppointmentType>('retorno');
  const [status, setStatus] = useState<AppointmentStatus>('agendado');
  const [modality, setModality] = useState<AppointmentModality>('presencial');
  const [notes, setNotes] = useState<string>('');
  const [price, setPrice] = useState<string>('250');
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    if (effectiveAppointment) {
      setPatientId(effectiveAppointment.patientId || '');
      setDate(effectiveAppointment.date);
      setTime(effectiveAppointment.time);
      setDurationMinutes(effectiveAppointment.durationMinutes || 60);
      setType(effectiveAppointment.type);
      setStatus(effectiveAppointment.status);
      setModality(effectiveAppointment.modality || 'presencial');
      setNotes(effectiveAppointment.notes || '');
      setPrice(effectiveAppointment.price !== undefined ? String(effectiveAppointment.price) : '250');
      setPaid(!!effectiveAppointment.paid);
    } else {
      const today = effectiveDate || hojeLocalISO();
      setDate(today);
      setTime('09:00');
      setDurationMinutes(60);
      setType('retorno');
      setStatus('agendado');
      setModality('presencial');
      setNotes('');
      setPrice('250');
      setPaid(false);

      setPatientId(defaultPatientId || patients[0]?.id || '');
    }
  }, [effectiveAppointment, isOpen, effectiveDate, defaultPatientId, patients]);

  if (!isOpen) return null;

  const handlePatientSelect = (id: string) => setPatientId(id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    const dados: DadosAgendamento = {
      patientId,
      date,
      time,
      durationMinutes,
      type,
      status,
      modality,
      notes: notes.trim(),
      price: price ? parseFloat(price) : undefined,
      paid,
    };

    onSave(dados, effectiveAppointment?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {appointment ? 'Editar Agendamento' : 'Novo Agendamento na Agenda'}
              </h2>
              <p className="text-xs text-slate-500">
                Organize os atendimentos e consultas do profissional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Paciente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paciente Vinculado ao Prontuário</span>
            </label>
            <select
              required
              value={patientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
            >
              <option value="">-- Selecionar da Lista de Pacientes --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age} anos, {p.sex === 'M' ? 'Masc' : 'Fem'})
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="text-[11px] text-amber-700 font-semibold mt-1">
                Cadastre um paciente em &quot;Pacientes&quot; antes de agendar.
              </p>
            )}
          </div>

          {/* Data, Horário e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Data</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Horário</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duração</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min (Padrão)</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>

          {/* Tipo e Modalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Consulta</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="primeira_consulta">Primeira Consulta (Anamnese + Avaliação)</option>
                <option value="retorno">Retorno / Acompanhamento</option>
                <option value="antropometria">Avaliação Antropométrica (Dobras)</option>
                <option value="bioimpedancia">Bioimpedância / Checagem Rápida</option>
                <option value="ajuste_plano">Ajuste de Prescrição & Plano</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Modalidade</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModality('presencial')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    modality === 'presencial'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Presencial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModality('online')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    modality === 'online'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Online / Tele</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status do Agendamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status da Consulta</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'agendado', label: 'Agendado', color: 'border-slate-300 text-slate-700' },
                { id: 'confirmado', label: 'Confirmado', color: 'border-emerald-500 text-emerald-800 bg-emerald-50' },
                { id: 'em_atendimento', label: 'Em Atend.', color: 'border-blue-500 text-blue-800 bg-blue-50' },
                { id: 'concluido', label: 'Concluído', color: 'border-purple-500 text-purple-800 bg-purple-50' },
                { id: 'cancelado', label: 'Cancelado', color: 'border-red-300 text-red-700 bg-red-50' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as AppointmentStatus)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    status === st.id ? `${st.color} ring-2 ring-emerald-500/20 shadow-xs font-bold` : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valor & Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Valor da Consulta (R$)</label>
              <input
                type="number"
                placeholder="250.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {paid ? '✓ Pagamento Efetuado' : 'Pagamento Pendente'}
                </span>
              </label>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações & Orientações ao Paciente
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Jejum de 4h para avaliação antropométrica, trazer resultados de exames de sangue..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none resize-none"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {effectiveAppointment ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente excluir este agendamento?')) {
                    onDelete(effectiveAppointment.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{effectiveAppointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
