// Formato de montos y fechas para mostrar en pantalla, en español de México.
//
// Se hace a mano y no con `Intl`: en Android el motor de JavaScript trae un
// `Intl` recortado y un mismo dato podría verse distinto según el teléfono.

import type { Moneda } from './circulo';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Convierte "AAAA-MM-DD" en una fecha UTC. Lanza un error si no es una fecha real. */
function leerFecha(iso: string): Date {
  const coincide = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (coincide === null) {
    throw new Error(`Fecha inválida: "${iso}". Se esperaba AAAA-MM-DD.`);
  }
  const [, anio, mes, dia] = coincide;
  const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  // Rechaza fechas que JavaScript "corrige" en silencio, como el 31 de febrero.
  if (fecha.toISOString().slice(0, 10) !== iso) {
    throw new Error(`Fecha inválida: "${iso}". Ese día no existe.`);
  }
  return fecha;
}

/** Suma (o resta) días a una fecha "AAAA-MM-DD". */
export function sumarDias(iso: string, dias: number): string {
  const fecha = leerFecha(iso);
  return new Date(fecha.getTime() + dias * MS_POR_DIA).toISOString().slice(0, 10);
}

/** "2026-10-20" → "20 de octubre". */
export function formatearFecha(iso: string): string {
  const fecha = leerFecha(iso);
  return `${fecha.getUTCDate()} de ${MESES[fecha.getUTCMonth()]}`;
}

/** "2026-09-08" → "martes 8 de septiembre". */
export function formatearFechaConDia(iso: string): string {
  const fecha = leerFecha(iso);
  return `${DIAS[fecha.getUTCDay()]} ${formatearFecha(iso)}`;
}

/**
 * 9000 → "$9,000"; 603.5 → "$603.50".
 *
 * Los enteros van sin centavos. Los pesos llevan "$" y los dólares "US$", para
 * que nunca se confundan en un círculo en dólares.
 */
export function formatearMonto(monto: number, moneda: Moneda): string {
  const signo = monto < 0 ? '−' : '';
  const absoluto = Math.abs(monto);
  const [enteros, centavos] = (Number.isInteger(absoluto)
    ? absoluto.toString()
    : absoluto.toFixed(2)
  ).split('.');
  const conComas = enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const simbolo = moneda === 'dolares' ? 'US$' : '$';
  return `${signo}${simbolo}${conComas}${centavos !== undefined ? `.${centavos}` : ''}`;
}
