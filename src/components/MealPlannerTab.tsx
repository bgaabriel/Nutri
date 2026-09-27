import React, { useState, useMemo } from 'react';
import { Patient, Consultation, MealPlan, Meal, TacoFoodItem } from '../types';
import { TACO_FOODS, TACO_CATEGORIES, calculateFoodItemNutrients, sumMealNutrients, createDefaultMealPlan } from '../data/tacoFoods';
import {
  Utensils,
  Plus,
  Trash2,
  Search,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Flame,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface MealPlannerTabProps {
  patient: Patient;
  consultation: Consultation;
  onUpdateMealPlan: (plan: MealPlan) => void;
}

export const MealPlannerTab: React.FC<MealPlannerTabProps> = ({
  patient,
  consultation,
  onUpdateMealPlan,
}) => {
  // Inicializa com o plano da consulta ou gera um padrão baseado nas metas
  const targetKcal = consultation.calculated?.vet || 2000;
  const currentWeight = consultation.anthropometry.weight || 70;

  const activePlan = useMemo<MealPlan>(() => {
    if (consultation.mealPlan && consultation.mealPlan.refeicoes.length > 0) {
      return consultation.mealPlan;
    }
    return createDefaultMealPlan(patient.id, targetKcal, currentWeight);
  }, [consultation.mealPlan, patient.id, targetKcal, currentWeight]);

  // Estado do modal de adição de alimentos da TACO
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedFood, setSelectedFood] = useState<TacoFoodItem | null>(null);
  const [customGrams, setCustomGrams] = useState<number>(100);
  const [customSubstituicoes, setCustomSubstituicoes] = useState<string>('');

  // Expandir / recolher seções de micronutrientes
  const [showMicros, setShowMicros] = useState<boolean>(true);

  // Alimentos filtrados da TACO
  const filteredFoods = useMemo(() => {
    return TACO_FOODS.filter((f) => {
      const matchesCategory =
        selectedCategory === 'Todos' || f.grupo === selectedCategory;
      const matchesSearch =
        f.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.grupo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Totais de todas as refeições do plano
  const dailyTotals = useMemo(() => {
    const allItems = activePlan.refeicoes.flatMap((m) => m.alimentos);
    return sumMealNutrients(allItems);
  }, [activePlan]);

  // Metas do paciente
  const targetProtG = consultation.calculated?.proteinGrams || Math.round(currentWeight * 2.0);
  const targetCarbG = consultation.calculated?.carbGrams || Math.round(currentWeight * 3.0);
  const targetFatG = consultation.calculated?.fatGrams || Math.round(currentWeight * 0.8);

  // Handlers para manipulação das refeições
  const handleAddMeal = () => {
    const newMeal: Meal = {
      id: 'meal_' + Date.now(),
      nome: 'Nova Refeição',
      horario: '15:00',
      alimentos: [],
      observacoes: '',
    };
    onUpdateMealPlan({
      ...activePlan,
      refeicoes: [...activePlan.refeicoes, newMeal],
    });
  };

  const handleRemoveMeal = (mealId: string) => {
    if (activePlan.refeicoes.length <= 1) {
      alert('O cardápio deve possuir ao menos uma refeição.');
      return;
    }
    const updatedMeals = activePlan.refeicoes.filter((m) => m.id !== mealId);
    onUpdateMealPlan({
      ...activePlan,
      refeicoes: updatedMeals,
    });
  };

  const handleUpdateMealHeader = (
    mealId: string,
    field: 'nome' | 'horario' | 'observacoes',
    value: string
  ) => {
    const updatedMeals = activePlan.refeicoes.map((m) => {
      if (m.id === mealId) {
        return { ...m, [field]: value };
      }
      return m;
    });
    onUpdateMealPlan({
      ...activePlan,
      refeicoes: updatedMeals,
    });
  };

  const handleOpenFoodModal = (mealId: string) => {
    setSelectedMealId(mealId);
    setSelectedFood(null);
    setSearchQuery('');
    setSelectedCategory('Todos');
    setCustomGrams(100);
    setCustomSubstituicoes('');
    setIsFoodModalOpen(true);
  };

  const handleSelectFoodItem = (food: TacoFoodItem) => {
    setSelectedFood(food);
    setCustomGrams(food.porcaoPadraoG || 100);
  };

  const handleConfirmAddFood = () => {
    if (!selectedFood || !selectedMealId) return;

    const newItem = calculateFoodItemNutrients(
      selectedFood,
      customGrams,
      customSubstituicoes
    );

    const updatedMeals = activePlan.refeicoes.map((m) => {
      if (m.id === selectedMealId) {
        return {
          ...m,
          alimentos: [...m.alimentos, newItem],
        };
      }
      return m;
    });

    onUpdateMealPlan({
      ...activePlan,
      refeicoes: updatedMeals,
    });

    setIsFoodModalOpen(false);
    setSelectedFood(null);
  };

  const handleRemoveFoodFromMeal = (mealId: string, foodItemId: string) => {
    const updatedMeals = activePlan.refeicoes.map((m) => {
      if (m.id === mealId) {
        return {
          ...m,
          alimentos: m.alimentos.filter((f) => f.id !== foodItemId),
        };
      }
      return m;
    });
    onUpdateMealPlan({
      ...activePlan,
      refeicoes: updatedMeals,
    });
  };

  const handleUpdateFoodGrams = (
    mealId: string,
    foodItemId: string,
    tacoId: string,
    newGrams: number
  ) => {
    const tacoFood = TACO_FOODS.find((f) => f.id === tacoId);
    if (!tacoFood) return;

    const grams = Math.max(0, newGrams || 0);

    const updatedMeals = activePlan.refeicoes.map((m) => {
      if (m.id === mealId) {
        return {
          ...m,
          alimentos: m.alimentos.map((item) => {
            if (item.id === foodItemId) {
              const recalculated = calculateFoodItemNutrients(
                tacoFood,
                grams,
                item.substituicoes
              );
              return { ...recalculated, id: item.id };
            }
            return item;
          }),
        };
      }
      return m;
    });

    onUpdateMealPlan({
      ...activePlan,
      refeicoes: updatedMeals,
    });
  };

  const handleResetToTemplate = () => {
    if (window.confirm('Deseja recarregar o cardápio padrão sugerido para a meta do paciente? As alterações atuais nesta tela serão substituídas.')) {
      const newPlan = createDefaultMealPlan(patient.id, targetKcal, currentWeight);
      onUpdateMealPlan(newPlan);
    }
  };

  // Cálculo de diferenças em relação às metas
  const kcalDiff = Math.round(dailyTotals.kcal - targetKcal);
  const kcalPercent = targetKcal > 0 ? Math.round((dailyTotals.kcal / targetKcal) * 100) : 100;

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Banner: Resumo Global vs Metas Prescritas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Prescrição Dietética (TACO)
              </span>
              <span className="text-xs text-slate-500">
                Alimentos da Tabela Brasileira de Composição de Alimentos
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Montagem de Cardápio & Contagem Nutricional
            </h2>
            <p className="text-xs text-slate-600">
              Calorias, macronutrientes e micronutrientes calculados em tempo real por refeição e total diário.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetToTemplate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              title="Carregar sugestão pré-configurada para o VET do paciente"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Modelo Sugerido</span>
            </button>
          </div>
        </div>

        {/* Dashboard de Atingimento de Metas (Totais Gerais) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          {/* Calorias Totais */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> VET Planejado
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  Math.abs(kcalDiff) <= 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : kcalDiff > 100
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {kcalDiff > 0 ? `+${kcalDiff}` : kcalDiff} kcal
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {Math.round(dailyTotals.kcal)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / {Math.round(targetKcal)} kcal
              </span>
            </div>
            {/* Barra de progresso */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  kcalPercent >= 90 && kcalPercent <= 110
                    ? 'bg-emerald-500'
                    : kcalPercent > 110
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, kcalPercent)}%` }}
              />
            </div>
          </div>

          {/* Proteínas Totais */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Proteínas</span>
              <span className="text-[10px] font-mono text-slate-600">
                {currentWeight > 0 ? (dailyTotals.prot / currentWeight).toFixed(1) : 0} g/kg
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {dailyTotals.prot.toFixed(1)}g
              </span>
              <span className="text-xs text-slate-500">
                / {targetProtG}g
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    targetProtG > 0 ? Math.round((dailyTotals.prot / targetProtG) * 100) : 0
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Carboidratos Totais */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Carboidratos</span>
              <span className="text-[10px] font-mono text-slate-600">
                {currentWeight > 0 ? (dailyTotals.carb / currentWeight).toFixed(1) : 0} g/kg
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-700 font-mono">
                {dailyTotals.carb.toFixed(1)}g
              </span>
              <span className="text-xs text-slate-500">
                / {targetCarbG}g
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    targetCarbG > 0 ? Math.round((dailyTotals.carb / targetCarbG) * 100) : 0
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Lipídeos Totais */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Lipídeos / Gorduras</span>
              <span className="text-[10px] font-mono text-slate-600">
                {currentWeight > 0 ? (dailyTotals.lip / currentWeight).toFixed(1) : 0} g/kg
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-700 font-mono">
                {dailyTotals.lip.toFixed(1)}g
              </span>
              <span className="text-xs text-slate-500">
                / {targetFatG}g
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    targetFatG > 0 ? Math.round((dailyTotals.lip / targetFatG) * 100) : 0
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Micronutrientes e Fibras do Total do Dia (Expansível) */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <button
            onClick={() => setShowMicros(!showMicros)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-slate-900 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Contagem de Fibras & Micronutrientes do Cardápio Total
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              {showMicros ? 'Ocultar detalhes' : 'Ver micronutrientes'}
              {showMicros ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          </button>

          {showMicros && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-3 pt-2 text-xs">
              <div className="bg-emerald-50/70 border border-emerald-200/60 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Fibras Alimentares</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {dailyTotals.fibra.toFixed(1)}g
                </span>
                <span className="text-[10px] text-slate-500 block">Meta: &gt;25g/dia</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Cálcio (Ca)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {Math.round(dailyTotals.calcio)} mg
                </span>
                <span className="text-[10px] text-slate-500 block">IDR: 1000 mg</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Ferro (Fe)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {dailyTotals.ferro.toFixed(1)} mg
                </span>
                <span className="text-[10px] text-slate-500 block">IDR: 8-18 mg</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Potássio (K)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {Math.round(dailyTotals.potassio)} mg
                </span>
                <span className="text-[10px] text-slate-500 block">IDR: ~3000 mg</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Magnésio (Mg)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {Math.round(dailyTotals.magnesio)} mg
                </span>
                <span className="text-[10px] text-slate-500 block">IDR: 310-420 mg</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Vitamina C</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {Math.round(dailyTotals.vitc)} mg
                </span>
                <span className="text-[10px] text-slate-500 block">IDR: 75-90 mg</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Sódio (Na)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {Math.round(dailyTotals.sodio)} mg
                </span>
                <span className="text-[10px] text-slate-500 block">Máx: &lt;2000 mg</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Refeições */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            Refeições do Dia ({activePlan.refeicoes.length})
          </h3>

          <button
            onClick={handleAddMeal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Nova Refeição</span>
          </button>
        </div>

        {activePlan.refeicoes.map((meal, index) => {
          const mealTotals = sumMealNutrients(meal.alimentos);

          return (
            <div
              key={meal.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all hover:border-slate-300"
            >
              {/* Header da Refeição: Nome, Horário e Totais daquela refeição */}
              <div className="bg-slate-50/80 px-4 sm:px-5 py-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>

                  {/* Nome da Refeição editável */}
                  <input
                    type="text"
                    value={meal.nome}
                    onChange={(e) =>
                      handleUpdateMealHeader(meal.id, 'nome', e.target.value)
                    }
                    className="font-bold text-slate-900 text-sm sm:text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 outline-none px-1 py-0.5"
                    placeholder="Ex: Café da Manhã"
                  />

                  {/* Horário */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs text-slate-700 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      value={meal.horario}
                      onChange={(e) =>
                        handleUpdateMealHeader(meal.id, 'horario', e.target.value)
                      }
                      className="w-12 bg-transparent text-center outline-none font-bold"
                      placeholder="08:00"
                    />
                  </div>
                </div>

                {/* Badges de Macros e Calorias da Refeição Individual */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                  <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                    <span className="text-slate-500 text-[10px] block font-medium">Calorias</span>
                    <span className="font-mono font-bold text-slate-900">
                      {Math.round(mealTotals.kcal)} kcal
                    </span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg text-emerald-800">
                    <span className="text-[10px] block font-medium">Proteína</span>
                    <span className="font-mono font-bold">{mealTotals.prot.toFixed(1)}g</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg text-amber-800">
                    <span className="text-[10px] block font-medium">Carboidrato</span>
                    <span className="font-mono font-bold">{mealTotals.carb.toFixed(1)}g</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg text-blue-800">
                    <span className="text-[10px] block font-medium">Gordura</span>
                    <span className="font-mono font-bold">{mealTotals.lip.toFixed(1)}g</span>
                  </div>

                  <button
                    onClick={() => handleRemoveMeal(meal.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
                    title="Excluir refeição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabela de Alimentos da Refeição */}
              <div className="p-4 sm:p-5">
                {meal.alimentos.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-xs text-slate-500 mb-3">
                      Nenhum alimento cadastrado nesta refeição ainda.
                    </p>
                    <button
                      onClick={() => handleOpenFoodModal(meal.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buscar Alimento na Tabela TACO</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="py-2 px-2 font-bold">Alimento (TACO)</th>
                          <th className="py-2 px-2 font-bold w-24">Qtd (g/ml)</th>
                          <th className="py-2 px-2 font-bold">Medida Caseira</th>
                          <th className="py-2 px-2 font-bold text-right">Kcal</th>
                          <th className="py-2 px-2 font-bold text-right">Prot</th>
                          <th className="py-2 px-2 font-bold text-right">Carb</th>
                          <th className="py-2 px-2 font-bold text-right">Gord</th>
                          <th className="py-2 px-2 font-bold">Substituição / Notas</th>
                          <th className="py-2 px-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {meal.alimentos.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-2">
                              <span className="font-semibold text-slate-800 block text-xs">
                                {item.nome}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.grupo}
                              </span>
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  step="5"
                                  value={item.quantidadeG}
                                  onChange={(e) =>
                                    handleUpdateFoodGrams(
                                      meal.id,
                                      item.id,
                                      item.tacoId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center font-mono font-bold text-slate-900 focus:border-emerald-600 outline-none"
                                />
                                <span className="text-slate-400 text-[10px]">g</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-slate-600 font-medium">
                              {item.medidaCaseira || '--'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                              {Math.round(item.kcal)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-emerald-700 font-semibold">
                              {item.prot.toFixed(1)}g
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-amber-700 font-semibold">
                              {item.carb.toFixed(1)}g
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-blue-700 font-semibold">
                              {item.lip.toFixed(1)}g
                            </td>
                            <td className="py-2.5 px-2">
                              <input
                                type="text"
                                value={item.substituicoes || ''}
                                onChange={(e) => {
                                  const updatedMeals = activePlan.refeicoes.map((m) => {
                                    if (m.id === meal.id) {
                                      return {
                                        ...m,
                                        alimentos: m.alimentos.map((f) =>
                                          f.id === item.id
                                            ? { ...f, substituicoes: e.target.value }
                                            : f
                                        ),
                                      };
                                    }
                                    return m;
                                  });
                                  onUpdateMealPlan({
                                    ...activePlan,
                                    refeicoes: updatedMeals,
                                  });
                                }}
                                placeholder="Ex: Ou 2 fatias de pão..."
                                className="w-full text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 outline-none px-1 py-0.5"
                              />
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => handleRemoveFoodFromMeal(meal.id, item.id)}
                                className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                                title="Remover alimento"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Botão para adicionar mais alimentos nesta refeição */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenFoodModal(meal.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Alimento (TACO)</span>
                      </button>

                      {/* Observações da refeição */}
                      <input
                        type="text"
                        value={meal.observacoes || ''}
                        onChange={(e) =>
                          handleUpdateMealHeader(meal.id, 'observacoes', e.target.value)
                        }
                        placeholder="Observações ou orientações da refeição..."
                        className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 w-72 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Busca na Tabela TACO */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600" />
                  Alimentos da Tabela TACO
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione o alimento e defina a porção em gramas
                </p>
              </div>
              <button
                onClick={() => setIsFoodModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Pesquisa e Filtro de Grupos */}
            <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por arroz, frango, feijão, banana, queijo..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 focus:border-emerald-600 outline-none"
                  autoFocus
                />
              </div>

              {/* Categorias Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {TACO_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Alimentos */}
            <div className="overflow-y-auto flex-1 p-3 divide-y divide-slate-100 max-h-[340px]">
              {filteredFoods.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Nenhum alimento encontrado para &quot;{searchQuery}&quot;. Tente outro termo ou categoria.
                </div>
              ) : (
                filteredFoods.map((food) => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFoodItem(food)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50 border-2 border-emerald-600 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-900 text-sm block">
                          {food.nome}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            {food.grupo}
                          </span>
                          <span>Porção ref: {food.porcaoPadraoG}g ({food.medidaCaseira})</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          {food.kcal100g} kcal
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          P:{food.prot100g}g • C:{food.carb100g}g • G:{food.lip100g}g
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Configuração da Porção Selecionada */}
            {selectedFood && (
              <div className="p-4 bg-emerald-50/50 border-t border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">
                      Alimento Selecionado: {selectedFood.nome}
                    </span>
                    <span className="text-xs text-slate-600">
                      Medida sugerida: {selectedFood.medidaCaseira}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      Quantidade:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customGrams}
                      onChange={(e) => setCustomGrams(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-center font-mono font-bold text-slate-900 focus:border-emerald-600 outline-none"
                    />
                    <span className="text-xs font-semibold text-slate-500">gramas</span>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={customSubstituicoes}
                    onChange={(e) => setCustomSubstituicoes(e.target.value)}
                    placeholder="Opção de substituição (opcional, ex: Ou 1 pote de iogurte...)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Footer do Modal */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2.5 bg-slate-50">
              <button
                onClick={() => setIsFoodModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!selectedFood}
                onClick={handleConfirmAddFood}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Adicionar ao Cardápio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
