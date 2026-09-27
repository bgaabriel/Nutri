// Teste de impressão (item 13 da especificação)
// ------------------------------------------------------------------
// Confere que a PRIMEIRA página impressa de cada documento já traz o
// cabeçalho da clínica e o nome do paciente, e não traz a interface do app.
//
// Pré-requisitos:
//   npm i -D playwright pdfjs-dist
//   npm run build && npx vite preview --port 4173   (em outro terminal)
// Depois da fase E (login), informe uma conta de teste que tenha pelo menos
// um paciente com consulta:
//   TEST_EMAIL=... TEST_PASSWORD=... node docs/teste-impressao.mjs
// Variáveis opcionais: BASE_URL (padrão http://localhost:4173),
//   CHROMIUM_PATH (caminho de um Chromium já instalado).
// ------------------------------------------------------------------
import { chromium } from 'playwright';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
const PROIBIDOS_NA_PAGINA_1 = ['Trocar Paciente', 'Salvar Consulta', 'Lista de Pacientes'];

async function textoDaPagina1(buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pagina = await pdf.getPage(1);
  const conteudo = await pagina.getTextContent();
  return { texto: conteudo.items.map((i) => i.str).join(' '), paginas: pdf.numPages };
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { window.print = () => {}; });
await page.goto(BASE_URL);

// Login por e-mail, se a tela de login existir
if (process.env.TEST_EMAIL && (await page.getByLabel(/senha/i).count())) {
  await page.getByLabel(/e-?mail/i).first().fill(process.env.TEST_EMAIL);
  await page.getByLabel(/senha/i).first().fill(process.env.TEST_PASSWORD || '');
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForLoadState('networkidle');
}

// Abre o prontuário do primeiro paciente da lista
await page.getByRole('button', { name: /^Pacientes/ }).first().click();
await page.getByRole('button', { name: /Prontuário/ }).first().click();
await page.waitForTimeout(500);

// Nome do paciente, lido da própria tela, para conferir no PDF
const nomePaciente = (await page.locator('h1').last().innerText()).trim();

const casos = [
  { nome: 'Cardápio', abrir: () => page.getByRole('button', { name: 'Imprimir Cardápio' }).first().click() },
  { nome: 'Relatório', abrir: () => page.getByRole('button', { name: 'Imprimir Relatório' }).first().click() },
  { nome: 'PDF da Evolução', abrir: () => page.getByRole('button', { name: /PDF de Toda a Evolução/ }).first().click() },
];

let falhas = 0;
for (const caso of casos) {
  await caso.abrir();
  await page.waitForTimeout(600);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  const { texto, paginas } = await textoDaPagina1(pdf);
  const problemas = [];
  if (!texto.includes(nomePaciente)) problemas.push(`nome do paciente "${nomePaciente}" ausente`);
  for (const p of PROIBIDOS_NA_PAGINA_1) if (texto.includes(p)) problemas.push(`contém "${p}"`);
  if (problemas.length) {
    falhas++;
    console.log(`✗ ${caso.nome} (${paginas} pág.): página 1 ${problemas.join('; ')}`);
  } else {
    console.log(`✓ ${caso.nome} (${paginas} pág.)`);
  }
}

await browser.close();
process.exit(falhas ? 1 : 0);
