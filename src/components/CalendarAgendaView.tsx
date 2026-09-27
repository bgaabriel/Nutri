import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus, Patient } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Video,
  Building2,
  FileEdit,
  ArrowRight,
  Filter,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';

interface CalendarAgendaViewProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (date?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onSelectPatientAndStartConsultation: (patientId: string) => void;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  appointments,
  patients,
  onAddAppointment,
  onEditAppointment,
  onSelectPatientAndStartConsultation,
  onUpdateAppointmentStatus,
}) => {
  // Current view date cursor (controls displayed month)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // Selected single date for inspecting appointments (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  // Status filter
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  // View mode: 'month' | 'agenda'
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const currentMonthName = monthNames[currentMonthIndex];

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonthIndex, 0).getDate();
    const prevDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonthIndex === 0 ? 12 : currentMonthIndex;
      const y = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
      const mStr = String(m).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      prevDays.push({
        day: d,
        isCurrentMonth: false,
        dateStr: `${y}-${mStr}-${dStr}`,
      });
    }

    // Current month days
    const currDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonthIndex + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      currDays.push({
        day: d,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${mStr}-${dStr}`,
      });
    }

    // Next month filler days to complete grid (up to multiple of 7)
    const totalFilled = prevDays.length + currDays.length;
    const nextDaysNeeded = (7 - (totalFilled % 7)) % 7;
    const nextDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const m = currentMonthIndex + 2 > 12 ? 1 : currentMonthIndex + 2;
      const y = currentMonthIndex + 2 > 12 ? currentYear + 1 : currentYear;
      const mStr = String(m).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      nextDays.push({
        day: d,
        isCurrentMonth: false,
        dateStr: `${y}-${mStr}-${dStr}`,
      });
    }

    return [...prevDays, ...currDays, ...nextDays];
  }, [currentYear, currentMonthIndex]);

  // Appointments mapping by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const list = map.get(apt.date) || [];
      list.push(apt);
      map.set(apt.date, list);
    });
    // sort each list by time
    map.forEach((list) => {
      list.sort((a, b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [appointments]);

  // Selected date's appointments
  const selectedDateAppointments = useMemo(() => {
    let list = appointmentsByDate.get(selectedDateStr) || [];
    if (filterStatus !== 'todos') {
      list = list.filter((a) => a.status === filterStatus);
    }
    return list;
  }, [appointmentsByDate, selectedDateStr, filterStatus]);

  // Format selected date nicely
  const formattedSelectedDate = useMemo(() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    return selectedDateStr;
  }, [selectedDateStr]);

  const todayIso = new Date().toISOString().split('T')[0];

  const getStatusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Confirmado
          </span>
        );
      case 'agendado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Agendado
          </span>
        );
      case 'em_atendimento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Em Atendimento
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3 h-3" />
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
            Cancelado
          </span>
        );
    }
  };

  const getTypeLabel = (type: Appointment['type']) => {
    switch (type) {
      case 'primeira_consulta':
        return '1ª Consulta & Anamnese';
      case 'retorno':
        return 'Consulta de Retorno';
      case 'antropometria':
        return 'Avaliação Antropométrica';
      case 'bioimpedancia':
        return 'Bioimpedância';
      case 'ajuste_plano':
        return 'Ajuste de Prescrição';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Agenda do Profissional
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Planejamento de consultas, confirmações e acesso direto aos prontuários
          </p>
        </div>

        {/* Controls: Mode Switch, Month Navigation, Add button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Month */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={prevMonth}
              title="Mês anterior"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center">
              {currentMonthName} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              title="Próximo mês"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            Hoje
          </button>

          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Mês</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>

          {/* Add appointment button */}
          <button
            onClick={() => onAddAppointment(selectedDateStr)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left (7 cols), Selected Day Agenda on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Side */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {currentMonthName} de {currentYear}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {appointments.length} agendamentos no total
              </span>
            </div>

            {/* Quick Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="confirmado">Confirmados</option>
                <option value="agendado">Agendados</option>
                <option value="concluido">Concluídos</option>
              </select>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((item, idx) => {
              const dayAppointments = appointmentsByDate.get(item.dateStr) || [];
              const isToday = item.dateStr === todayIso;
              const isSelected = item.dateStr === selectedDateStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(item.dateStr)}
                  className={`min-h-[76px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                      : isToday
                      ? 'border-emerald-400 bg-white shadow-xs'
                      : item.isCurrentMonth
                      ? 'border-slate-100 hover:border-slate-300 bg-white'
                      : 'border-transparent bg-slate-50/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : isSelected
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.day}
                    </span>

                    {dayAppointments.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  {/* Day Appointment Previews */}
                  <div className="space-y-0.5 mt-1 overflow-hidden">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${
                          apt.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-900 border-l-2 border-emerald-600'
                            : apt.status === 'concluido'
                            ? 'bg-purple-50 text-purple-800 border-l-2 border-purple-500'
                            : 'bg-amber-50 text-amber-900 border-l-2 border-amber-500'
                        }`}
                      >
                        {apt.time} {apt.patientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <span className="text-[9px] text-slate-500 font-semibold pl-1 block">
                        +{dayAppointments.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Side */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          {/* Header of Selected Day */}
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                {selectedDateStr === todayIso ? '★ HOJE NO CONSULTÓRIO' : 'AGENDAMENTOS DO DIA'}
              </span>
              <h2 className="text-base font-bold text-slate-900 capitalize">
                {formattedSelectedDate}
              </h2>
            </div>
            <button
              onClick={() => onAddAppointment(selectedDateStr)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar neste dia</span>
            </button>
          </div>

          {/* List of appointments on selected date */}
          <div className="space-y-3 overflow-y-auto flex-1 max-h-[560px] pr-1">
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Nenhum atendimento agendado</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Não há horários marcados para esta data. Clique em "Agendar neste dia" para marcar
                  uma consulta.
                </p>
                <button
                  onClick={() => onAddAppointment(selectedDateStr)}
                  className="mt-3 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 text-xs font-semibold text-slate-700 rounded-xl transition-all shadow-2xs"
                >
                  + Marcar Consulta Aqui
                </button>
              </div>
            ) : (
              selectedDateAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white transition-all shadow-2xs space-y-3"
                >
                  {/* Top line: Time, status badge, modality */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {apt.time}
                      </span>
                      <span className="text-[11px] text-slate-500">({apt.durationMinutes} min)</span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {apt.modality === 'online' ? (
                          <>
                            <Video className="w-3 h-3 text-blue-600" /> Online
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3 h-3 text-emerald-600" /> Presencial
                          </>
                        )}
                      </span>
                    </div>

                    <div>{getStatusBadge(apt.status)}</div>
                  </div>

                  {/* Patient Name and Consultation Type */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {apt.patientName}
                      </h3>
                      {apt.price && (
                        <span className="text-xs font-semibold text-slate-600">
                          R$ {apt.price.toFixed(2)}
                          {apt.paid ? (
                            <span className="text-[10px] text-emerald-600 ml-1 font-bold">✓ Pago</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 ml-1 font-semibold">Pendente</span>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      {getTypeLabel(apt.type)}
                    </p>
                  </div>

                  {/* Notes if any */}
                  {apt.notes && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Obs: </span>
                      {apt.notes}
                    </div>
                  )}

                  {/* Actions: Start consultation / View Record, Edit */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onEditAppointment(apt)}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {apt.status !== 'concluido' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'concluido')}
                          className="text-[11px] font-semibold text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Concluir
                        </button>
                      )}

                      {apt.status === 'agendado' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'confirmado')}
                          className="text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Confirmar
                        </button>
                      )}

                      {/* Primary Action: Launch patient record */}
                      <button
                        onClick={() => onSelectPatientAndStartConsultation(apt.patientId)}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                      >
                        <span>Abrir Prontuário</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
