/** Mantém só os dígitos. */
export const apenasDigitos = (valor: string) => valor.replace(/\D/g, '');

/** Máscara 000.000.000-00 enquanto digita. */
export function mascararCPF(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/** Confere os dois dígitos verificadores do CPF. */
export function cpfValido(valor: string): boolean {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (base: string, pesoInicial: number) => {
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(cpf.slice(0, 9), 10) === Number(cpf[9]) && digito(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

/** Número do CRN só com dígitos e o sufixo /P de inscrição provisória (ex.: "12345/P"). */
export function normalizarNumeroCRN(valor: string): string {
  const limpo = valor.toUpperCase().replace(/[^0-9/P]/g, '');
  const m = /^(\d{1,7})(\/?P)?/.exec(limpo);
  if (!m) return '';
  return m[1] + (m[2] ? '/P' : '');
}

export const numeroCRNValido = (valor: string) => /^[0-9]{1,7}(\/P)?$/.test(valor);

export const REGIOES_CRN = Array.from({ length: 11 }, (_, i) => i + 1);
