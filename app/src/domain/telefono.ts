// Teléfonos de México.
//
// El número es la identidad de la persona en Órbita, como en WhatsApp: no hay
// correo ni contraseña. Por eso esta lógica vive aparte de la pantalla.
//
// Un número mexicano son 10 dígitos (lada + número). Desde 2019 ya no se marca
// el 044/045 antes de un celular, así que no hay que tratar prefijos viejos.

export const LARGO_TELEFONO = 10;

const LADA_PAIS = '52';

/**
 * Deja solo los 10 dígitos del número, sin espacios, guiones ni la lada del país.
 *
 * Acepta lo que la gente escribe o pega: "55 1234-5678", "(55) 1234 5678" o
 * "+52 55 1234 5678".
 */
export function normalizarTelefono(texto: string): string {
  let digitos = texto.replace(/\D/g, '');

  // La lada del país solo se quita cuando el número llega completo (12 dígitos:
  // "52" + 10). Un número de 10 dígitos que casualmente empieza con 52 es un
  // número válido y no se toca.
  if (digitos.length === LARGO_TELEFONO + LADA_PAIS.length && digitos.startsWith(LADA_PAIS)) {
    digitos = digitos.slice(LADA_PAIS.length);
  }

  return digitos.slice(0, LARGO_TELEFONO);
}

/**
 * Cómo se muestra el número en pantalla: "55 1234 5678".
 *
 * Recibe los dígitos ya normalizados. No deja un espacio al final: si lo
 * dejara, al borrar un dígito el cursor se atoraría en ese espacio.
 */
export function formatearTelefono(digitos: string): string {
  return [digitos.slice(0, 2), digitos.slice(2, 6), digitos.slice(6, 10)]
    .filter((grupo) => grupo.length > 0)
    .join(' ');
}

/** Un teléfono es válido cuando tiene sus 10 dígitos completos. */
export function esTelefonoValido(texto: string): boolean {
  return normalizarTelefono(texto).length === LARGO_TELEFONO;
}
