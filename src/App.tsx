/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Patient,
  Consultation,
  ProfessionalProfile,
  Anamnesis,
  Anthropometry,
  EnergyPrescription,
  Appointment,
  AppointmentStatus,
  MealPlan,
} from './types';
import {
  listarPacientes,
  salvarPaciente,
  atualizarPaciente,
  listarConsultas,
  salvarConsulta,
  excluirConsulta,
  listarAgendamentos,
  salvarAgendamento,
  excluirAgendamento,
  carregarPerfil,
  salvarPerfil,
  listarAlimentos,
  montarBackup,
  importarBackup,
  NovoPaciente,
  DadosAgendamento,
} from './lib/db';
import { supabase, supabaseConfigurado } from './lib/supabase';
import { definirBaseAlimentos } from './data/tacoFoods';
import { calculateAllMetrics } from './calculations';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PatientsDirectoryView } from './components/PatientsDirectoryView';
import { PatientRecordView, ClinicalStage } from './components/PatientRecordView';
import { AppointmentModal } from './components/AppointmentModal';
import { PatientsModal, PatientsModalMode } from './components/PatientsModal';
import { ProfileModal } from './components/ProfileModal';
import { ConsultorioReportView } from './components/ConsultorioReportView';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import {
  Users,
  LayoutDashboard,
  FileText,
  Settings,
  CheckCircle2,
  LogOut,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { hojeLocalISO } from './utils/date';

export type MainTab = 'panorama' | 'agenda' | 'pacientes' | 'prontuario';

const CAMINHO_NOVA_SENHA = '/redefinir-senha';

/**
 * Porta de entrada: sem sessão, nada do consultório é renderizado.
 * Mostra login / cadastro / nova senha e, com sessão, o app.
 */
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [tela, setTela] = useState<'login' | 'cadastro'>('login');
  const [redefinindoSenha, setRedefinindoSenha] = useState(
    () => window.location.pathname === CAMINHO_NOVA_SENHA
  );

  useEffect(() => {
    if (!supabaseConfigurado) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setVerificando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      setSession(novaSessao);
      if (evento === 'PASSWORD_RECOVERY') setRedefinindoSenha(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigurado) {
    return (
      <TelaAviso
        titulo="Supabase não configurado"
        texto="Crie o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example e supabase/LEIA-ME.md) e reinicie o app."
      />
    );
  }

  if (verificando) return <TelaCarregando texto="Verificando acesso…" />;

  if (redefinindoSenha && session) {
    return (
      <ResetPasswordPage
        onConcluir={() => {
          setRedefinindoSenha(false);
          window.history.replaceState(null, '', '/');
        }}
      />
    );
  }

  if (!session) {
    return tela === 'cadastro' ? (
      <SignUpPage onVoltar={() => setTela('login')} />
    ) : (
      <LoginPage onCriarConta={() => setTela('cadastro')} />
    );
  }

  // key: trocar de conta recarrega tudo do zero
  return <ConsultorioApp key={session.user.id} onSair={() => supabase.auth.signOut()} />;
}

const TelaCarregando: React.FC<{ texto: string }> = ({ texto }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
    <span>{texto}</span>
  </div>
);

const TelaAviso: React.FC<{ titulo: string; texto: string; acao?: React.ReactNode }> = ({ titulo, texto, acao }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 max-w-md w-full text-center space-y-3">
      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
      <h1 className="text-base font-extrabold text-slate-900">{titulo}</h1>
      <p className="text-xs text-slate-600">{texto}</p>
      {acao}
    </div>
  </div>
);

const perfilVazio: ProfessionalProfile = { name: '', crn: '', clinic: '', phone: '', email: '' };

/** Rascunho da consulta de hoje: repete os dados da última consulta ou começa em branco. */
function criarRascunho(patientId: string, historico: Consultation[]): Consultation {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const ultima = historico.length > 0 ? historico[historico.length - 1] : null;
  if (ultima) {
    return {
      id: 'rascunho',
      patientId,
      date: hoje,
      title: `Retorno (${hoje})`,
      anamnesis: { ...ultima.anamnesis },
      anthropometry: {
        ...ultima.anthropometry,
        circumferences: { ...ultima.anthropometry.circumferences },
        skinfolds: { ...ultima.anthropometry.skinfolds },
      },
      prescription: { ...ultima.prescription },
    };
  }
  return {
    id: 'rascunho',
    patientId,
    date: hoje,
    title: `Consulta Inicial (${hoje})`,
    anamnesis: {
      occupation: '',
      workRoutine: '',
      foodRecall: '',
      sleepHabit: '',
      waterIntakeLiters: '',
      bowelHabit: '',
      trainingRoutine: '',
      allergiesAversions: '',
      clinicalNotes: '',
      labExams: { fastingGlucose: '', totalCholesterol: '', hdlCholesterol: '', triglycerides: '', otherExams: '' },
    },
    anthropometry: {
      weight: 70,
      usualWeight: 0,
      height: 170,
      circumferences: { chest: 0, neck: 0, waist: 0, abdomen: 0, hip: 0, relaxedArm: 0, thigh: 0, calf: 0 },
      skinfolds: { triceps: 0, subscapular: 0, chest: 0, midaxillary: 0, suprailiac: 0, abdominal: 0, thigh: 0 },
      fatProtocol: 'marinha',
    },
    prescription: {
      bmrFormula: 'mifflin',
      activityFactor: 1.55,
      targetKcalAdjustment: 0,
      proteinGKg: 1.6,
      carbGKg: 0,
      fatGKg: 0.8,
    },
  };
}

function ConsultorioApp({ onSair }: { onSair: () => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile>(perfilVazio);

  // Carregamento dos dados da conta depois do login
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  // Main screen navigation: 'panorama' | 'agenda' | 'pacientes' | 'prontuario'
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('panorama');

  // Clinical stage within prontuário: 'anamnese' | 'antropometria' | 'metabolismo' | 'comparativo' | 'relatorio'
  const [clinicalStage, setClinicalStage] = useState<ClinicalStage>('antropometria');

  // Modals state
  const [patientsModalMode, setPatientsModalMode] = useState<PatientsModalMode | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConsultorioReportOpen, setIsConsultorioReportOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDefaultDate, setAppointmentDefaultDate] = useState<string | undefined>(undefined);
  const [appointmentDefaultPatientId, setAppointmentDefaultPatientId] = useState<string | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastErro, setToastErro] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Um aviso novo reinicia o tempo (o timer do aviso anterior não pode apagá-lo antes da hora)
  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (msg: string, erro = false) => {
    setToastMessage(msg);
    setToastErro(erro);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), erro ? 6000 : 3500);
  };
  const mostrarErro = (e: unknown) => showToast(e instanceof Error ? e.message : String(e), true);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    setErroCarga(null);
    try {
      const [pacientes, consultas, agenda, perfil] = await Promise.all([
        listarPacientes(),
        listarConsultas(),
        listarAgendamentos(),
        carregarPerfil(),
      ]);
      setPatients(pacientes);
      setConsultations(consultas);
      setAppointments(agenda);
      setProfile(perfil);
      setActivePatientId((atual) => atual || pacientes[0]?.id || '');
    } catch (e) {
      setErroCarga(e instanceof Error ? e.message : 'Erro ao carregar os dados.');
    } finally {
      setCarregando(false);
    }
    // Tabela TACO do banco (uma vez por login); se falhar, o JSON local continua valendo
    listarAlimentos()
      .then(definirBaseAlimentos)
      .catch((e) => console.warn('TACO do Supabase indisponível; usando a base local.', e));
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  // Active patient object
  const activePatient: Patient = patients.find((p) => p.id === activePatientId) ||
    patients[0] || {
      id: '',
      name: '',
      age: 0,
      sex: 'M',
      objective: '',
      createdAt: hojeLocalISO(),
    };

  // Active patient's consultation history
  const activePatientHistory = consultations.filter((c) => c.patientId === activePatient.id);

  // Active consultation draft
  const [currentConsultation, setCurrentConsultation] = useState<Consultation>(() => criarRascunho('', []));

  // Switch active patient
  const handleSelectPatient = (patientId: string, initialStage?: ClinicalStage) => {
    setActivePatientId(patientId);
    if (initialStage) {
      setClinicalStage(initialStage);
    }
    setCurrentConsultation(
      criarRascunho(
        patientId,
        consultations.filter((c) => c.patientId === patientId)
      )
    );
  };

  // Patients handling
  const handleAddPatient = async (dados: NovoPaciente) => {
    try {
      const novo = await salvarPaciente(dados);
      setPatients((lista) => [...lista, novo]);
      handleSelectPatient(novo.id, 'anamnese');
      setActiveMainTab('prontuario');
      showToast(`Paciente ${novo.name} cadastrado com sucesso!`);
    } catch (e) {
      mostrarErro(e);
    }
  };

  // A Anamnese atualiza o cadastro a cada tecla: grava no banco com um pequeno atraso
  const pendentesPaciente = useRef(new Map<string, { campos: Partial<Patient>; timer: number }>());
  const handleUpdatePatient = (updatedFields: Partial<Patient>) => {
    const id = activePatient.id;
    if (!id) return;
    setPatients((lista) => lista.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    const anterior = pendentesPaciente.current.get(id);
    if (anterior) window.clearTimeout(anterior.timer);
    const campos = { ...anterior?.campos, ...updatedFields };
    const timer = window.setTimeout(() => {
      pendentesPaciente.current.delete(id);
      atualizarPaciente(id, campos).catch(mostrarErro);
    }, 700);
    pendentesPaciente.current.set(id, { campos, timer });
  };

  // Consultation draft updates
  const handleUpdateAnamnesis = (updated: Partial<Anamnesis>) => {
    setCurrentConsultation((prev) => ({
      ...prev,
      anamnesis: { ...prev.anamnesis, ...updated },
    }));
  };

  const handleUpdateAnthropometry = (updated: Partial<Anthropometry>) => {
    setCurrentConsultation((prev) => ({
      ...prev,
      anthropometry: { ...prev.anthropometry, ...updated },
    }));
  };

  const handleUpdatePrescription = (updated: Partial<EnergyPrescription>) => {
    setCurrentConsultation((prev) => ({
      ...prev,
      prescription: { ...prev.prescription, ...updated },
    }));
  };

  const handleUpdateMealPlan = (plan: MealPlan) => {
    setCurrentConsultation((prev) => ({
      ...prev,
      mealPlan: plan,
    }));
  };

  // Calculations
  const calculatedMetrics = calculateAllMetrics(
    activePatient.age,
    activePatient.sex,
    currentConsultation.anthropometry,
    currentConsultation.prescription
  );

  // Save consultation to history
  const handleSaveConsultation = async () => {
    if (!activePatient.id) return;
    try {
      const salva = await salvarConsulta({
        ...currentConsultation,
        patientId: activePatient.id,
        calculated: calculatedMetrics,
      });
      setConsultations((lista) => [...lista, salva]);
      showToast(`Consulta salva com sucesso no histórico de ${activePatient.name}!`);
    } catch (e) {
      mostrarErro(e);
    }
  };

  const handleLoadConsultation = (session: Consultation) => {
    // `calculated` é só o registro histórico; a edição recalcula ao vivo
    const { calculated: _registroHistorico, ...dadosDaConsulta } = session;
    setCurrentConsultation({
      ...dadosDaConsulta,
      id: 'rascunho',
    });
    setClinicalStage('antropometria');
    showToast(`Consulta de ${session.date} carregada para edição.`);
  };

  const handleDeleteConsultation = async (id: string) => {
    try {
      await excluirConsulta(id);
      setConsultations((lista) => lista.filter((c) => c.id !== id));
      showToast('Registro de consulta excluído.');
    } catch (e) {
      mostrarErro(e);
    }
  };

  // Appointments / Agenda handling
  const handleSaveAppointment = async (dados: DadosAgendamento, id?: string) => {
    try {
      const salvo = await salvarAgendamento(dados, id);
      setAppointments((lista) => (id ? lista.map((a) => (a.id === id ? salvo : a)) : [...lista, salvo]));
      showToast(id ? 'Agendamento atualizado com sucesso!' : 'Consulta agendada com sucesso!');
    } catch (e) {
      mostrarErro(e);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await excluirAgendamento(appointmentId);
      setAppointments((lista) => lista.filter((a) => a.id !== appointmentId));
      showToast('Agendamento removido da agenda.');
    } catch (e) {
      mostrarErro(e);
    }
  };

  const handleUpdateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    const atual = appointments.find((a) => a.id === id);
    if (!atual) return;
    const { id: _id, patientName: _nome, ...dados } = atual;
    salvarAgendamento({ ...dados, status }, id)
      .then((salvo) => {
        setAppointments((lista) => lista.map((a) => (a.id === id ? salvo : a)));
        showToast('Status da consulta atualizado.');
      })
      .catch(mostrarErro);
  };

  const handleOpenNewAppointment = (date?: string, patientId?: string) => {
    setSelectedAppointment(null);
    setAppointmentDefaultDate(date || hojeLocalISO());
    setAppointmentDefaultPatientId(patientId);
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentDefaultDate(appointment.date);
    setAppointmentDefaultPatientId(undefined);
    setIsAppointmentModalOpen(true);
  };

  // Profile handling (CPF, CRN e e-mail não mudam pelo app)
  const handleSaveProfile = async (newProfile: ProfessionalProfile) => {
    try {
      await salvarPerfil(newProfile);
      setProfile((atual) => ({
        ...atual,
        name: newProfile.name,
        clinic: newProfile.clinic,
        phone: newProfile.phone,
        address: newProfile.address,
      }));
      showToast('Dados profissionais atualizados!');
    } catch (e) {
      mostrarErro(e);
    }
  };

  // Export / Import backup JSON
  const handleExportBackup = () => {
    const dataStr = montarBackup(profile, patients, consultations, appointments);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_nutripro_${hojeLocalISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exportado com sucesso!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;
      try {
        const resumo = await importarBackup(content);
        await carregarTudo();
        const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
        showToast(
          `${plural(resumo.pacientes, 'paciente', 'pacientes')}, ${plural(resumo.consultas, 'consulta', 'consultas')} e ${plural(
            resumo.agendamentos,
            'agendamento',
            'agendamentos'
          )} importados.` + (resumo.ignorados ? ` ${resumo.ignorados} registro(s) sem paciente foram ignorados.` : '')
        );
      } catch (err) {
        mostrarErro(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (carregando && patients.length === 0 && !erroCarga) return <TelaCarregando texto="Carregando o consultório…" />;

  if (erroCarga) {
    return (
      <TelaAviso
        titulo="Não foi possível carregar seus dados"
        texto={erroCarga}
        acao={
          <div className="flex gap-2 justify-center pt-1">
            <button
              onClick={carregarTudo}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Tentar de novo
            </button>
            <button
              onClick={onSair}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
            >
              Sair
            </button>
          </div>
        }
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastErro ? 'alert' : 'status'}
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 text-white px-4 py-3 rounded-2xl shadow-xl font-bold text-sm border max-w-md animate-in fade-in slide-in-from-top-4 ${
            toastErro ? 'bg-red-700 border-red-600' : 'bg-emerald-700 border-emerald-600'
          }`}
        >
          {toastErro ? (
            <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden file input for importing backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json"
        className="hidden"
      />

      {/* SIDEBAR NAVIGATION (Cleaned up as requested: No individual stage tabs here) */}
      <aside className="no-print w-full md:w-68 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between shadow-xs">
        <div className="p-5">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xs">
              N
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                NutriPro
              </span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold block">
                Clínico & Consultório
              </span>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 block mb-1.5">
              Menu Principal
            </span>

            {/* 1. Panorama & Calendário Integrado */}
            <button
              onClick={() => setActiveMainTab('panorama')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeMainTab === 'panorama' || activeMainTab === 'agenda'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Panorama & Calendário</span>
              </div>
              {appointments.filter(
                (a) => a.date === hojeLocalISO()
              ).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* 2. Pacientes (Shows all patients as requested) */}
            <button
              onClick={() => setActiveMainTab('pacientes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeMainTab === 'pacientes'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Pacientes</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  activeMainTab === 'pacientes'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {patients.length}
              </span>
            </button>
          </div>

          {/* Contextual Active Prontuário Sub-Section */}
          {activeMainTab === 'prontuario' && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 px-3 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-emerald-700" />
                <span>Prontuário em Aberto</span>
              </span>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {activePatient.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {activePatient.name}
                    </p>
                    <p className="text-[10px] text-emerald-800 font-semibold truncate">
                      {activePatient.age} anos • {activePatient.sex === 'M' ? 'Masc' : 'Fem'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Professional Profile */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Professional profile badge */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Perfil, relatórios e backup"
              className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="overflow-hidden pr-2">
                <p className="text-xs font-bold text-slate-900 truncate">{profile.name}</p>
                <p className="text-[10px] text-emerald-700 font-bold">{profile.crn}</p>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>
            <button
              onClick={onSair}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP BAR (Hidden on Print) */}
        <header className="no-print border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-2xs">
          {/* Active View title and navigation cues */}
          <div className="flex items-center gap-3">
            {activeMainTab === 'panorama' || activeMainTab === 'agenda' ? (
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Panorama Geral & Calendário
                </h1>
                <p className="text-xs text-slate-500">
                  Visão executiva do consultório e agenda clínica integrada
                </p>
              </div>
            ) : activeMainTab === 'pacientes' ? (
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Diretório de Pacientes
                </h1>
                <p className="text-xs text-slate-500">
                  Selecione um paciente para acessar o prontuário completo, antropometria e prescrições
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Prontuário</h1>
                <p className="text-xs text-slate-500">
                  Anamnese, antropometria, gasto energético, cardápio e evolução do paciente
                </p>
              </div>
            )}
          </div>

        </header>

        {/* TAB CONTENT AREA */}
        <section className="p-6 md:p-8 flex-1">
          {/* VIEW 1: PANORAMA GERAL & CALENDÁRIO INTEGRADO */}
          {(activeMainTab === 'panorama' || activeMainTab === 'agenda') && (
            <OverviewDashboard
              appointments={appointments}
              profile={profile}
              onOpenNewAppointment={handleOpenNewAppointment}
              onEditAppointment={handleEditAppointment}
              onSelectPatientAndOpenTab={(pId, tab) => {
                handleSelectPatient(pId, tab);
                setActiveMainTab('prontuario');
              }}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            />
          )}

          {/* VIEW 3: PACIENTES (Lista de todos os pacientes) */}
          {activeMainTab === 'pacientes' && (
            <PatientsDirectoryView
              patients={patients}
              consultations={consultations}
              appointments={appointments}
              activePatientId={activePatientId}
              onSelectPatient={(patientId, initialTab) => {
                handleSelectPatient(patientId, initialTab || 'antropometria');
                setActiveMainTab('prontuario');
              }}
              onOpenNewPatientModal={() => setPatientsModalMode('cadastrar')}
              onOpenScheduleAppointment={(patientId) => handleOpenNewAppointment(undefined, patientId)}
            />
          )}

          {/* VIEW 4: PRONTUÁRIO CLÍNICO (Aparece ao selecionar o paciente, com todas as etapas) */}
          {activeMainTab === 'prontuario' && (
            <PatientRecordView
              patient={activePatient}
              consultation={currentConsultation}
              consultationHistory={activePatientHistory}
              profile={profile}
              calculatedMetrics={calculatedMetrics}
              activeStage={clinicalStage}
              onChangeStage={(stage) => setClinicalStage(stage)}
              onBackToPatients={() => setActiveMainTab('pacientes')}
              onOpenSwitchPatientModal={() => setPatientsModalMode('selecionar')}
              onSaveConsultation={handleSaveConsultation}
              onUpdatePatient={handleUpdatePatient}
              onUpdateAnamnesis={handleUpdateAnamnesis}
              onUpdateAnthropometry={handleUpdateAnthropometry}
              onUpdatePrescription={handleUpdatePrescription}
              onUpdateMealPlan={handleUpdateMealPlan}
              onLoadConsultation={handleLoadConsultation}
              onDeleteConsultation={handleDeleteConsultation}
            />
          )}
        </section>
      </main>

      {/* MODALS */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patients={patients}
        appointment={selectedAppointment}
        initialDate={appointmentDefaultDate}
        defaultPatientId={appointmentDefaultPatientId}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
      />

      {patientsModalMode && (
        <PatientsModal
          modo={patientsModalMode}
          onClose={() => setPatientsModalMode(null)}
          patients={patients}
          activePatientId={activePatientId}
          onSelectPatient={(pId) => {
            handleSelectPatient(pId, 'antropometria');
            setActiveMainTab('prontuario');
          }}
          onAddPatient={handleAddPatient}
        />
      )}

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
        onExportBackup={handleExportBackup}
        onImportBackup={() => fileInputRef.current?.click()}
        onOpenConsultorioReport={() => {
          setIsProfileModalOpen(false);
          setIsConsultorioReportOpen(true);
        }}
      />

      {isConsultorioReportOpen && (
        <ConsultorioReportView
          patients={patients}
          consultations={consultations}
          onClose={() => setIsConsultorioReportOpen(false)}
        />
      )}
    </div>
  );
}
