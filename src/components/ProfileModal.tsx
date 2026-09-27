import React, { useEffect, useState } from 'react';
import { ProfessionalProfile } from '../types';
import { Award, BarChart3, Download, Upload, X } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfessionalProfile;
  onSave: (profile: ProfessionalProfile) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onOpenConsultorioReport: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onExportBackup,
  onImportBackup,
  onOpenConsultorioReport,
}) => {
  const [formData, setFormData] = useState<ProfessionalProfile>({ ...profile });

  // O modal fica montado: recarrega o formulário com o perfil atual a cada abertura
  useEffect(() => {
    if (isOpen) setFormData({ ...profile });
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Identificação do Profissional</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Profissional
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registro Profissional (CRN / UF)
            </label>
            <input
              type="text"
              required
              value={formData.crn}
              onChange={(e) => setFormData({ ...formData, crn: e.target.value })}
              placeholder="Ex: CRN-3 45920"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Clínica / Consultório
            </label>
            <input
              type="text"
              value={formData.clinic}
              onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
              placeholder="Ex: Consultório de Nutrição Clínica & Esportiva"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Endereço do Consultório / Observação de Rodapé
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Av. Paulista, 1000, Sala 402 - São Paulo / SP"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          {/* Relatórios do consultório */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-1">Relatórios do consultório</h4>
            <p className="text-[11px] text-slate-500 mb-2">
              Totais de pacientes e prontuários, pacientes em acompanhamento e consultas por mês.
            </p>
            <button
              type="button"
              onClick={onOpenConsultorioReport}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Ver relatório do consultório</span>
            </button>
          </div>

          {/* Backup */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-1">Backup</h4>
            <p className="text-[11px] text-slate-500 mb-2">
              Exporte uma cópia dos seus pacientes, consultas e agendamentos em JSON ou restaure a
              partir de um arquivo exportado antes.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar backup (JSON)</span>
              </button>
              <button
                type="button"
                onClick={onImportBackup}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar backup</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
