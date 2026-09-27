import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const FA_MIN = 1.0;
export const FA_MAX = 2.0;
const PASSO = 0.1;

/** Trava o fator entre 1,00 e 2,00 e arredonda para 2 casas (evita 1.8500000001). */
export function ajustarFatorAtividade(valor: number): number {
  const travado = Math.min(FA_MAX, Math.max(FA_MIN, valor));
  return Math.round(travado * 100) / 100;
}

export function legendaFatorAtividade(valor: number): string {
  if (valor < 1.4) return 'Sedentário';
  if (valor < 1.6) return 'Levemente ativo';
  if (valor < 1.8) return 'Moderadamente ativo';
  if (valor < 2.0) return 'Muito ativo';
  return 'Extremamente ativo';
}

interface ActivityFactorStepperProps {
  id?: string;
  value: number;
  onChange: (valor: number) => void;
}

export const ActivityFactorStepper: React.FC<ActivityFactorStepperProps> = ({ id, value, onChange }) => {
  // Texto livre só enquanto o campo está em edição; fora disso mostra o valor com 2 casas
  const [texto, setTexto] = useState(value.toFixed(2));
  const [editando, setEditando] = useState(false);

  // Valor mais recente, para a repetição ao segurar a seta
  const valorRef = useRef(value);
  valorRef.current = value;
  const timeoutRef = useRef<number | undefined>(undefined);
  const intervaloRef = useRef<number | undefined>(undefined);

  const parar = () => {
    window.clearTimeout(timeoutRef.current);
    window.clearInterval(intervaloRef.current);
  };
  useEffect(() => parar, []);

  const passo = (direcao: 1 | -1) => {
    const novo = ajustarFatorAtividade(valorRef.current + direcao * PASSO);
    valorRef.current = novo;
    onChange(novo);
  };

  // Pressionar e manter repete o passo
  const iniciar = (direcao: 1 | -1) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    parar();
    passo(direcao);
    timeoutRef.current = window.setTimeout(() => {
      intervaloRef.current = window.setInterval(() => passo(direcao), 100);
    }, 400);
  };

  // Clique pelo teclado (Enter/Espaço) chega com detail 0; o do mouse já foi tratado no pointerdown
  const cliqueTeclado = (direcao: 1 | -1) => (e: React.MouseEvent) => {
    if (e.detail === 0) passo(direcao);
  };

  const lerTexto = (t: string) => parseFloat(t.replace(',', '.'));

  const handleTexto = (t: string) => {
    setTexto(t);
    const n = lerTexto(t);
    // Valores dentro da faixa entram na hora; fora da faixa são ajustados ao sair do campo
    if (!isNaN(n) && n >= FA_MIN && n <= FA_MAX) onChange(Math.round(n * 100) / 100);
  };

  const handleBlur = () => {
    setEditando(false);
    const n = lerTexto(texto);
    const final = isNaN(n) ? value : ajustarFatorAtividade(n);
    onChange(final);
  };

  const botao =
    'p-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none touch-none';

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir fator de atividade"
          disabled={value <= FA_MIN}
          onPointerDown={iniciar(-1)}
          onPointerUp={parar}
          onPointerLeave={parar}
          onPointerCancel={parar}
          onClick={cliqueTeclado(-1)}
          className={botao}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={editando ? texto : value.toFixed(2)}
          onFocus={() => {
            setTexto(value.toFixed(2));
            setEditando(true);
          }}
          onChange={(e) => handleTexto(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className="w-20 text-center bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-slate-900 text-sm font-mono font-bold focus:bg-white focus:border-emerald-600 outline-none transition-all"
        />
        <button
          type="button"
          aria-label="Aumentar fator de atividade"
          disabled={value >= FA_MAX}
          onPointerDown={iniciar(1)}
          onPointerUp={parar}
          onPointerLeave={parar}
          onPointerCancel={parar}
          onClick={cliqueTeclado(1)}
          className={botao}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[11px] text-emerald-700 font-semibold mt-1.5">{legendaFatorAtividade(value)}</p>
    </div>
  );
};
