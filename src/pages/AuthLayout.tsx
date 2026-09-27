import React from 'react';

/** Moldura das telas sem sessão (login, cadastro, nova senha), no visual do app. */
export const AuthLayout: React.FC<{ titulo: string; subtitulo?: string; children: React.ReactNode }> = ({
  titulo,
  subtitulo,
  children,
}) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs">
          N
        </div>
        <div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 block leading-tight">NutriPro</span>
          <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold block">
            Clínico & Consultório
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-7">
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">{titulo}</h1>
        {subtitulo && <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  </div>
);

export const classeCampo =
  'w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:border-emerald-600 outline-none transition-all';

export const classeRotulo = 'block text-xs font-semibold text-slate-700 mb-1';

export const classeBotaoPrincipal =
  'w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer';

export const Aviso: React.FC<{ tipo: 'erro' | 'ok'; children: React.ReactNode }> = ({ tipo, children }) => (
  <div
    role={tipo === 'erro' ? 'alert' : 'status'}
    className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
      tipo === 'erro' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
    }`}
  >
    {children}
  </div>
);
