import React, { useState } from 'react';
import { Patient, Sex } from '../types/nutrition';
import { X, UserPlus } from 'lucide-react';

interface ModalNovoPacienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

export const ModalNovoPaciente: React.FC<ModalNovoPacienteProps> = ({ isOpen, onClose, onSave }) => {
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState(30);
  const [sexo, setSexo] = useState<Sex>('M');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [profissao, setProfissao] = useState('');
  const [objetivo, setObjetivo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const novoPaciente: Patient = {
      id: 'p-' + Date.now(),
      nome: nome.trim(),
      idade: Number(idade) || 25,
      sexo,
      telefone: telefone.trim(),
      email: email.trim(),
      profissao: profissao.trim(),
      objetivoPrincipal: objetivo.trim() || 'Avaliação nutricional e saúde',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      historico: [],
    };

    if (onSave) {
      onSave(novoPaciente);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#161618] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Cadastrar Novo Paciente</h2>
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
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Idade (Anos)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={idade}
                onChange={(e) => setIdade(Number(e.target.value))}
                className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Sexo Biológico
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as Sex)}
                className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@email.com"
                className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Profissão / Ocupação
            </label>
            <input
              type="text"
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
              placeholder="Ex: Engenheiro, Professor, Estudante"
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Objetivo Principal
            </label>
            <input
              type="text"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ex: Emagrecimento, Hipertrofia, Longevidade"
              className="w-full bg-[#1A1A1C] border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              Cadastrar e Iniciar Prontuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
