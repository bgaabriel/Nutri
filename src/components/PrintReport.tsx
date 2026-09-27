import React from 'react';
import { Patient, ProfessionalProfile, Anthropometry, Skinfolds, Anamnese, ExamesLab, Meal } from '../types/nutrition';
import { CalculatedResults } from '../utils/nutritionCalculations';

interface PrintReportProps {
  patient: Patient;
  professional: ProfessionalProfile;
  antropo: Anthropometry;
  dobras: Skinfolds;
  anamnese: Anamnese;
  exames: ExamesLab;
  calculos: CalculatedResults;
  refeicoes: Meal[];
  dataConsulta: string;
}

export const PrintReport: React.FC<PrintReportProps> = ({
  patient,
  professional,
  antropo,
  dobras,
  anamnese,
  exames,
  calculos,
  refeicoes,
  dataConsulta,
}) => {
  return (
    <div className="hidden print:block text-slate-900 bg-white p-6 max-w-4xl mx-auto text-sm leading-relaxed">
      {/* Header Clínico */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Relatório de Avaliação Nutricional</h1>
          <p className="text-base font-semibold text-slate-700 mt-1">{professional.nome} • {professional.registro}</p>
          <p className="text-xs text-slate-500">{professional.titulo} • {professional.clinica} • {professional.contato}</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-semibold">
            Data: {dataConsulta}
          </span>
        </div>
      </div>

      {/* 1. Dados do Paciente */}
      <div className="mb-6 card-print border border-slate-200 rounded p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
          1. Identificação do Paciente
        </h2>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Nome:</span>
            <strong className="text-slate-900 text-sm">{patient.nome}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Idade / Sexo:</span>
            <strong className="text-slate-900">{patient.idade} anos • {patient.sexo === 'M' ? 'Masculino' : 'Feminino'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Objetivo Clínico:</span>
            <strong className="text-slate-900">{patient.objetivoPrincipal || 'Reeducação alimentar'}</strong>
          </div>
        </div>
      </div>

      {/* 2. Anamnese & Rotina */}
      <div className="mb-6 card-print border border-slate-200 rounded p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
          2. Anamnese e Rotina Clínica
        </h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Consumo de Água:</span>
            <span className="text-slate-800 font-medium">{anamnese.aguaLitros || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Sono / Qualidade:</span>
            <span className="text-slate-800 font-medium">{anamnese.sono || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Hábito Intestinal:</span>
            <span className="text-slate-800 font-medium">{anamnese.habitoIntestinal || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Atividade Física:</span>
            <span className="text-slate-800 font-medium">{anamnese.rotinaTreino || 'Não informado'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block">Alergias / Intolerâncias / Aversões:</span>
            <span className="text-slate-800 font-medium">{anamnese.alergiasAversoes || 'Nenhuma informada'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block">Medicamentos / Suplementação:</span>
            <span className="text-slate-800 font-medium">{anamnese.medicamentosSuplementos || 'Nenhum'}</span>
          </div>
        </div>
      </div>

      {/* 3. Antropometria & Composição Corporal */}
      <div className="mb-6 card-print border border-slate-200 rounded p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
          3. Antropometria e Composição Corporal
        </h2>
        <div className="grid grid-cols-4 gap-4 mb-4 text-xs">
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 block">Peso Atual:</span>
            <strong className="text-base text-slate-900">{antropo.peso.toFixed(1)} kg</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 block">Altura:</span>
            <strong className="text-base text-slate-900">{antropo.altura} cm</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 block">IMC:</span>
            <strong className="text-base text-slate-900">{calculos.imc.toFixed(1)} kg/m²</strong>
            <span className="block text-[10px] text-slate-600">{calculos.imcClass}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-slate-500 block">% de Gordura:</span>
            <strong className="text-base text-slate-900">{calculos.percGordura.toFixed(1)}%</strong>
            <span className="block text-[10px] text-slate-600">{calculos.massaGorda.toFixed(1)}kg Gordura • {calculos.massaMagra.toFixed(1)}kg Magra</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">Circunferências (cm)</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div>Pescoço: <strong>{antropo.cPescoco || '-'} cm</strong></div>
              <div>Cintura: <strong>{antropo.cCintura || '-'} cm</strong></div>
              <div>Abdômen: <strong>{antropo.cAbdomen || '-'} cm</strong></div>
              <div>Quadril: <strong>{antropo.cQuadril || '-'} cm</strong></div>
              <div>Braço: <strong>{antropo.cBraco || '-'} cm</strong></div>
              <div>Coxa: <strong>{antropo.cCoxa || '-'} cm</strong></div>
              <div>Panturrilha: <strong>{antropo.cPanturrilha || '-'} cm</strong></div>
              <div>RCQ: <strong>{calculos.rcq.toFixed(2)}</strong> {calculos.rcqRisco ? '(Risco Alto)' : '(Normal)'}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">Dobras Cutâneas (mm)</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div>Tríceps: <strong>{dobras.dTri || '-'} mm</strong></div>
              <div>Subescapular: <strong>{dobras.dSub || '-'} mm</strong></div>
              <div>Peitoral: <strong>{dobras.dPei || '-'} mm</strong></div>
              <div>Axilar Média: <strong>{dobras.dAxi || '-'} mm</strong></div>
              <div>Supra-ilíaca: <strong>{dobras.dSup || '-'} mm</strong></div>
              <div>Abdominal: <strong>{dobras.dAbd || '-'} mm</strong></div>
              <div>Coxa: <strong>{dobras.dCox || '-'} mm</strong></div>
              <div>Soma Dobras: <strong>{calculos.soma7Dobras} mm</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Metas Energéticas & Prescrição */}
      <div className="mb-6 card-print border border-slate-200 rounded p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
          4. Plano Energético e VET
        </h2>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-2 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">TMB Calculada:</span>
            <strong className="text-sm text-slate-900">{Math.round(calculos.tmbEscolhida)} kcal</strong>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Gasto Energético Total (GET):</span>
            <strong className="text-sm text-slate-900">{Math.round(calculos.get)} kcal</strong>
          </div>
          <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
            <span className="text-emerald-800 block font-semibold">Meta Prescrita (VET):</span>
            <strong className="text-base text-emerald-900">{Math.round(calculos.vet)} kcal/dia</strong>
          </div>
        </div>
      </div>

      {/* 5. Refeições Prescritas */}
      {refeicoes.length > 0 && (
        <div className="mb-6 card-print border border-slate-200 rounded p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">
            5. Estrutura do Plano Alimentar
          </h2>
          <div className="space-y-3">
            {refeicoes.map((meal, idx) => (
              <div key={idx} className="border-b border-slate-100 pb-2 last:border-0 text-xs">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>{meal.nome} ({meal.horario})</span>
                  <span>
                    {Math.round(meal.alimentos.reduce((acc, f) => acc + f.calorias, 0))} kcal
                  </span>
                </div>
                <ul className="list-disc pl-4 text-slate-700">
                  {meal.alimentos.map((food, fIdx) => (
                    <li key={fIdx}>
                      {food.nome} — {food.quantidadeG}g ({food.calorias} kcal | P: {food.proteinas}g | C: {food.carboidratos}g | G: {food.gorduras}g)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assinatura */}
      <div className="mt-12 pt-8 text-center text-xs border-t border-slate-300">
        <div className="w-64 mx-auto border-t border-slate-400 mb-1"></div>
        <p className="font-bold text-slate-900">{professional.nome}</p>
        <p className="text-slate-600">{professional.registro} • Nutricionista Responsável</p>
      </div>
    </div>
  );
};
