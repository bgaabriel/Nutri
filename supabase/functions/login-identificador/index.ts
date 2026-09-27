// Supabase Edge Function: login-identificador
// ------------------------------------------------------------------
// Permite login com CPF + senha ou CRN (região + número) + senha.
// O Supabase Auth só autentica por e-mail, então esta função:
//   1. localiza o e-mail do profissional pelo CPF ou CRN (com service role,
//      sem expor e-mails para o navegador);
//   2. faz signInWithPassword com esse e-mail e a senha informada;
//   3. devolve access_token + refresh_token para o front chamar
//      supabase.auth.setSession(...).
// Login por e-mail NÃO passa por aqui: o front chama signInWithPassword direto.
//
// Deploy:  supabase functions deploy login-identificador --no-verify-jwt
// (precisa ser pública, pois é chamada antes de existir sessão)
// ------------------------------------------------------------------
import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS: em produção, defina o segredo APP_ORIGINS com o(s) domínio(s) do app, separados por
// vírgula (ex.: "https://app.nutripro.com.br,http://localhost:3000"). Sem ele, aceita qualquer
// origem (útil só em desenvolvimento).
const origensPermitidas = (Deno.env.get('APP_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/** Cabeçalhos CORS de cada requisição (calculados por requisição, sem estado compartilhado). */
function corsPara(req: Request): Record<string, string> {
  const origem = req.headers.get('origin') ?? '';
  const permitida =
    origensPermitidas.length === 0 ? '*' : origensPermitidas.includes(origem) ? origem : origensPermitidas[0];
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Mensagem única para qualquer falha: não revela se o CPF/CRN existe.
const FALHA = { error: 'Credenciais inválidas. Confira os dados e a senha.' };

const apenasDigitos = (v: string) => v.replace(/\D/g, '');

type Corpo = {
  tipo?: 'cpf' | 'crn';
  cpf?: string;
  crnRegiao?: number | string;
  crnNumero?: string;
  senha?: string;
};

Deno.serve(async (req) => {
  const corsHeaders = corsPara(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  let corpo: Corpo;
  try {
    corpo = await req.json();
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }

  const senha = corpo.senha ?? '';
  if (!senha || senha.length > 200) return json(FALHA, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let consulta = admin.from('profissionais').select('email').limit(1);

  if (corpo.tipo === 'cpf') {
    const cpf = apenasDigitos(corpo.cpf ?? '');
    if (cpf.length !== 11) return json(FALHA, 401);
    consulta = consulta.eq('cpf', cpf);
  } else if (corpo.tipo === 'crn') {
    const regiao = Number(corpo.crnRegiao);
    const numero = (corpo.crnNumero ?? '').toUpperCase().replace(/[^0-9/P]/g, '');
    if (!Number.isInteger(regiao) || regiao < 1 || regiao > 11 || !numero) {
      return json(FALHA, 401);
    }
    consulta = consulta.eq('crn_regiao', regiao).eq('crn_numero', numero);
  } else {
    return json({ error: 'Tipo de login inválido' }, 400);
  }

  const { data: prof, error: erroBusca } = await consulta.maybeSingle();
  if (erroBusca || !prof?.email) {
    // pequeno atraso para não diferenciar "não existe" de "senha errada" pelo tempo
    await new Promise((r) => setTimeout(r, 400));
    return json(FALHA, 401);
  }

  const publico = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await publico.auth.signInWithPassword({
    email: prof.email,
    password: senha,
  });
  if (error || !data.session) return json(FALHA, 401);

  return json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});
