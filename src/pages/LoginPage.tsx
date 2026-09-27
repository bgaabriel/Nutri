import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { apenasDigitos, cpfValido, mascararCPF, normalizarNumeroCRN, REGIOES_CRN } from '../utils/documentos';
import { AuthLayout, Aviso, classeBotaoPrincipal, classeCampo, classeRotulo } from './AuthLayout';

type Modo = 'email' | 'cpf' | 'crn';

// Mensagem única: não revela se o e-mail, CPF ou CRN existe
const CREDENCIAIS_INVALIDAS = 'Credenciais inválidas. Confira os dados e a senha.';

interface LoginPageProps {
  onCriarConta: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onCriarConta }) => {
  const [modo, setModo] = useState<Modo>('email');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [crnRegiao, setCrnRegiao] = useState('3');
  const [crnNumero, setCrnNumero] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Esqueci minha senha
  const [recuperando, setRecuperando] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [avisoRecuperacao, setAvisoRecuperacao] = useState<string | null>(null);

  const entrarPorIdentificador = async (corpo: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke<{ access_token: string; refresh_token: string }>(
      'login-identificador',
      { body: corpo }
    );
    if (error || !data?.access_token) throw new Error(CREDENCIAIS_INVALIDAS);
    const { error: erroSessao } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (erroSessao) throw new Error(CREDENCIAIS_INVALIDAS);
  };

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (modo === 'cpf' && !cpfValido(cpf)) {
      setErro('CPF inválido. Confira os números digitados.');
      return;
    }
    const numero = normalizarNumeroCRN(crnNumero);
    if (modo === 'crn' && !numero) {
      setErro('Informe o número do CRN.');
      return;
    }

    setEnviando(true);
    try {
      if (modo === 'email') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) {
          throw new Error(
            error.message.toLowerCase().includes('not confirmed')
              ? 'Confirme seu e-mail antes de entrar (veja o link que enviamos).'
              : CREDENCIAIS_INVALIDAS
          );
        }
      } else if (modo === 'cpf') {
        await entrarPorIdentificador({ tipo: 'cpf', cpf: apenasDigitos(cpf), senha });
      } else {
        await entrarPorIdentificador({ tipo: 'crn', crnRegiao: Number(crnRegiao), crnNumero: numero, senha });
      }
      // A troca de tela acontece pelo onAuthStateChange no App
    } catch (err) {
      setErro(err instanceof Error ? err.message : CREDENCIAIS_INVALIDAS);
    } finally {
      setEnviando(false);
    }
  };

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    await supabase.auth.resetPasswordForEmail(emailRecuperacao.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setEnviando(false);
    // Mesma resposta exista ou não a conta
    setAvisoRecuperacao(
      'Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira sua caixa de entrada.'
    );
  };

  if (recuperando) {
    return (
      <AuthLayout titulo="Esqueci minha senha" subtitulo="Informe o e-mail da sua conta para receber o link.">
        <form onSubmit={handleRecuperar} className="space-y-4">
          <div>
            <label htmlFor="recuperar-email" className={classeRotulo}>
              E-mail
            </label>
            <input
              id="recuperar-email"
              type="email"
              required
              autoComplete="email"
              value={emailRecuperacao}
              onChange={(e) => setEmailRecuperacao(e.target.value)}
              className={classeCampo}
            />
          </div>
          {avisoRecuperacao && <Aviso tipo="ok">{avisoRecuperacao}</Aviso>}
          <button type="submit" disabled={enviando} className={classeBotaoPrincipal}>
            Enviar link
          </button>
          <button
            type="button"
            onClick={() => {
              setRecuperando(false);
              setAvisoRecuperacao(null);
            }}
            className="w-full text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Voltar para o login
          </button>
        </form>
      </AuthLayout>
    );
  }

  const aba = (m: Modo, rotulo: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={modo === m}
      onClick={() => {
        setModo(m);
        setErro(null);
      }}
      className={`flex-1 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
        modo === m ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:bg-white/60'
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <AuthLayout titulo="Entrar" subtitulo="Acesse o consultório com e-mail, CPF ou CRN.">
      <div role="tablist" aria-label="Forma de login" className="flex bg-slate-200/70 p-1 rounded-xl mb-4">
        {aba('email', 'E-mail')}
        {aba('cpf', 'CPF')}
        {aba('crn', 'CRN')}
      </div>

      <form onSubmit={handleEntrar} className="space-y-4">
        {modo === 'email' && (
          <div>
            <label htmlFor="login-email" className={classeRotulo}>
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={classeCampo}
            />
          </div>
        )}

        {modo === 'cpf' && (
          <div>
            <label htmlFor="login-cpf" className={classeRotulo}>
              CPF
            </label>
            <input
              id="login-cpf"
              inputMode="numeric"
              required
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(mascararCPF(e.target.value))}
              className={classeCampo}
            />
          </div>
        )}

        {modo === 'crn' && (
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label htmlFor="login-crn-regiao" className={classeRotulo}>
                Região
              </label>
              <select
                id="login-crn-regiao"
                value={crnRegiao}
                onChange={(e) => setCrnRegiao(e.target.value)}
                className={classeCampo}
              >
                {REGIOES_CRN.map((r) => (
                  <option key={r} value={r}>
                    CRN-{r}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label htmlFor="login-crn-numero" className={classeRotulo}>
                Número do CRN
              </label>
              <input
                id="login-crn-numero"
                required
                placeholder="Ex: 45920 ou 12345/P"
                value={crnNumero}
                onChange={(e) => setCrnNumero(e.target.value.toUpperCase())}
                className={classeCampo}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="login-senha" className={classeRotulo}>
            Senha
          </label>
          <input
            id="login-senha"
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={classeCampo}
          />
        </div>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <button type="submit" disabled={enviando} className={classeBotaoPrincipal}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setRecuperando(true);
            setEmailRecuperacao(email);
          }}
          className="text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          Esqueci minha senha
        </button>
        <button type="button" onClick={onCriarConta} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
          Criar conta
        </button>
      </div>
    </AuthLayout>
  );
};
