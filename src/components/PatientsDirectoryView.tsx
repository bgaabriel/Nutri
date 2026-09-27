import React, { useState, useMemo } from 'react';
import { Appointment, Consultation, Patient, Sex } from '../types';
import { ClinicalStage } from './PatientRecordView';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Calendar,
  FileText,
  Phone,
  Mail,
  Sparkles,
  Clock,
  Utensils,
} from 'lucide-react';

interface PatientsDirectoryViewProps {
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
  activePatientId: string;
  onSelectPatient: (patientId: string, initialTab?: ClinicalStage) => void;
  onOpenNewPatientModal: () => void;
  onOpenScheduleAppointment: (patientId: string) => void;
}

export const PatientsDirectoryView: React.FC<PatientsDirectoryViewProps> = ({
  patients,
  consultations,
  appointments,
  activePatientId,
  onSelectPatient,
  onOpenNewPatientModal,
  onOpenScheduleAppointment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sexFilter, setSexFilter] = useState<'ALL' | Sex>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'consultations'>('recent');

  // Filtered and sorted patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.phone && p.phone.includes(searchTerm)) ||
          (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSex = sexFilter === 'ALL' || p.sex === sexFilter;

        return matchesSearch && matchesSex;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'consultations') {
          const countA = consultations.filter((c) => c.patientId === a.id).length;
          const countB = consultations.filter((c) => c.patientId === b.id).length;
          return countB - countA;
        }
        // recent by createdAt or last consultation
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [patients, consultations, searchTerm, sexFilter, sortBy]);

  // Overall metrics
  const totalPatients = patients.length;
  const totalConsultations = consultations.length;
  const totalUpcomingAppointments = appointments.filter((a) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return a.date >= todayStr && a.status !== 'cancelado';
  }).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* View Header & Metric Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>Gestão de Pacientes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consulte a lista completa de pacientes, gerencie cadastros e acerte o prontuário clínico individual.
          </p>
        </div>

        <button
          onClick={onOpenNewPatientModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Paciente</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 block">
              Total de Pacientes
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalPatients}</span>
              <span className="text-xs text-slate-500 font-medium">cadastrados</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 block">
              Prontuários / Sessões
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalConsultations}</span>
              <span className="text-xs text-slate-500 font-medium">registradas</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 block">
              Agendamentos Futuros
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalUpcomingAppointments}</span>
              <span className="text-xs text-slate-500 font-medium">na agenda</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, objetivo, telefone ou e-mail..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSexFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sexFilter === 'ALL'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({patients.length})
            </button>
            <button
              onClick={() => setSexFilter('M')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sexFilter === 'M'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masc ({patients.filter((p) => p.sex === 'M').length})
            </button>
            <button
              onClick={() => setSexFilter('F')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sexFilter === 'F'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fem ({patients.filter((p) => p.sex === 'F').length})
            </button>
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-600"
          >
            <option value="recent">Mais Recentes</option>
            <option value="name">Nome (A-Z)</option>
            <option value="consultations">Mais Consultas</option>
          </select>
        </div>
      </div>

      {/* Patient Cards List */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {patients.length === 0 ? 'Nenhum paciente cadastrado' : 'Nenhum paciente localizado'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {patients.length === 0
                ? 'Use o botão "Cadastrar Novo Paciente" acima para começar.'
                : 'Não encontramos nenhum paciente correspondente à sua busca ou filtro atual.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => {
              const patientHistory = consultations.filter((c) => c.patientId === patient.id);
              const lastConsultation = patientHistory[patientHistory.length - 1];
              const isActive = patient.id === activePatientId;
              const nextAppointment = appointments.find(
                (a) =>
                  a.patientId === patient.id &&
                  a.date >= new Date().toISOString().split('T')[0] &&
                  a.status !== 'cancelado'
              );

              return (
                <div
                  key={patient.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between hover:shadow-md ${
                    isActive
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar & Identification */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-2xs ${
                            patient.sex === 'M' ? 'bg-emerald-600' : 'bg-teal-600'
                          }`}
                        >
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                            {patient.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-semibold text-slate-500">
                              {patient.age} anos • {patient.sex === 'M' ? 'Masculino' : 'Feminino'}
                            </span>
                            {isActive && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                Selecionado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Objective Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span className="truncate">{patient.objective || 'Avaliação Geral'}</span>
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1 text-xs text-slate-600 mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      {patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-[11px]">{patient.email}</span>
                        </div>
                      )}
                      {!patient.phone && !patient.email && (
                        <span className="text-slate-400 text-[11px] italic">
                          Sem telefone ou e-mail cadastrado
                        </span>
                      )}
                    </div>

                    {/* Clinical Summary Bar */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                          Consultas
                        </span>
                        <span className="font-bold text-slate-900">
                          {patientHistory.length} {patientHistory.length === 1 ? 'sessão' : 'sessões'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                          Última Visita
                        </span>
                        <span className="font-bold text-slate-900 truncate block">
                          {lastConsultation ? lastConsultation.date : 'Nunca avaliado'}
                        </span>
                      </div>
                    </div>

                    {/* Next scheduled appointment reminder if any */}
                    {nextAppointment && (
                      <div className="flex items-center gap-1.5 text-[11px] text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1.5 rounded-xl mb-4 font-medium">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>
                          Agendado: {nextAppointment.date} às {nextAppointment.time}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onSelectPatient(patient.id, 'antropometria')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Prontuário</span>
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </button>

                    <button
                      onClick={() => onSelectPatient(patient.id, 'cardapio')}
                      title="Abrir montagem de cardápio diretamente"
                      className="flex items-center gap-1 px-2.5 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Cardápio</span>
                    </button>

                    <button
                      onClick={() => onOpenScheduleAppointment(patient.id)}
                      title="Agendar nova consulta para este paciente"
                      className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-emerald-700" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
