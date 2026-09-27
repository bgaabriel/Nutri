import { TacoFoodItem, MealFoodItem, MealPlan, Consultation } from '../types';
import tacoCompleta from './taco/taco_completa.json';
import alimentosComplementares from './taco/alimentos_complementares.json';
import mapaIdsAntigos from './taco/mapa_ids_antigos.json';

export const GRUPO_COMPLEMENTARES = 'Complementares (não-TACO)';

/**
 * Base de alimentos do app:
 * - 597 alimentos da TACO 4ª edição (NEPA/UNICAMP, 2011), valores por 100 g, com os
 *   15 grupos oficiais (4 deles sem todos os valores na TACO: dadosIncompletos);
 * - 17 alimentos "Complementares (não-TACO)" herdados da versão anterior, com a
 *   observação de que precisam ser conferidos no rótulo/fonte.
 */
export const TACO_FOODS: TacoFoodItem[] = [
  ...(tacoCompleta as TacoFoodItem[]),
  ...(alimentosComplementares as TacoFoodItem[]),
];

/**
 * Base em uso. Começa com o JSON local; depois do login o app troca pela tabela
 * alimentos_taco do Supabase (definirBaseAlimentos). Se a consulta ao banco falhar,
 * o JSON continua valendo.
 */
let baseAlimentos: TacoFoodItem[] = TACO_FOODS;

export function obterAlimentos(): TacoFoodItem[] {
  return baseAlimentos;
}

export function definirBaseAlimentos(alimentos: TacoFoodItem[]): void {
  if (alimentos.length > 0) baseAlimentos = alimentos;
}

/** 'Todos' + os grupos presentes nos dados, na ordem da TACO, com os complementares por último. */
export function categoriasDosAlimentos(alimentos: TacoFoodItem[]): string[] {
  const grupos = Array.from(new Set(alimentos.map((f) => f.grupo)));
  const taco = grupos.filter((g) => g !== GRUPO_COMPLEMENTARES);
  return ['Todos', ...taco, ...(grupos.includes(GRUPO_COMPLEMENTARES) ? [GRUPO_COMPLEMENTARES] : [])];
}


const MAPA_IDS_ANTIGOS = mapaIdsAntigos as Record<string, string>;

/** Converte o id de alimento da base antiga (66 itens, 'taco-14') para o id novo ('taco-410'). */
export function migrarTacoId(tacoId: string): string {
  return MAPA_IDS_ANTIGOS[tacoId] ?? tacoId;
}

/** Aponta os alimentos de um cardápio salvo com ids antigos para os ids novos. */
export function migrarMealPlan(plan: MealPlan): MealPlan {
  let mudou = false;
  const refeicoes = plan.refeicoes.map((refeicao) => ({
    ...refeicao,
    alimentos: refeicao.alimentos.map((item) => {
      const novo = migrarTacoId(item.tacoId);
      if (novo === item.tacoId) return item;
      mudou = true;
      return { ...item, tacoId: novo };
    }),
  }));
  return mudou ? { ...plan, refeicoes } : plan;
}

/** Aplica migrarMealPlan no cardápio de uma consulta, se houver. */
export function migrarConsulta(consulta: Consultation): Consultation {
  return consulta.mealPlan ? { ...consulta, mealPlan: migrarMealPlan(consulta.mealPlan) } : consulta;
}

/** Texto em minúsculas e sem acentos, para comparar na busca. */
export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export const LIMITE_RESULTADOS_BUSCA = 50;

/**
 * Busca por nome ignorando acentos e maiúsculas, com os termos em qualquer ordem
 * ("frango grelhado" encontra "Frango, peito, sem pele, grelhado").
 * Devolve no máximo LIMITE_RESULTADOS_BUSCA itens e o total encontrado.
 */
export function buscarAlimentos(
  alimentos: TacoFoodItem[],
  termo: string,
  grupo: string
): { itens: TacoFoodItem[]; total: number } {
  const termos = normalizarBusca(termo).split(/[\s,]+/).filter(Boolean);
  const encontrados = alimentos.filter((f) => {
    if (grupo !== 'Todos' && f.grupo !== grupo) return false;
    if (termos.length === 0) return true;
    const nome = normalizarBusca(f.nome);
    return termos.every((t) => nome.includes(t));
  });
  return { itens: encontrados.slice(0, LIMITE_RESULTADOS_BUSCA), total: encontrados.length };
}

/**
 * Converte um item da TACO e calcula os macronutrientes e micronutrientes
 * proporcionais à quantidade indicada em gramas.
 */
export function calculateFoodItemNutrients(
  food: TacoFoodItem,
  grams: number,
  substituicoes?: string
): MealFoodItem {
  const factor = (grams || 0) / 100;
  return {
    id: 'mfi_' + Math.random().toString(36).substr(2, 9),
    tacoId: food.id,
    nome: food.nome,
    grupo: food.grupo,
    quantidadeG: grams,
    medidaCaseira: food.medidaCaseira,
    kcal: Math.round(food.kcal100g * factor * 10) / 10,
    prot: Math.round(food.prot100g * factor * 10) / 10,
    carb: Math.round(food.carb100g * factor * 10) / 10,
    lip: Math.round(food.lip100g * factor * 10) / 10,
    fibra: Math.round(food.fibra100g * factor * 10) / 10,
    sodio: Math.round(food.sodio100g * factor * 10) / 10,
    calcio: Math.round(food.calcio100g * factor * 10) / 10,
    ferro: Math.round(food.ferro100g * factor * 100) / 100,
    potassio: Math.round(food.potassio100g * factor * 10) / 10,
    magnesio: Math.round(food.magnesio100g * factor * 10) / 10,
    vitc: Math.round(food.vitc100g * factor * 10) / 10,
    substituicoes: substituicoes || '',
  };
}

/**
 * Totais nutricionais somados de uma lista de alimentos
 */
export function sumMealNutrients(items: MealFoodItem[]) {
  return items.reduce(
    (acc, item) => ({
      kcal: Math.round((acc.kcal + (item.kcal || 0)) * 10) / 10,
      prot: Math.round((acc.prot + (item.prot || 0)) * 10) / 10,
      carb: Math.round((acc.carb + (item.carb || 0)) * 10) / 10,
      lip: Math.round((acc.lip + (item.lip || 0)) * 10) / 10,
      fibra: Math.round((acc.fibra + (item.fibra || 0)) * 10) / 10,
      sodio: Math.round((acc.sodio + (item.sodio || 0)) * 10) / 10,
      calcio: Math.round((acc.calcio + (item.calcio || 0)) * 10) / 10,
      ferro: Math.round((acc.ferro + (item.ferro || 0)) * 100) / 100,
      potassio: Math.round((acc.potassio + (item.potassio || 0)) * 10) / 10,
      magnesio: Math.round((acc.magnesio + (item.magnesio || 0)) * 10) / 10,
      vitc: Math.round((acc.vitc + (item.vitc || 0)) * 10) / 10,
    }),
    {
      kcal: 0,
      prot: 0,
      carb: 0,
      lip: 0,
      fibra: 0,
      sodio: 0,
      calcio: 0,
      ferro: 0,
      potassio: 0,
      magnesio: 0,
      vitc: 0,
    }
  );
}

/** Minutos desde 00:00 de um horário 'HH:MM' (ou 'H:MM'); horário inválido vai para o fim. */
function minutosDoHorario(horario: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec((horario || '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : 24 * 60;
}

/** Refeições em ordem de horário (ordenação estável: empates mantêm a ordem atual). */
export function ordenarRefeicoesPorHorario<T extends { horario: string }>(refeicoes: T[]): T[] {
  return [...refeicoes].sort((a, b) => minutosDoHorario(a.horario) - minutosDoHorario(b.horario));
}

/**
 * Gera um cardápio modelo inicial equilibrado com base no objetivo
 */
export function createDefaultMealPlan(
  patientId: string,
  targetKcal: number = 2000,
  weightKg: number = 70
): MealPlan {
  const getFood = (id: string) => obterAlimentos().find((f) => f.id === id);

  const m1 = getFood('taco-488'); // ovo cozido
  const m2 = getFood('taco-052'); // pao integral
  const m3 = getFood('taco-182'); // banana prata
  const m4 = getFood('taco-007'); // aveia

  const lm1 = getFood('taco-222'); // maçã
  const lm2 = getFood('taco-588'); // castanha-de-caju

  const al1 = getFood('taco-003'); // arroz
  const al2 = getFood('taco-561'); // feijao
  const al3 = getFood('taco-410'); // peito de frango
  const al4 = getFood('taco-100'); // brocolis
  const al5 = getFood('taco-157'); // tomate
  const al6 = getFood('taco-260'); // azeite

  const lt1 = getFood('taco-449'); // iogurte
  const lt2 = getFood('comp-63'); // whey (complementar, não-TACO)
  const lt3 = getFood('taco-239'); // morango

  const jt1 = getFood('taco-088'); // batata doce
  const jt2 = getFood('taco-377'); // patinho bovino
  const jt3 = getFood('taco-078'); // alface
  const jt4 = getFood('taco-110'); // cenoura

  const ce1 = getFood('taco-589'); // castanha

  const meals = [
    {
      id: 'meal-1',
      nome: 'Café da Manhã',
      horario: '07:30',
      observacoes: 'Consumir com café sem açúcar ou chá verde. Mastigar bem.',
      alimentos: [
        m2 ? calculateFoodItemNutrients(m2, 50, 'Ou 1 tapioca de 60g') : null,
        m1 ? calculateFoodItemNutrients(m1, 100, 'Ou 100g de queijo cottage') : null,
        m3 ? calculateFoodItemNutrients(m3, 80, 'Ou 1 maçã fuji média') : null,
        m4 ? calculateFoodItemNutrients(m4, 20, 'Ou 1 colher de sopa de chia') : null,
      ].filter(Boolean) as MealFoodItem[],
    },
    {
      id: 'meal-lanche-manha',
      nome: 'Lanche da Manhã',
      horario: '10:00',
      observacoes: 'Lanche leve para chegar ao almoço sem fome excessiva.',
      alimentos: [
        lm1 ? calculateFoodItemNutrients(lm1, 130, 'Ou 1 pera média ou 2 fatias de mamão') : null,
        lm2 ? calculateFoodItemNutrients(lm2, 15, 'Ou 3 castanhas-do-pará ou 10 amêndoas') : null,
      ].filter(Boolean) as MealFoodItem[],
    },
    {
      id: 'meal-2',
      nome: 'Almoço Completo',
      horario: '12:30',
      observacoes: 'Prato colorido: metade vegetais, 1/4 carboidrato e 1/4 proteína magra.',
      alimentos: [
        al1 ? calculateFoodItemNutrients(al1, 120, 'Ou 140g de batata doce cozida') : null,
        al2 ? calculateFoodItemNutrients(al2, 100, 'Ou 1 concha de lentilha') : null,
        al3 ? calculateFoodItemNutrients(al3, 140, 'Ou 140g de filé de tilápia grelhado') : null,
        al4 ? calculateFoodItemNutrients(al4, 80, 'À vontade') : null,
        al5 ? calculateFoodItemNutrients(al5, 60, 'À vontade') : null,
        al6 ? calculateFoodItemNutrients(al6, 10, 'Usar cru por cima do prato') : null,
      ].filter(Boolean) as MealFoodItem[],
    },
    {
      id: 'meal-3',
      nome: 'Lanche da Tarde (Pré-Treino)',
      horario: '16:30',
      observacoes: 'Opção prática para manter o aporte proteico e saciedade.',
      alimentos: [
        lt1 ? calculateFoodItemNutrients(lt1, 160, '1 pote de iogurte natural') : null,
        lt2 ? calculateFoodItemNutrients(lt2, 30, 'Ou 3 ovos cozidos') : null,
        lt3 ? calculateFoodItemNutrients(lt3, 100, 'Ou 1 fatia de melão') : null,
      ].filter(Boolean) as MealFoodItem[],
    },
    {
      id: 'meal-4',
      nome: 'Jantar Restaurador',
      horario: '20:00',
      observacoes: 'Refeição leve rica em micronutrientes para regeneração noturna.',
      alimentos: [
        jt1 ? calculateFoodItemNutrients(jt1, 120, 'Ou 120g de mandioca cozida') : null,
        jt2 ? calculateFoodItemNutrients(jt2, 130, 'Ou 130g de peito de frango') : null,
        jt3 ? calculateFoodItemNutrients(jt3, 50, 'À vontade com vinagre de maçã') : null,
        jt4 ? calculateFoodItemNutrients(jt4, 60, 'À vontade ralada') : null,
      ].filter(Boolean) as MealFoodItem[],
    },
    {
      id: 'meal-5',
      nome: 'Ceia / Antes de Dormir',
      horario: '22:30',
      observacoes: 'Gorduras boas com ação antioxidante e indutoras do sono.',
      alimentos: [
        ce1 ? calculateFoodItemNutrients(ce1, 15, 'Ou 20g de castanha-de-caju') : null,
      ].filter(Boolean) as MealFoodItem[],
    },
  ];

  // Cálculo da meta hídrica: 35ml por kg de peso
  const metaAgua = Math.round((weightKg > 0 ? weightKg * 35 : 2500) / 100) * 100;

  return {
    id: 'mp_' + Date.now(),
    titulo: `Plano Alimentar Individualizado (${targetKcal > 0 ? targetKcal + ' kcal' : 'Equilibrado'})`,
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    refeicoes: meals,
    metaAguaMl: metaAgua,
    orientacoesGerais:
      'Beber água fracionada ao longo do dia. Evitar líquidos nas grandes refeições. Mastigar devagar cada bocado e priorizar alimentos in natura da feira ou açougue.',
  };
}
