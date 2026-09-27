import React, { useRef } from 'react';
import { Patient, ProfessionalProfile } from '../types/nutrition';
import { X, Download, Upload, Database, RefreshCw } from 'lucide-react';

interface ModalBackupProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  profile: ProfessionalProfile;
  onRestore: (patients: Patient[], profile?: ProfessionalProfile) => void;
  onResetToDemo: () => void;
}

export const ModalBackup: React.FC<ModalBackupProps> = ({
  isOpen,
  onClose,
  patients,
  profile,
  onRestore,
  onResetToDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      professional: profile,
      patients: patients,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nutripro_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.patients)) {
          onRestore(parsed.patients, parsed.professional);
          alert('Backup restaurado com sucesso!');
          onClose();
        } else if (Array.isArray(parsed)) {
          // Direct array of patients
          onRestore(parsed);
          alert('Backup de pacientes restaurado com sucesso!');
          onClose();
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#161618] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Banco de Dados Offline</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Seus dados são armazenados localmente e de forma segura no navegador. Você pode baixar uma cópia de segurança a qualquer momento ou transferir para outro computador.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 bg-[#1A1A1C] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Exportar Backup Completo (JSON)
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-[#1A1A1C] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              Importar / Restaurar Backup (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => {
                if (confirm('Deseja recarregar os dados de demonstração (incluindo João Silva e Beatriz)?')) {
                  onResetToDemo();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 py-2.5 px-4 rounded-xl text-xs font-medium transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Pacientes de Demonstração
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#111113] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
