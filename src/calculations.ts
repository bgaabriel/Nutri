import { Anthropometry, CalculatedMetrics, EnergyPrescription, Sex } from './types';

export function calculateAllMetrics(
  age: number,
  sex: Sex,
  anthropometry: Anthropometry,
  prescription: EnergyPrescription
): CalculatedMetrics {
  const { weight, height, circumferences, skinfolds, fatProtocol } = anthropometry;
  const heightM = height > 0 ? height / 100 : 1;

  // 1. IMC
  const imc = heightM > 0 && weight > 0 ? weight / (heightM * heightM) : 0;
  let imcClassification = 'Normal';
  if (imc < 18.5) {
    imcClassification = 'Baixo Peso';
  } else if (imc < 25) {
    imcClassification = 'Eutrofia (Normal)';
  } else if (imc < 30) {
    imcClassification = 'Sobrepeso';
  } else if (imc < 35) {
    imcClassification = 'Obesidade Grau I';
  } else if (imc < 40) {
    imcClassification = 'Obesidade Grau II';
  } else {
    imcClassification = 'Obesidade Grau III (Mórbida)';
  }

  // 2. RCQ (Relação Cintura / Quadril)
  let rcq = 0;
  let rcqRisk = false;
  let rcqText = 'Normal';
  if (circumferences.waist > 0 && circumferences.hip > 0) {
    rcq = circumferences.waist / circumferences.hip;
    if (sex === 'M') {
      rcqRisk = rcq > 0.90;
      rcqText = rcqRisk ? 'Risco Cardiovascular Alto (>0.90)' : 'Risco Baixo/Moderado (≤0.90)';
    } else {
      rcqRisk = rcq > 0.85;
      rcqText = rcqRisk ? 'Risco Cardiovascular Alto (>0.85)' : 'Risco Baixo/Moderado (≤0.85)';
    }
  }

  // 3. Dobras cutâneas
  const skinfoldsSum7 =
    (skinfolds.triceps || 0) +
    (skinfolds.subscapular || 0) +
    (skinfolds.chest || 0) +
    (skinfolds.midaxillary || 0) +
    (skinfolds.suprailiac || 0) +
    (skinfolds.abdominal || 0) +
    (skinfolds.thigh || 0);

  const skinfoldsSum4 =
    (skinfolds.triceps || 0) +
    (skinfolds.subscapular || 0) +
    (skinfolds.suprailiac || 0) +
    (skinfolds.abdominal || 0);

  // 4. Protocolo de Gordura
  let bodyFatPercent = 0;

  if (fatProtocol === 'marinha') {
    // US Navy Protocol
    if (circumferences.abdomen > 0 && circumferences.neck > 0 && height > 0) {
      if (sex === 'M') {
        const diff = circumferences.abdomen - circumferences.neck;
        if (diff > 0) {
          bodyFatPercent =
            495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height)) - 450;
        }
      } else {
        const sumDiff = circumferences.abdomen + circumferences.hip - circumferences.neck;
        if (sumDiff > 0) {
          bodyFatPercent =
            495 / (1.29579 - 0.35004 * Math.log10(sumDiff) + 0.22100 * Math.log10(height)) - 450;
        }
      }
    }
  } else if (fatProtocol === 'faulkner') {
    // Faulkner (4 dobras: TR + SE + SI + AB)
    if (skinfoldsSum4 > 0) {
      bodyFatPercent = skinfoldsSum4 * 0.153 + 5.783;
    }
  } else if (fatProtocol === 'jp7') {
    // Jackson & Pollock 7 dobras
    if (skinfoldsSum7 > 0 && age > 0) {
      let densidade = 0;
      if (sex === 'M') {
        densidade =
          1.112 -
          0.00043499 * skinfoldsSum7 +
          0.00000055 * (skinfoldsSum7 * skinfoldsSum7) -
          0.00028826 * age;
      } else {
        densidade =
          1.097 -
          0.00046971 * skinfoldsSum7 +
          0.00000056 * (skinfoldsSum7 * skinfoldsSum7) -
          0.00012828 * age;
      }
      if (densidade > 0) {
        bodyFatPercent = (4.95 / densidade - 4.5) * 100;
      }
    }
  } else if (fatProtocol === 'jp3') {
    // Jackson & Pollock 3 dobras
    if (age > 0) {
      let s3 = 0;
      let densidade = 0;
      if (sex === 'M') {
        // Peitoral, Abdômen, Coxa
        s3 = (skinfolds.chest || 0) + (skinfolds.abdominal || 0) + (skinfolds.thigh || 0);
        densidade = 1.10938 - 0.0008267 * s3 + 0.0000016 * (s3 * s3) - 0.0002574 * age;
      } else {
        // Tríceps, Supra-ilíaca, Coxa
        s3 = (skinfolds.triceps || 0) + (skinfolds.suprailiac || 0) + (skinfolds.thigh || 0);
        densidade = 1.0994921 - 0.0009929 * s3 + 0.0000023 * (s3 * s3) - 0.0001392 * age;
      }
      if (densidade > 0) {
        bodyFatPercent = (4.95 / densidade - 4.5) * 100;
      }
    }
  }

  if (isNaN(bodyFatPercent) || bodyFatPercent < 2) bodyFatPercent = 0;
  if (bodyFatPercent > 65) bodyFatPercent = 65;

  const fatMassKg = weight > 0 ? weight * (bodyFatPercent / 100) : 0;
  const leanMassKg = weight > 0 ? Math.max(0, weight - fatMassKg) : 0;

  // 5. Gasto Energético (TMB)
  // Mifflin-St Jeor
  let bmrMifflin = 0;
  if (weight > 0 && height > 0 && age > 0) {
    bmrMifflin = 10 * weight + 6.25 * height - 5 * age + (sex === 'M' ? 5 : -161);
  }

  // Harris-Benedict (revisada Roza & Shizgal 1984)
  let bmrHarris = 0;
  if (weight > 0 && height > 0 && age > 0) {
    bmrHarris =
      sex === 'M'
        ? 66.5 + 13.75 * weight + 5.0 * height - 6.75 * age
        : 655.1 + 9.56 * weight + 1.85 * height - 4.68 * age;
  }

  // FAO/WHO/UNU
  let bmrFao = 0;
  if (weight > 0 && age > 0) {
    if (sex === 'M') {
      if (age < 18) bmrFao = 17.5 * weight + 651;
      else if (age < 30) bmrFao = 15.3 * weight + 679;
      else if (age < 60) bmrFao = 11.6 * weight + 879;
      else bmrFao = 13.5 * weight + 487;
    } else {
      if (age < 18) bmrFao = 12.2 * weight + 746;
      else if (age < 30) bmrFao = 14.7 * weight + 496;
      else if (age < 60) bmrFao = 8.7 * weight + 829;
      else bmrFao = 10.5 * weight + 596;
    }
  }

  // Cunningham (baseado em massa magra)
  let bmrCunningham: number | undefined = undefined;
  if (leanMassKg > 0) {
    bmrCunningham = 500 + 22 * leanMassKg;
  }

  // Fórmula escolhida
  let chosenBmr = bmrMifflin;
  if (prescription.bmrFormula === 'harris') chosenBmr = bmrHarris;
  else if (prescription.bmrFormula === 'fao') chosenBmr = bmrFao;
  else if (prescription.bmrFormula === 'cunningham' && bmrCunningham) chosenBmr = bmrCunningham;

  const get = chosenBmr * (prescription.activityFactor || 1);
  const vet = Math.max(800, get + (prescription.targetKcalAdjustment || 0));

  // Macronutrientes
  const proteinGrams = Math.round(prescription.proteinGKg * weight);
  const proteinKcal = proteinGrams * 4;

  const fatGrams = Math.round(prescription.fatGKg * weight);
  const fatKcal = fatGrams * 9;

  // Carboidratos podem ser calculados a partir de carbGKg ou ajustados para fechar o VET se desejado
  let carbGrams = Math.round(prescription.carbGKg * weight);
  if (carbGrams <= 0 && vet > proteinKcal + fatKcal) {
    carbGrams = Math.round((vet - proteinKcal - fatKcal) / 4);
  }
  const carbKcal = carbGrams * 4;

  return {
    imc,
    imcClassification,
    rcq,
    rcqRisk,
    rcqText,
    bodyFatPercent,
    fatMassKg,
    leanMassKg,
    bmrMifflin,
    bmrHarris,
    bmrFao,
    bmrCunningham,
    chosenBmr,
    get,
    vet,
    proteinGrams,
    proteinKcal,
    carbGrams,
    carbKcal,
    fatGrams,
    fatKcal,
    skinfoldsSum7,
    skinfoldsSum4,
  };
}

/**
 * Variação do peso atual em relação ao peso habitual, em %.
 * Retorna null quando algum dos pesos não foi informado (<= 0).
 */
export function variacaoPesoHabitual(pesoAtual: number, pesoHabitual?: number): number | null {
  if (!(pesoAtual > 0) || !pesoHabitual || !(pesoHabitual > 0)) return null;
  return ((pesoAtual - pesoHabitual) / pesoHabitual) * 100;
}

/** Formata a variação com sinal e 1 casa, no padrão brasileiro: "−5,9%", "+2,0%". */
export function formatarVariacaoPercentual(valor: number): string {
  const arredondado = Math.round(valor * 10) / 10;
  const sinal = arredondado > 0 ? '+' : arredondado < 0 ? '−' : '';
  return `${sinal}${Math.abs(arredondado).toFixed(1).replace('.', ',')}%`;
}
