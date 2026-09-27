/**
 * Converte a data de uma consulta para Date (meia-noite local).
 * Aceita 'DD/MM/AAAA' (formato das consultas) e 'AAAA-MM-DD'.
 */
export function parseDataConsulta(data: string): Date | null {
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return null;
}

/** Data local no formato AAAA-MM-DD (não usa UTC, então não "vira o dia" às 21h no Brasil). */
export function dataLocalISO(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Data de hoje (fuso local) no formato AAAA-MM-DD. */
export function hojeLocalISO(): string {
  return dataLocalISO(new Date());
}
