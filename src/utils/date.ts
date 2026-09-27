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
