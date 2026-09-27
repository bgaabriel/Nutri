// Teste do front (fase E) com o Supabase SIMULADO em memória
// ------------------------------------------------------------------
// Intercepta as chamadas ao Supabase (Auth, REST e a função login-identificador)
// e confere, sem tocar no banco de verdade: login por e-mail/CPF/CRN, Sair,
// cadastro de paciente, salvar consulta, agendar, impressão com a conta logada,
// perfil só-leitura e a importação de um backup da versão antiga.
//
//   npm run build && npx vite preview --port 4173   (em outro terminal)
//   node docs/teste-supabase-simulado.mjs
// Variáveis opcionais: BASE_URL (padrão http://localhost:4173), CHROMIUM_PATH,
//   OUT (pasta para salvar capturas de tela).
// ------------------------------------------------------------------
import { chromium } from 'playwright';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const SUPA = (process.env.VITE_SUPABASE_URL || 'https://fdqflqazohspcxbredus.supabase.co').replace(/\/$/, '');
const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
const uid = 'aaaaaaaa-0000-4000-8000-000000000001';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: uid, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, email: 'nutri@teste.com' }) + '.assinaturafalsa';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'nutri@teste.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const sessao = { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r1', user };

const db = {
  profissionais: [{ id: uid, nome: 'Dra. Teste Silva', email: 'nutri@teste.com', cpf: '52998224725', crn_regiao: 3, crn_numero: '45920', clinica: 'Clínica Teste', telefone: '(11) 90000-0000', endereco_rodape: null }],
  pacientes: [], consultas: [], agendamentos: [], alimentos_taco: [],
};
let seq = 1;
const novoId = () => `bbbbbbbb-0000-4000-8000-${String(seq++).padStart(12, '0')}`;
const log = [];

async function rotaSupabase(route) {
  const req = route.request();
  const url = new URL(req.url());
  const metodo = req.method();
  const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  if (url.pathname.startsWith('/auth/v1/token')) {
    const corpo = JSON.parse(req.postData() || '{}');
    if (corpo.password !== 'senha-correta') return json({ error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' }, 400);
    return json(sessao);
  }
  if (url.pathname === '/auth/v1/user') return json(user);
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
  if (url.pathname.startsWith('/functions/v1/login-identificador')) {
    const corpo = JSON.parse(req.postData() || '{}');
    log.push('funcao ' + JSON.stringify(corpo));
    const ok = corpo.senha === 'senha-correta' && ((corpo.tipo === 'cpf' && corpo.cpf === '52998224725') || (corpo.tipo === 'crn' && corpo.crnRegiao === 3 && corpo.crnNumero === '45920'));
    return ok ? json({ access_token: jwt, refresh_token: 'r1' }) : json({ error: 'Credenciais inválidas' }, 401);
  }
  const m = /^\/rest\/v1\/(\w+)/.exec(url.pathname);
  if (!m) return json({ message: 'rota não simulada ' + url.pathname }, 404);
  const tabela = db[m[1]];
  const umObjeto = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
  const filtroId = url.searchParams.get('id')?.replace('eq.', '');
  const comJoin = (l) => (m[1] === 'agendamentos' ? { ...l, pacientes: { nome: db.pacientes.find((p) => p.id === l.paciente_id)?.nome } } : l);
  let linhas;
  if (metodo === 'GET') linhas = tabela.filter((l) => !filtroId || l.id === filtroId);
  else if (metodo === 'POST') {
    const corpo = JSON.parse(req.postData());
    const lista = Array.isArray(corpo) ? corpo : [corpo];
    linhas = lista.map((c) => ({ id: novoId(), profissional_id: uid, created_at: new Date().toISOString(), ...c }));
    tabela.push(...linhas);
    log.push(`POST ${m[1]} ${JSON.stringify(corpo).slice(0, 160)}`);
  } else if (metodo === 'PATCH') {
    const corpo = JSON.parse(req.postData());
    linhas = tabela.filter((l) => l.id === filtroId);
    linhas.forEach((l) => Object.assign(l, corpo));
    log.push(`PATCH ${m[1]} ${JSON.stringify(corpo).slice(0, 120)}`);
  } else if (metodo === 'DELETE') {
    linhas = tabela.filter((l) => l.id === filtroId);
    db[m[1]] = tabela.filter((l) => l.id !== filtroId);
    log.push(`DELETE ${m[1]}`);
  }
  linhas = linhas.map(comJoin);
  if (umObjeto) return linhas.length ? json(linhas[0]) : json({ message: 'nenhuma linha', code: 'PGRST116' }, 406);
  return json(linhas);
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route(SUPA + '/**', rotaSupabase);
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
await page.addInitScript(() => { window.print = () => {}; });
const OUT = process.env.OUT;
const passo = (t) => console.log('•', t);

await page.goto(BASE_URL);
await page.getByLabel('E-mail').fill('nutri@teste.com');
await page.getByLabel('Senha').fill('errada');
await page.getByRole('button', { name: 'Entrar' }).click();
passo('senha errada: ' + (await page.getByRole('alert').innerText()));
if (OUT) await page.screenshot({ path: OUT + '/e-login.png' });

// CPF: validação antes de enviar
await page.getByRole('tab', { name: 'CPF' }).click();
await page.getByLabel('CPF').fill('12345678900');
passo('máscara: ' + (await page.getByLabel('CPF').inputValue()));
await page.getByLabel('Senha').fill('senha-correta');
await page.getByRole('button', { name: 'Entrar' }).click();
passo('CPF inválido: ' + (await page.getByRole('alert').innerText()));
await page.getByLabel('CPF').fill('52998224725');
await page.getByRole('button', { name: 'Entrar' }).click();
await page.getByText('Olá, Dra. Teste Silva!').waitFor({ timeout: 10000 });
passo('login por CPF ok -> ' + log.filter((l) => l.startsWith('funcao')).at(-1));

// Sair e entrar por CRN
await page.getByRole('button', { name: 'Sair' }).click();
await page.getByRole('tab', { name: 'CRN' }).click();
await page.getByLabel('Região').selectOption('3');
await page.getByLabel('Número do CRN').fill('45920');
await page.getByLabel('Senha').fill('senha-correta');
await page.getByRole('button', { name: 'Entrar' }).click();
await page.getByText('Olá, Dra. Teste Silva!').waitFor();
passo('sair + login por CRN ok -> ' + log.filter((l) => l.startsWith('funcao')).at(-1));
if (OUT) await page.screenshot({ path: OUT + '/e-panorama-vazio.png' });

// Cadastrar paciente, salvar consulta, agendar
await page.getByRole('button', { name: /^Pacientes/ }).first().click();
await page.getByRole('button', { name: 'Cadastrar Novo Paciente' }).click();
await page.getByPlaceholder('Nome do paciente').fill('Maria Teste');
await page.getByRole('button', { name: /Salvar e Abrir/ }).click();
await page.getByText('Prontuário de Maria Teste').waitFor();
await page.getByLabel('Profissão / Trabalho').fill('Professora');
await page.getByRole('button', { name: 'Salvar Consulta' }).click();
await page.getByText(/Consulta salva com sucesso/).waitFor();
passo('paciente e consulta: ' + log.filter((l) => l.startsWith('POST')).map((l) => l.slice(0, 60)).join(' || '));
const consulta = db.consultas[0];
passo(`consulta gravada: data=${consulta.data} anamnese.occupation=${consulta.anamnese.occupation} calculado.vet=${Math.round(consulta.calculado.vet)}`);

await page.getByRole('button', { name: /Panorama/ }).first().click();
await page.getByRole('button', { name: 'Agendar', exact: true }).first().click();
await page.getByRole('button', { name: /Salvar|Agendar Consulta|Confirmar/ }).last().click();
await page.waitForTimeout(500);
passo('agendamento: ' + JSON.stringify(db.agendamentos[0] && { data: db.agendamentos[0].data, hora: db.agendamentos[0].hora, paciente: db.agendamentos[0].paciente_id === db.pacientes[0].id }));
passo('agenda mostra: ' + (await page.getByText('Maria Teste').count()) + ' cartão(ões) com a paciente');

// Impressão com a conta logada (mesma checagem do docs/teste-impressao.mjs)
await page.getByRole('button', { name: /^Pacientes/ }).first().click();
await page.getByRole('button', { name: /Prontuário/ }).first().click();
for (const [nome, abrir] of [
  ['Cardápio', () => page.getByRole('button', { name: 'Imprimir Cardápio' }).first().click()],
  ['Relatório', () => page.getByRole('button', { name: 'Imprimir Relatório' }).first().click()],
  ['Evolução', () => page.getByRole('button', { name: /PDF de Toda a Evolução/ }).first().click()],
]) {
  await abrir(); await page.waitForTimeout(500);
  const pdf = await getDocument({ data: new Uint8Array(await page.pdf({ format: 'A4', printBackground: true })) }).promise;
  const t = (await (await pdf.getPage(1)).getTextContent()).items.map((i) => i.str).join(' ');
  const ok = t.includes('Maria Teste') && t.includes('Clínica Teste') && !t.includes('Trocar Paciente') && !t.includes('Salvar Consulta');
  passo(`impressão ${nome}: ${ok ? 'ok' : 'FALHOU'} (${pdf.numPages} pág.)`);
}

// Perfil: CPF/CRN/e-mail só leitura; relatório do consultório
await page.getByTitle('Perfil, relatórios e backup').click();
passo('perfil: ' + (await page.getByText('529.982.247-25').count() ? 'CPF mascarado visível' : 'CPF ausente') + ', inputs de e-mail no modal=' + (await page.locator('form input[type=email]').count()));
if (OUT) await page.screenshot({ path: OUT + '/e-perfil.png' });

// Restaurar backup antigo (formato localStorage)
const backupAntigo = JSON.stringify({ version: '1.1', patients: [{ id: 'p1', name: 'João Antigo', age: 30, sex: 'M', objective: 'Hipertrofia', createdAt: '2026-01-10' }],
  consultations: [{ id: 'cons1', patientId: 'p1', date: '10/01/2026', title: 'Inicial', anamnesis: {}, anthropometry: { weight: 90, height: 175, circumferences: {}, skinfolds: {}, fatProtocol: 'marinha' }, prescription: { bmrFormula: 'mifflin', activityFactor: 1.5, targetKcalAdjustment: 0, proteinGKg: 2, carbGKg: 3, fatGKg: 1 },
    mealPlan: { id: 'mp', titulo: 'x', dataCriacao: '10/01/2026', metaAguaMl: 2000, refeicoes: [{ id: 'm1', nome: 'Almoço', horario: '12:00', alimentos: [{ id: 'i1', tacoId: 'taco-14', nome: 'Frango', grupo: 'x', quantidadeG: 100, medidaCaseira: '', kcal: 1, prot: 1, carb: 0, lip: 0, fibra: 0, sodio: 0, calcio: 0, ferro: 0, potassio: 0, magnesio: 0, vitc: 0 }] }] } }],
  appointments: [{ id: 'a1', patientId: 'p1', patientName: 'João Antigo', date: '2026-10-01', time: '09:00', durationMinutes: 60, type: 'retorno', status: 'agendado', modality: 'presencial' }, { id: 'a2', patientId: 'p9', patientName: 'Sem cadastro', date: '2026-10-02', time: '10:00', durationMinutes: 60, type: 'retorno', status: 'agendado', modality: 'presencial' }] });
await page.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backupAntigo) });
await page.getByText(/importados/).waitFor();
passo('importação: ' + (await page.getByText(/importados/).innerText()));
const importada = db.consultas.find((c) => c.titulo === 'Inicial');
passo(`consulta importada: data=${importada.data} paciente novo=${importada.paciente_id !== 'p1'} tacoId=${importada.cardapio.refeicoes[0].alimentos[0].tacoId}`);

console.log('erros de página:', JSON.stringify(erros));
await browser.close();
process.exit(erros.length ? 1 : 0);
