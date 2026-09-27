import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus, ProfessionalProfile } from '../types';
import { ClinicalStage } from './PatientRecordView';
import {
  Calendar as CalendarIcon,
  Clock,
  Activity,
  Plus,
  ArrowRight,
  CheckCircle2,
  Video,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  CalendarRange,
  FileEdit,
  User,
} from 'lucide-react';

interface OverviewDashboardProps {
  appointments: Appointment[];
  profile: ProfessionalProfile;
  onOpenNewAppointment: (date?: string, patientId?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onSelectPatientAndOpenTab: (patientId: string, tab: ClinicalStage) => void;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
}

export type CalendarPeriodFilter = 'dia' | 'semana' | 'mes';

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  appointments,
  profile,
  onOpenNewAppointment,
  onEditAppointment,
  onSelectPatientAndOpenTab,
  onUpdateAppointmentStatus,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  // Period filter: 'dia' | 'semana' | 'mes'
  const [periodFilter, setPeriodFilter] = useState<CalendarPeriodFilter>('dia');

  // Selected date cursor (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => todayIso);

  // Month view date cursor
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Week view base date cursor
  const [weekBaseDate, setWeekBaseDate] = useState(() => new Date());

  // Status filter for appointments
  const [filterStatus, setFilterStatus] = useState<string>('todos');

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

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Day navigation for 'Dia' filter
  const prevDay = () => {
    const parts = selectedDateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${day}`);
  };
  const nextDay = () => {
    const parts = selectedDateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${day}`);
  };

  // Week navigation for 'Semana' filter
  const prevWeek = () => {
    const d = new Date(weekBaseDate);
    d.setDate(d.getDate() - 7);
    setWeekBaseDate(d);
  };
  const nextWeek = () => {
    const d = new Date(weekBaseDate);
    d.setDate(d.getDate() + 7);
    setWeekBaseDate(d);
  };
  const goToCurrentWeek = () => {
    setWeekBaseDate(new Date());
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setWeekBaseDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const currentMonthName = monthNames[currentMonthIndex];

  // Appointments today
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === todayIso)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayIso]);

  // Appointments upcoming in the next 7 days
  const upcomingWeekAppointments = useMemo(() => {
    const now = new Date();
    const nextWeekIso = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return appointments.filter((a) => a.date >= todayIso && a.date <= nextWeekIso);
  }, [appointments, todayIso]);

  // Appointments mapping by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const list = map.get(apt.date) || [];
      list.push(apt);
      map.set(apt.date, list);
    });
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

    // Next month filler days to complete grid
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

  // Compute 7 days for the Week view (Monday to Sunday)
  const weekDays = useMemo(() => {
    const d = new Date(weekBaseDate);
    const day = d.getDay(); // 0 is Sunday
    // Monday as first day:
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday);

    const days: {
      dateStr: string;
      dayName: string;
      dayNumber: number;
      fullDate: Date;
    }[] = [];
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dayNum = String(cur.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${y}-${m}-${dayNum}`,
        dayName: dayNames[i],
        dayNumber: cur.getDate(),
        fullDate: cur,
      });
    }
    return days;
  }, [weekBaseDate]);

  // Week formatted range label: e.g. "22 a 28 de Setembro de 2026"
  const formattedWeekRange = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = weekDays[0];
    const end = weekDays[6];
    const startDay = start.dayNumber;
    const endDay = end.dayNumber;
    const startMonth = monthNames[start.fullDate.getMonth()];
    const endMonth = monthNames[end.fullDate.getMonth()];
    const year = end.fullDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay} a ${endDay} de ${startMonth} de ${year}`;
    }
    return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${year}`;
  }, [weekDays, monthNames]);

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

  // Appointments for the active week
  const weekAppointments = useMemo(() => {
    const weekDateStrs = new Set(weekDays.map((w) => w.dateStr));
    let list = appointments.filter((a) => weekDateStrs.has(a.date));
    if (filterStatus !== 'todos') {
      list = list.filter((a) => a.status === filterStatus);
    }
    return list.sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  }, [appointments, weekDays, filterStatus]);

  const getStatusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Confirmado
          </span>
        );
      case 'agendado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Agendado
          </span>
        );
      case 'em_atendimento':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Em Atendimento
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3 h-3" />
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
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
      default:
        return 'Atendimento Clínico';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner (Quadrado verde sem botões repetidos) */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Activity className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {profile.clinic || 'Clínica Nutricional'}
            </span>
            <span className="text-emerald-200 text-xs font-medium">{profile.crn}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {profile.name}!
          </h1>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Metric 1: Today's Appointments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Consultas Hoje</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {todayAppointments.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {todayAppointments.filter((a) => a.status === 'confirmado').length} confirmadas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Weekly Appointments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Próximos 7 Dias</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {upcomingWeekAppointments.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Consultas na semana
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. CALENDÁRIO & AGENDA INTEGRADA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Calendar Navigation & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Agenda & Calendário do Consultório
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtre por Dia, Semana ou Mês para planejar consultas e acessar prontuários
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botões de Filtro: Dia | Semana | Mês */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 shadow-2xs">
              <button
                onClick={() => {
                  setPeriodFilter('dia');
                  setSelectedDateStr(todayIso);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'dia'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Dia</span>
              </button>

              <button
                onClick={() => {
                  setPeriodFilter('semana');
                  goToCurrentWeek();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'semana'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>

              <button
                onClick={() => {
                  setPeriodFilter('mes');
                  setCurrentDate(new Date());
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'mes'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Mês</span>
              </button>
            </div>

            {/* Date Navigation depending on periodFilter */}
            {periodFilter === 'dia' && (
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={prevDay}
                  title="Dia anterior"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-800 min-w-[140px] text-center capitalize">
                  {selectedDateStr === todayIso
                    ? 'Hoje'
                    : selectedDateStr.split('-').reverse().join('/')}
                </span>
                <button
                  onClick={nextDay}
                  title="Próximo dia"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {periodFilter === 'semana' && (
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={prevWeek}
                  title="Semana anterior"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-800 min-w-[160px] text-center">
                  {formattedWeekRange}
                </span>
                <button
                  onClick={nextWeek}
                  title="Próxima semana"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {periodFilter === 'mes' && (
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={prevMonth}
                  title="Mês anterior"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-800 min-w-[125px] text-center">
                  {currentMonthName} {currentYear}
                </span>
                <button
                  onClick={nextMonth}
                  title="Próximo mês"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Today Button */}
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              Hoje
            </button>

            {/* Filter by Status */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="todos">Todos Status</option>
                <option value="confirmado">Confirmados</option>
                <option value="agendado">Agendados</option>
                <option value="concluido">Concluídos</option>
              </select>
            </div>

            {/* New Appointment Button */}
            <button
              onClick={() => onOpenNewAppointment(selectedDateStr)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 1: FILTRO POR 'DIA'                                       */}
        {/* ============================================================ */}
        {periodFilter === 'dia' && (
          <div className="p-6 space-y-5">
            {/* Header info for selected day */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      {selectedDateStr === todayIso ? '★ ATENDIMENTOS DE HOJE' : 'ATENDIMENTOS DO DIA'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {selectedDateAppointments.length} agendados
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 capitalize">
                    {formattedSelectedDate}
                  </h3>
                </div>
              </div>

            </div>

            {/* List of appointments for selected day */}
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">Nenhum atendimento agendado para este dia</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Use o botão "Agendar" acima para marcar um atendimento nesta data.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDateAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white transition-all shadow-xs space-y-3"
                  >
                    {/* Top Row: Time, Duration, Modality, Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-black text-slate-900 text-base">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          {apt.time}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">({apt.durationMinutes} min)</span>
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

                    {/* Patient & Type */}
                    <div className="border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {apt.patientName}
                        </h4>
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
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                        {getTypeLabel(apt.type)}
                      </p>
                    </div>

                    {/* Notes */}
                    {apt.notes && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Obs: </span>
                        {apt.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onEditAppointment(apt)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {apt.status !== 'concluido' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'concluido')}
                            className="text-[11px] font-semibold text-purple-700 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Concluir
                          </button>
                        )}

                        {apt.status === 'agendado' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'confirmado')}
                            className="text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Confirmar
                          </button>
                        )}

                        <button
                          onClick={() => onSelectPatientAndOpenTab(apt.patientId, 'antropometria')}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          <span>Abrir Prontuário</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: FILTRO POR 'SEMANA'                                    */}
        {/* ============================================================ */}
        {periodFilter === 'semana' && (
          <div className="p-5 space-y-4">
            {/* Header info for selected week */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  AGENDA DA SEMANA
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {formattedWeekRange}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {weekAppointments.length} consultas nesta semana
                </span>
              </div>
            </div>

            {/* 7 Columns Grid for the Days of the Week */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
              {weekDays.map((dayItem) => {
                const dayApts = appointmentsByDate.get(dayItem.dateStr) || [];
                const filteredDayApts =
                  filterStatus === 'todos'
                    ? dayApts
                    : dayApts.filter((a) => a.status === filterStatus);
                const isToday = dayItem.dateStr === todayIso;

                return (
                  <div
                    key={dayItem.dateStr}
                    className={`rounded-2xl border p-3 flex flex-col justify-between transition-all min-h-[300px] ${
                      isToday
                        ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Day Header */}
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                        <div>
                          <span
                            className={`text-xs font-black block uppercase tracking-wider ${
                              isToday ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {dayItem.dayName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {dayItem.dayNumber} {monthNames[dayItem.fullDate.getMonth()].slice(0, 3)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {isToday && (
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                              Hoje
                            </span>
                          )}
                          {filteredDayApts.length > 0 && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                              {filteredDayApts.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Day's appointments list */}
                      <div className="space-y-2">
                        {filteredDayApts.length === 0 ? (
                          <div className="text-center py-6 px-1 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                            <span className="text-[11px] text-slate-400 block">Sem consultas</span>
                          </div>
                        ) : (
                          filteredDayApts.map((apt) => (
                            <div
                              key={apt.id}
                              className="p-2 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 shadow-2xs space-y-1.5 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  {apt.time}
                                </span>
                                <div>{getStatusBadge(apt.status)}</div>
                              </div>

                              <div>
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {apt.patientName}
                                </p>
                                <p className="text-[10px] text-emerald-700 font-medium truncate">
                                  {getTypeLabel(apt.type)}
                                </p>
                              </div>

                              <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                                <button
                                  onClick={() => onEditAppointment(apt)}
                                  className="text-[10px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => onSelectPatientAndOpenTab(apt.patientId, 'antropometria')}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Prontuário</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Quick footer action */}
                    <button
                      onClick={() => onOpenNewAppointment(dayItem.dateStr)}
                      className="mt-3 w-full py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/60 rounded-lg transition-colors border border-dashed border-emerald-200/60 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agendar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: FILTRO POR 'MÊS' (Grade Mensal + Agenda Lateral)       */}
        {/* ============================================================ */}
        {periodFilter === 'mes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Left: Interactive Month Grid (7 cols) */}
            <div className="lg:col-span-7 p-5">
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
                      className={`min-h-[78px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                          : isToday
                          ? 'border-emerald-400 bg-emerald-50/10 shadow-2xs'
                          : item.isCurrentMonth
                          ? 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                          : 'border-transparent bg-slate-50/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : isSelected
                              ? 'bg-emerald-200/80 text-emerald-900'
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

            {/* Right: Selected Day Agenda Timeline (5 cols) */}
            <div className="lg:col-span-5 p-5 flex flex-col bg-slate-50/30">
              {/* Header of Selected Day */}
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    {selectedDateStr === todayIso ? '★ HOJE NO CONSULTÓRIO' : 'AGENDAMENTOS DO DIA'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 capitalize">
                    {formattedSelectedDate}
                  </h3>
                </div>
              </div>

              {/* List of appointments for selected date */}
              <div className="space-y-3 overflow-y-auto flex-1 max-h-[520px] pr-1">
                {selectedDateAppointments.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-white">
                    <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Nenhum atendimento para esta data</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Não há horários marcados. Use o botão "Agendar" acima para marcar um atendimento nesta data.
                    </p>
                  </div>
                ) : (
                  selectedDateAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white transition-all shadow-2xs space-y-2.5"
                    >
                      {/* Top line: Time, modality, status badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-black text-slate-900 text-sm">
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
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {apt.patientName}
                          </h4>
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
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                          {getTypeLabel(apt.type)}
                        </p>
                      </div>

                      {/* Notes */}
                      {apt.notes && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Obs: </span>
                          {apt.notes}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onEditAppointment(apt)}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {apt.status !== 'concluido' && (
                            <button
                              onClick={() => onUpdateAppointmentStatus(apt.id, 'concluido')}
                              className="text-[11px] font-semibold text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Concluir
                            </button>
                          )}

                          {apt.status === 'agendado' && (
                            <button
                              onClick={() => onUpdateAppointmentStatus(apt.id, 'confirmado')}
                              className="text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Confirmar
                            </button>
                          )}

                          <button
                            onClick={() => onSelectPatientAndOpenTab(apt.patientId, 'antropometria')}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
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
        )}
      </div>
    </div>
  );
};
