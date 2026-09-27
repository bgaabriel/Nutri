import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  apenasDigitos,
  cpfValido,
  mascararCPF,
  normalizarNumeroCRN,
  numeroCRNValido,
  REGIOES_CRN,
} from '../utils/documentos';
import { AuthLayout, Aviso, classeBotaoPrincipal, classeCampo, classeRotulo } from './AuthLayout';

const SENHA_MINIMA = 8;

interface SignUpPageProps {
  onVoltar: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onVoltar }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [crnRegiao, setCrnRegiao] = useState('3');
  const [crnNumero, setCrnNumero] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const numero = normalizarNumeroCRN(crnNumero);

    if (nome.trim().length < 3) return setErro('Informe o nome completo.');
    if (!cpfValido(cpf)) return setErro('CPF inválido. Confira os números digitados.');
    if (!numeroCRNValido(numero)) return setErro('Número do CRN inválido (ex.: 45920 ou 12345/P).');
    if (senha.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (senha !== confirmacao) return setErro('A confirmação não é igual à senha.');

    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: window.location.origin,
        // O gatilho do banco cria o perfil em profissionais com estes dados
        data: { nome: nome.trim(), cpf: apenasDigitos(cpf), crn_regiao: Number(crnRegiao), crn_numero: numero },
      },
    });
    setEnviando(false);

    if (error) {
      setErro(
        error.message.toLowerCase().includes('database')
          ? 'Não foi possível criar a conta. Verifique se o CPF ou o CRN já estão cadastrados.'
          : error.message.toLowerCase().includes('registered')
          ? 'Não foi possível criar a conta. Verifique se o e-mail já está cadastrado.'
          : 'Não foi possível criar a conta. Confira os dados e tente de novo.'
      );
      return;
    }
    // Com confirmação de e-mail ativa, o Supabase não devolve sessão: é preciso clicar no link
    if (!data.session) setConcluido(true);
  };

  if (concluido) {
    return (
      <AuthLayout titulo="Conta criada">
        <div className="space-y-4">
          <Aviso tipo="ok">
            Enviamos um link de confirmação para {email.trim()}. Abra o e-mail, confirme a conta e depois entre com
            e-mail, CPF ou CRN.
          </Aviso>
          <button type="button" onClick={onVoltar} className={classeBotaoPrincipal}>
            Ir para o login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout titulo="Criar conta" subtitulo="Cadastro do nutricionista responsável pelo consultório.">
      <form onSubmit={handleCriar} className="space-y-4">
        <div>
          <label htmlFor="cadastro-nome" className={classeRotulo}>
            Nome completo
          </label>
          <input
            id="cadastro-nome"
            required
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div>
          <label htmlFor="cadastro-email" className={classeRotulo}>
            E-mail
          </label>
          <input
            id="cadastro-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div>
          <label htmlFor="cadastro-cpf" className={classeRotulo}>
            CPF
          </label>
          <input
            id="cadastro-cpf"
            inputMode="numeric"
            required
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(mascararCPF(e.target.value))}
            className={classeCampo}
          />
        </div>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2">
            <label htmlFor="cadastro-crn-regiao" className={classeRotulo}>
              Região do CRN
            </label>
            <select
              id="cadastro-crn-regiao"
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
            <label htmlFor="cadastro-crn-numero" className={classeRotulo}>
              Número do CRN
            </label>
            <input
              id="cadastro-crn-numero"
              required
              placeholder="Ex: 45920 ou 12345/P"
              value={crnNumero}
              onChange={(e) => setCrnNumero(e.target.value.toUpperCase())}
              className={classeCampo}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cadastro-senha" className={classeRotulo}>
              Senha
            </label>
            <input
              id="cadastro-senha"
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
            <label htmlFor="cadastro-confirmacao" className={classeRotulo}>
              Confirmar senha
            </label>
            <input
              id="cadastro-confirmacao"
              type="password"
              required
              minLength={SENHA_MINIMA}
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className={classeCampo}
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-500">Mínimo de {SENHA_MINIMA} caracteres.</p>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <button type="submit" disabled={enviando} className={classeBotaoPrincipal}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
        <button
          type="button"
          onClick={onVoltar}
          className="w-full text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
        >
          Já tenho conta: entrar
        </button>
      </form>
    </AuthLayout>
  );
};
