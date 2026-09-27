import React from 'react';

interface PrintSheetProps {
  paciente: string;
  clinica?: string;
  documento: string;
  /** Classes do conteúdo (ex.: espaçamento entre as seções) */
  className?: string;
  children: React.ReactNode;
}

/**
 * Envolve o conteúdo de um documento impresso numa tabela cujo <tfoot> traz o nome
 * do paciente. O navegador repete o <tfoot> no pé de todas as páginas e reserva
 * espaço para ele, o que identifica folhas soltas sem cobrir o conteúdo. Na tela,
 * o rodapé fica oculto.
 */
export const PrintSheet: React.FC<PrintSheetProps> = ({ paciente, clinica, documento, className, children }) => (
  <table className="print-folha">
    <tfoot className="print-rodape">
      <tr>
        <td>
          <div>
            <span>Paciente: {paciente}</span>
            <span>
              {documento}
              {clinica ? ` • ${clinica}` : ''}
            </span>
          </div>
        </td>
      </tr>
    </tfoot>
    <tbody>
      <tr>
        <td>
          <div className={className}>{children}</div>
        </td>
      </tr>
    </tbody>
  </table>
);
