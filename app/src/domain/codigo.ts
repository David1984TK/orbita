// Código de verificación que llega por WhatsApp.
//
// Son 6 dígitos. Esta lógica vive aparte de la pantalla para poder probarla sin
// interfaz; la comprobación real del código la hace el servidor, nunca la app.

export const LARGO_CODIGO = 6;

/**
 * Deja solo los dígitos del código, hasta 6.
 *
 * Acepta lo que la gente pega desde el mensaje: "492 716" o "492-716".
 */
export function normalizarCodigo(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, LARGO_CODIGO);
}

export function esCodigoCompleto(texto: string): boolean {
  return normalizarCodigo(texto).length === LARGO_CODIGO;
}

/**
 * Cuenta atrás con el formato del diseño: 42 → "0:42", 60 → "1:00".
 * Un valor negativo se trata como cero.
 */
export function formatearCuentaAtras(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const resto = String(total % 60).padStart(2, '0');
  return `${minutos}:${resto}`;
}
