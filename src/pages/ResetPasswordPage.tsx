import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthLayout, Aviso, classeBotaoPrincipal, classeCampo, classeRotulo } from './AuthLayout';

const SENHA_MINIMA = 8;

/** Tela aberta pelo link de "Esqueci minha senha" (/redefinir-senha). */
export const ResetPasswordPage: React.FC<{ onConcluir: () => void }> = ({ onConcluir }) => {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (senha.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (senha !== confirmacao) return setErro('A confirmação não é igual à senha.');
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) {
      setErro('Não foi possível trocar a senha. Peça um novo link em "Esqueci minha senha".');
      return;
    }
    onConcluir();
  };

  return (
    <AuthLayout titulo="Nova senha" subtitulo="Escolha a nova senha de acesso ao consultório.">
      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label htmlFor="nova-senha" className={classeRotulo}>
            Nova senha
          </label>
          <input
            id="nova-senha"
            type="password"
            required
            minLength={SENHA_MINIMA}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div>
          <label htmlFor="nova-senha-confirmacao" className={classeRotulo}>
            Confirmar nova senha
          </label>
          <input
            id="nova-senha-confirmacao"
            type="password"
            required
            minLength={SENHA_MINIMA}
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            className={classeCampo}
          />
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <button type="submit" disabled={enviando} className={classeBotaoPrincipal}>
          Salvar nova senha
        </button>
      </form>
    </AuthLayout>
  );
};
