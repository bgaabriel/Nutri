import { Anthropometry, Skinfolds, Sex, BodyFatProtocol, BMRFormula } from '../types/nutrition';

export interface CalculatedResults {
  imc: number;
  imcClass: string;
  pesoIdealMin: number;
  pesoIdealMax: number;
  rcq: number;
  rcqRisco: boolean;
  rce: number; // Relação Cintura-Estatura
  soma7Dobras: number;
  soma4Dobras: number;
  percGordura: number;
  massaGorda: number;
  massaMagra: number;
  tmbMifflin: number;
  tmbHarris: number;
  tmbFao: number;
  tmbKatch: number;
  tmbEscolhida: number;
  get: number;
  vet: number;
  macros: {
    proteinaKcal: number;
    proteinaPerc: number;
    carboKcal: number;
    carboPerc: number;
    gorduraKcal: number;
    gorduraPerc: number;
  };
}

export function calculateAllMetrics(
  antropo: Anthropometry,
  dobras: Skinfolds,
  idade: number,
  sexo: Sex,
  protocolo: BodyFatProtocol,
  formulaBmr: BMRFormula,
  fatorAtividade: number,
  ajusteKcal: number,
  protGPorKg: number = 2.0,
  carbGPorKg: number = 3.0,
  gordGPorKg: number = 0.8
): CalculatedResults {
  const peso = Math.max(0, antropo.peso || 0);
  const altura = Math.max(0, antropo.altura || 0);
  const alturaM = altura > 0 ? altura / 100 : 1;

  // 1. IMC
  const imc = alturaM > 0 && peso > 0 ? peso / (alturaM * alturaM) : 0;
  let imcClass = 'Eutrofia';
  if (imc < 18.5) imcClass = 'Baixo Peso';
  else if (imc >= 18.5 && imc < 24.9) imcClass = 'Eutrofia (Peso Normal)';
  else if (imc >= 25 && imc < 29.9) imcClass = 'Sobrepeso (Pré-obesidade)';
  else if (imc >= 30 && imc < 34.9) imcClass = 'Obesidade Grau I';
  else if (imc >= 35 && imc < 39.9) imcClass = 'Obesidade Grau II';
  else if (imc >= 40) imcClass = 'Obesidade Grau III (Grave)';

  const pesoIdealMin = 18.5 * (alturaM * alturaM);
  const pesoIdealMax = 24.9 * (alturaM * alturaM);

  // 2. Circunferências
  const cCintura = antropo.cCintura || 0;
  const cQuadril = antropo.cQuadril || 0;
  const cAbdomen = antropo.cAbdomen || 0;
  const cPescoco = antropo.cPescoco || 0;

  const rcq = cQuadril > 0 ? cCintura / cQuadril : 0;
  const rcqRisco = sexo === 'M' ? rcq > 0.90 : rcq > 0.85;
  const rce = altura > 0 ? cCintura / altura : 0;

  // 3. Dobras
  const soma7Dobras =
    (dobras.dTri || 0) +
    (dobras.dSub || 0) +
    (dobras.dPei || 0) +
    (dobras.dAxi || 0) +
    (dobras.dSup || 0) +
    (dobras.dAbd || 0) +
    (dobras.dCox || 0);

  const soma4Dobras =
    (dobras.dTri || 0) +
    (dobras.dSub || 0) +
    (dobras.dSup || 0) +
    (dobras.dAbd || 0);

  // 4. Protocolos de Gordura
  let percGordura = 0;

  if (protocolo === 'marinha') {
    // US Navy formula: uses abdomen, neck, height (and hip for females)
    if (sexo === 'M') {
      const diffCirc = Math.max(1, (cAbdomen || cCintura) - cPescoco);
      if (diffCirc > 0 && altura > 0) {
        const denom = 1.0324 - 0.19077 * Math.log10(diffCirc) + 0.15456 * Math.log10(altura);
        if (denom > 0) {
          percGordura = 495 / denom - 450;
        }
      }
    } else {
      const sumCirc = Math.max(1, (cAbdomen || cCintura) + cQuadril - cPescoco);
      if (sumCirc > 0 && altura > 0) {
        const denom = 1.29579 - 0.35004 * Math.log10(sumCirc) + 0.22100 * Math.log10(altura);
        if (denom > 0) {
          percGordura = 495 / denom - 450;
        }
      }
    }
  } else if (protocolo === 'faulkner') {
    // Faulkner: (soma 4 dobras * 0.153) + 5.783
    if (soma4Dobras > 0) {
      percGordura = soma4Dobras * 0.153 + 5.783;
    }
  } else if (protocolo === 'jp7') {
    // Jackson & Pollock 7 dobras
    if (soma7Dobras > 0) {
      const soma7Sq = soma7Dobras * soma7Dobras;
      let densidade = 1;
      if (sexo === 'M') {
        densidade = 1.112 - 0.00043499 * soma7Dobras + 0.00000055 * soma7Sq - 0.00028826 * idade;
      } else {
        densidade = 1.097 - 0.00046971 * soma7Dobras + 0.00000056 * soma7Sq - 0.00012828 * idade;
      }
      if (densidade > 0) {
        percGordura = (4.95 / densidade - 4.5) * 100;
      }
    }
  } else if (protocolo === 'jp3') {
    // Jackson & Pollock 3 dobras
    let soma3 = 0;
    let densidade = 1;
    if (sexo === 'M') {
      soma3 = (dobras.dPei || 0) + (dobras.dAbd || 0) + (dobras.dCox || 0);
      densidade = 1.10938 - 0.0008267 * soma3 + 0.0000016 * (soma3 * soma3) - 0.0002574 * idade;
    } else {
      soma3 = (dobras.dTri || 0) + (dobras.dSup || 0) + (dobras.dCox || 0);
      densidade = 1.0994921 - 0.0009929 * soma3 + 0.0000023 * (soma3 * soma3) - 0.0001392 * idade;
    }
    if (soma3 > 0 && densidade > 0) {
      percGordura = (4.95 / densidade - 4.5) * 100;
    }
  }

  // Sanitize
  if (isNaN(percGordura) || percGordura < 3) percGordura = percGordura < 0 ? 0 : percGordura;
  if (percGordura > 60) percGordura = 60;

  const massaGorda = peso * (percGordura / 100);
  const massaMagra = Math.max(0, peso - massaGorda);

  // 5. Gasto Energético (TMB)
  // Mifflin-St Jeor
  const tmbMifflin =
    peso > 0 && altura > 0 && idade > 0
      ? 10 * peso + 6.25 * altura - 5 * idade + (sexo === 'M' ? 5 : -161)
      : 0;

  // Harris-Benedict
  let tmbHarris = 0;
  if (peso > 0 && altura > 0 && idade > 0) {
    tmbHarris =
      sexo === 'M'
        ? 66.5 + 13.75 * peso + 5.0 * altura - 6.75 * idade
        : 655.1 + 9.56 * peso + 1.85 * altura - 4.68 * idade;
  }

  // FAO/WHO/UNU
  let tmbFao = 0;
  if (peso > 0 && idade > 0) {
    if (sexo === 'M') {
      if (idade < 18) tmbFao = 17.5 * peso + 651;
      else if (idade <= 30) tmbFao = 15.3 * peso + 679;
      else if (idade <= 60) tmbFao = 11.6 * peso + 879;
      else tmbFao = 13.5 * peso + 487;
    } else {
      if (idade < 18) tmbFao = 12.2 * peso + 746;
      else if (idade <= 30) tmbFao = 14.7 * peso + 496;
      else if (idade <= 60) tmbFao = 8.7 * peso + 829;
      else tmbFao = 10.5 * peso + 596;
    }
  }

  // Katch-McArdle (baseada em Massa Magra)
  const tmbKatch = massaMagra > 0 ? 370 + 21.6 * massaMagra : tmbMifflin;

  let tmbEscolhida = tmbMifflin;
  if (formulaBmr === 'harris') tmbEscolhida = tmbHarris;
  else if (formulaBmr === 'fao') tmbEscolhida = tmbFao;
  else if (formulaBmr === 'katch') tmbEscolhida = tmbKatch;

  const get = tmbEscolhida * Math.max(1, fatorAtividade || 1);
  const vet = Math.max(800, get + (ajusteKcal || 0));

  // Macronutrientes baseados em g/kg
  const proteinaKcal = peso * protGPorKg * 4;
  const carboKcal = peso * carbGPorKg * 4;
  const gorduraKcal = peso * gordGPorKg * 9;
  const totalMacroKcal = proteinaKcal + carboKcal + gorduraKcal || 1;

  return {
    imc,
    imcClass,
    pesoIdealMin,
    pesoIdealMax,
    rcq,
    rcqRisco,
    rce,
    soma7Dobras,
    soma4Dobras,
    percGordura,
    massaGorda,
    massaMagra,
    tmbMifflin,
    tmbHarris,
    tmbFao,
    tmbKatch,
    tmbEscolhida,
    get,
    vet,
    macros: {
      proteinaKcal,
      proteinaPerc: (proteinaKcal / totalMacroKcal) * 100,
      carboKcal,
      carboPerc: (carboKcal / totalMacroKcal) * 100,
      gorduraKcal,
      gorduraPerc: (gorduraKcal / totalMacroKcal) * 100,
    },
  };
}
