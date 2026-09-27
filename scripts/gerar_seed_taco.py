#!/usr/bin/env python3
"""
Gera supabase/migrations/20260926120100_alimentos_taco.sql a partir de
src/data/taco/taco_completa.json + src/data/taco/alimentos_complementares.json.

Uso (na raiz do projeto):  python3 scripts/gerar_seed_taco.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TACO = RAIZ / "src/data/taco/taco_completa.json"
COMP = RAIZ / "src/data/taco/alimentos_complementares.json"
SAIDA = RAIZ / "supabase/migrations/20260926120100_alimentos_taco.sql"

# (chave no JSON do app, coluna no banco)
COLUNAS = [
    ("id", "id"), ("tacoNumero", "taco_numero"), ("nome", "nome"), ("grupo", "grupo"),
    ("fonte", "fonte"), ("porcaoPadraoG", "porcao_padrao_g"), ("medidaCaseira", "medida_caseira"),
    ("kcal100g", "kcal_100g"), ("prot100g", "prot_100g"), ("carb100g", "carb_100g"),
    ("lip100g", "lip_100g"), ("fibra100g", "fibra_100g"), ("sodio100g", "sodio_mg_100g"),
    ("calcio100g", "calcio_mg_100g"), ("ferro100g", "ferro_mg_100g"),
    ("potassio100g", "potassio_mg_100g"), ("magnesio100g", "magnesio_mg_100g"),
    ("vitc100g", "vitc_mg_100g"), ("fosforo100g", "fosforo_mg_100g"),
    ("zinco100g", "zinco_mg_100g"), ("colesterol100g", "colesterol_mg_100g"),
    ("umidade100g", "umidade_100g"), ("dadosIncompletos", "dados_incompletos"),
]

CABECALHO = """-- =====================================================================
-- Tabela TACO completa (4ª edição, NEPA/UNICAMP 2011) — 597 alimentos
-- + 17 alimentos complementares herdados da versão anterior do app
--   (não existem na TACO; marcados com grupo "Complementares (não-TACO)").
-- Valores por 100 g de parte comestível. Gerado a partir de
-- src/data/taco/taco_completa.json e alimentos_complementares.json.
-- Campos ausentes/“*”/“NA” na TACO original ficam 0 (macros) ou null (umidade);
-- dados_incompletos = true quando a TACO não traz sequer a energia.
-- =====================================================================

create table public.alimentos_taco (
  id                  text primary key,          -- 'taco-001'..'taco-597' ou 'comp-06'...
  taco_numero         smallint unique,           -- nº oficial na TACO (null nos complementares)
  nome                text not null,
  grupo               text not null,
  fonte               text not null,
  porcao_padrao_g     numeric(7,1) not null default 100,
  medida_caseira      text not null default '100 g',
  kcal_100g           numeric(7,1) not null default 0,
  prot_100g           numeric(6,1) not null default 0,
  carb_100g           numeric(6,1) not null default 0,
  lip_100g            numeric(6,1) not null default 0,
  fibra_100g          numeric(6,1) not null default 0,
  sodio_mg_100g       numeric(8,1) not null default 0,
  calcio_mg_100g      numeric(8,1) not null default 0,
  ferro_mg_100g       numeric(7,2) not null default 0,
  potassio_mg_100g    numeric(8,1) not null default 0,
  magnesio_mg_100g    numeric(8,1) not null default 0,
  vitc_mg_100g        numeric(8,1) not null default 0,
  fosforo_mg_100g     numeric(8,1) not null default 0,
  zinco_mg_100g       numeric(7,2) not null default 0,
  colesterol_mg_100g  numeric(8,1) not null default 0,
  umidade_100g        numeric(5,1),
  dados_incompletos   boolean not null default false
);

create index idx_alimentos_taco_grupo on public.alimentos_taco (grupo);

alter table public.alimentos_taco enable row level security;

-- Leitura para qualquer nutricionista logado; escrita só via migration/painel.
create policy "alimentos: leitura autenticada"
  on public.alimentos_taco for select to authenticated
  using (true);

"""


def literal(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        return format(v, "f").rstrip("0").rstrip(".") or "0"
    return "'" + str(v).replace("'", "''") + "'"


def main():
    alimentos = json.loads(TACO.read_text("utf-8")) + json.loads(COMP.read_text("utf-8"))
    ids = [a["id"] for a in alimentos]
    assert len(ids) == len(set(ids)), "IDs duplicados nos JSON"
    linhas = []
    for a in alimentos:
        valores = []
        for chave, _ in COLUNAS:
            v = a.get(chave)
            if chave == "dadosIncompletos" and v is None:
                v = False
            valores.append(literal(v))
        linhas.append("  (" + ", ".join(valores) + ")")
    sql = (
        CABECALHO
        + "insert into public.alimentos_taco (" + ", ".join(c for _, c in COLUNAS) + ") values\n"
        + ",\n".join(linhas) + ";\n"
    )
    SAIDA.write_text(sql, "utf-8")
    print(f"{len(linhas)} alimentos gravados em {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
