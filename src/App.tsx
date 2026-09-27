/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
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
  loadPatients,
  savePatients,
  loadConsultations,
  saveConsultations,
  loadProfile,
  saveProfile,
  loadAppointments,
  saveAppointments,
  exportBackupData,
  importBackupData,
} from './storage';
import { calculateAllMetrics } from './calculations';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PatientsDirectoryView } from './components/PatientsDirectoryView';
import { PatientRecordView, ClinicalStage } from './components/PatientRecordView';
import { AppointmentModal } from './components/AppointmentModal';
import { PatientsModal, PatientsModalMode } from './components/PatientsModal';
import { ProfileModal } from './components/ProfileModal';
import { ConsultorioReportView } from './components/ConsultorioReportView';
import {
  Users,
  LayoutDashboard,
  FileText,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { hojeLocalISO } from './utils/date';

export type MainTab = 'panorama' | 'agenda' | 'pacientes' | 'prontuario';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => loadPatients());
  const [activePatientId, setActivePatientId] = useState<string>(() => {
    const list = loadPatients();
    return list.length > 0 ? list[0].id : 'p1';
  });
  const [consultations, setConsultations] = useState<Consultation[]>(() => loadConsultations());
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadAppointments());
  const [profile, setProfile] = useState<ProfessionalProfile>(() => loadProfile());

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active patient object
  const activePatient =
    patients.find((p) => p.id === activePatientId) ||
    patients[0] || {
      id: 'p1',
      name: 'João Silva',
      age: 30,
      sex: 'M',
      objective: 'Avaliação Nutricional',
      createdAt: '2026-01-10',
    };

  // Active patient's consultation history
  const activePatientHistory = consultations.filter((c) => c.patientId === activePatient.id);

  // Active consultation draft
  const [currentConsultation, setCurrentConsultation] = useState<Consultation>(() => {
    const history = loadConsultations().filter((c) => c.patientId === activePatientId);
    const lastSession = history.length > 0 ? history[history.length - 1] : null;

    const todayStr = new Date().toLocaleDateString('pt-BR');

    if (lastSession) {
      return {
        id: 'draft_' + Date.now(),
        patientId: activePatientId,
        date: todayStr,
        title: `Consulta de Retorno (${todayStr})`,
        anamnesis: { ...lastSession.anamnesis },
        anthropometry: {
          ...lastSession.anthropometry,
          weight: lastSession.anthropometry.weight || 85.0,
          circumferences: { ...lastSession.anthropometry.circumferences },
          skinfolds: { ...lastSession.anthropometry.skinfolds },
          fatProtocol: lastSession.anthropometry.fatProtocol || 'marinha',
        },
        prescription: { ...lastSession.prescription },
      };
    }

    return {
      id: 'draft_' + Date.now(),
      patientId: activePatientId,
      date: todayStr,
      title: `Consulta Inicial (${todayStr})`,
      anamnesis: {
        occupation: 'Analista administrativo',
        workRoutine: 'Escritório 8h–18h, sentado, almoça fora',
        foodRecall: '',
        sleepHabit: '7 horas, sono agitado',
        waterIntakeLiters: '1.5 Litros',
        bowelHabit: 'Irregular (a cada 2 dias)',
        trainingRoutine: 'Musculação, 3x na semana, intensidade moderada',
        allergiesAversions: 'Intolerância a lactose leve. Não gosta de fígado.',
        clinicalNotes: 'Uso contínuo de Omeprazol.',
        labExams: {
          fastingGlucose: '95 mg/dL',
          totalCholesterol: '180 mg/dL',
          hdlCholesterol: '45 mg/dL',
          triglycerides: '120 mg/dL',
          otherExams: '',
        },
      },
      anthropometry: {
        weight: 85.0,
        usualWeight: 82.0,
        height: 175,
        circumferences: {
          chest: 102.0,
          neck: 40.0,
          waist: 86.0,
          abdomen: 92.0,
          hip: 102.0,
          relaxedArm: 32.0,
          thigh: 58.0,
          calf: 38.0,
        },
        skinfolds: {
          triceps: 12.0,
          subscapular: 18.0,
          chest: 10.0,
          midaxillary: 10.0,
          suprailiac: 20.0,
          abdominal: 25.0,
          thigh: 15.0,
        },
        fatProtocol: 'marinha',
      },
      prescription: {
        bmrFormula: 'mifflin',
        activityFactor: 1.55,
        targetKcalAdjustment: -500,
        proteinGKg: 2.0,
        carbGKg: 3.0,
        fatGKg: 0.8,
      },
    };
  });

  // Switch active patient
  const handleSelectPatient = (patientId: string, initialStage?: ClinicalStage) => {
    setActivePatientId(patientId);
    if (initialStage) {
      setClinicalStage(initialStage);
    }
    const history = consultations.filter((c) => c.patientId === patientId);
    const todayStr = new Date().toLocaleDateString('pt-BR');

    if (history.length > 0) {
      const last = history[history.length - 1];
      setCurrentConsultation({
        id: 'draft_' + Date.now(),
        patientId,
        date: todayStr,
        title: `Retorno (${todayStr})`,
        anamnesis: { ...last.anamnesis },
        anthropometry: { ...last.anthropometry },
        prescription: { ...last.prescription },
      });
    } else {
      setCurrentConsultation({
        id: 'draft_' + Date.now(),
        patientId,
        date: todayStr,
        title: `Consulta Inicial (${todayStr})`,
        anamnesis: {
          occupation: '',
          workRoutine: '',
          foodRecall: '',
          sleepHabit: '',
          waterIntakeLiters: '2.0 Litros',
          bowelHabit: 'Diário',
          trainingRoutine: '',
          allergiesAversions: '',
          clinicalNotes: '',
          labExams: {
            fastingGlucose: '',
            totalCholesterol: '',
            hdlCholesterol: '',
            triglycerides: '',
            otherExams: '',
          },
        },
        anthropometry: {
          weight: 70.0,
          usualWeight: 0,
          height: 170,
          circumferences: {
            chest: 96,
            neck: 38,
            waist: 80,
            abdomen: 84,
            hip: 98,
            relaxedArm: 30,
            thigh: 54,
            calf: 36,
          },
          skinfolds: {
            triceps: 10,
            subscapular: 14,
            chest: 8,
            midaxillary: 8,
            suprailiac: 16,
            abdominal: 20,
            thigh: 12,
          },
          fatProtocol: 'marinha',
        },
        prescription: {
          bmrFormula: 'mifflin',
          activityFactor: 1.55,
          targetKcalAdjustment: 0,
          proteinGKg: 2.0,
          carbGKg: 3.5,
          fatGKg: 0.8,
        },
      });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Patients handling
  const handleAddPatient = (newPatient: Patient) => {
    const updated = [...patients, newPatient];
    setPatients(updated);
    savePatients(updated);
    setActivePatientId(newPatient.id);
    handleSelectPatient(newPatient.id, 'anamnese');
    setActiveMainTab('prontuario');
    showToast(`Paciente ${newPatient.name} cadastrado com sucesso!`);
  };

  const handleUpdatePatient = (updatedFields: Partial<Patient>) => {
    const updatedPatients = patients.map((p) =>
      p.id === activePatient.id ? { ...p, ...updatedFields } : p
    );
    setPatients(updatedPatients);
    savePatients(updatedPatients);
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
  const handleSaveConsultation = () => {
    const calculated = calculateAllMetrics(
      activePatient.age,
      activePatient.sex,
      currentConsultation.anthropometry,
      currentConsultation.prescription
    );

    const newRecord: Consultation = {
      ...currentConsultation,
      id: 'c_' + Date.now(),
      patientId: activePatient.id,
      calculated,
    };

    const updated = [...consultations, newRecord];
    setConsultations(updated);
    saveConsultations(updated);
    showToast(`Consulta salva com sucesso no histórico de ${activePatient.name}!`);
  };

  const handleLoadConsultation = (session: Consultation) => {
    // `calculated` é só o registro histórico; a edição recalcula ao vivo
    const { calculated: _registroHistorico, ...dadosDaConsulta } = session;
    setCurrentConsultation({
      ...dadosDaConsulta,
      id: 'draft_' + Date.now(),
    });
    setClinicalStage('antropometria');
    showToast(`Consulta de ${session.date} carregada para edição.`);
  };

  const handleDeleteConsultation = (id: string) => {
    const updated = consultations.filter((c) => c.id !== id);
    setConsultations(updated);
    saveConsultations(updated);
    showToast('Registro de consulta excluído.');
  };

  // Appointments / Agenda handling
  const handleSaveAppointment = (appointment: Appointment) => {
    let updated: Appointment[];
    const exists = appointments.some((a) => a.id === appointment.id);
    if (exists) {
      updated = appointments.map((a) => (a.id === appointment.id ? appointment : a));
      showToast('Agendamento atualizado com sucesso!');
    } else {
      updated = [...appointments, appointment];
      showToast('Consulta agendada com sucesso!');
    }
    setAppointments(updated);
    saveAppointments(updated);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    const updated = appointments.filter((a) => a.id !== appointmentId);
    setAppointments(updated);
    saveAppointments(updated);
    showToast('Agendamento removido da agenda.');
  };

  const handleUpdateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status } : a));
    setAppointments(updated);
    saveAppointments(updated);
    showToast(`Status da consulta atualizado.`);
  };

  const handleOpenNewAppointment = (date?: string, patientId?: string) => {
    setSelectedAppointment(null);
    setAppointmentDefaultDate(date || hojeLocalISO());
    if (patientId) {
      setActivePatientId(patientId);
    }
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentDefaultDate(appointment.date);
    setIsAppointmentModalOpen(true);
  };

  // Profile handling
  const handleSaveProfile = (newProfile: ProfessionalProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
    showToast('Dados profissionais atualizados!');
  };

  // Export / Import local backup JSON
  const handleExportBackup = () => {
    const dataStr = exportBackupData();
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
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const ok = importBackupData(content);
        if (ok) {
          setPatients(loadPatients());
          setConsultations(loadConsultations());
          setAppointments(loadAppointments());
          setProfile(loadProfile());
          showToast('Backup restaurado com sucesso!');
        } else {
          showToast('Erro ao importar arquivo de backup.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl font-bold text-sm border border-emerald-600 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
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
          <div
            onClick={() => setIsProfileModalOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between"
          >
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">
                {profile.name}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">{profile.crn}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
