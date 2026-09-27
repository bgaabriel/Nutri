import React, { useState } from 'react';
import { ProfessionalProfile } from '../types/nutrition';
import { X, UserCheck } from 'lucide-react';

interface ModalPerfilProfissionalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfessionalProfile;
  onSave: (profile: ProfessionalProfile) => void;
}

export const ModalPerfilProfissional: React.FC<ModalPerfilProfissionalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState<ProfessionalProfile>({ ...profile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#161618] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Dados do Profissional (CRN)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome do Profissional
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Registro Profissional (CRN)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: CRN-3 45920"
              value={formData.registro}
              onChange={(e) => setFormData({ ...formData, registro: e.target.value })}
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Título / Especialidade
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome da Clínica / Consultório
            </label>
            <input
              type="text"
              value={formData.clinica}
              onChange={(e) => setFormData({ ...formData, clinica: e.target.value })}
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Telefone / Contato
            </label>
            <input
              type="text"
              value={formData.contato}
              onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Salvar Informações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
