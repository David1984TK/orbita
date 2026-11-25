// Crear un círculo: lo que la persona elige y cómo se valida y se resume.

import type { Moneda } from './circulo';
import { boteDelCirculo } from './circulo';
import { sumarDias } from './formato';

/** Un círculo es de 5 a 15 personas (README: "un grupo de 5 a 15 personas"). */
export const MIN_INTEGRANTES = 5;
export const MAX_INTEGRANTES = 15;
export const MAX_NOMBRE = 40;
/** Hasta $999,999 de cuota semanal. */
export const MAX_DIGITOS_CUOTA = 6;

/**
 * Monedas en las que se puede crear un círculo. Los dólares están en el diseño
 * pero todavía no: no tienen definidas las comisiones (la de retiro es fija en
 * pesos), y un círculo en dólares donde no se pudiera retirar sería una trampa.
 */
export const MONEDAS_DISPONIBLES: readonly Moneda[] = ['pesos'];

export type BorradorDeCirculo = {
  nombre: string;
  integrantes: number;
  /** Lo que cada integrante aporta por semana. */
  cuota: number;
  moneda: Moneda;
};

/** Deja solo los dígitos de la cuota, sin ceros a la izquierda y hasta 6 dígitos. */
export function normalizarCuota(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, MAX_DIGITOS_CUOTA).replace(/^0+/, '');
}

/** La cuota como número: 0 si no hay nada escrito. */
export function cuotaDeTexto(texto: string): number {
  const digitos = normalizarCuota(texto);
  return digitos === '' ? 0 : Number(digitos);
}

/** Sube o baja el número de integrantes sin salirse del rango permitido. */
export function ajustarIntegrantes(actual: number, cambio: number): number {
  return Math.min(MAX_INTEGRANTES, Math.max(MIN_INTEGRANTES, actual + cambio));
}

export type ErroresDelBorrador = {
  nombre?: string;
  integrantes?: string;
  cuota?: string;
  moneda?: string;
};

/** Qué le falta o qué está mal en lo que la persona eligió. Vacío si todo está bien. */
export function validarBorrador(borrador: BorradorDeCirculo): ErroresDelBorrador {
  const errores: ErroresDelBorrador = {};
  const nombre = borrador.nombre.trim();
  if (nombre === '') {
    errores.nombre = 'Ponle un nombre a tu círculo.';
  } else if (nombre.length > MAX_NOMBRE) {
    errores.nombre = `El nombre puede tener hasta ${MAX_NOMBRE} letras.`;
  }
  if (
    !Number.isInteger(borrador.integrantes) ||
    borrador.integrantes < MIN_INTEGRANTES ||
    borrador.integrantes > MAX_INTEGRANTES
  ) {
    errores.integrantes = `Un círculo es de ${MIN_INTEGRANTES} a ${MAX_INTEGRANTES} integrantes.`;
  }
  if (!Number.isFinite(borrador.cuota) || borrador.cuota <= 0) {
    errores.cuota = 'Escribe cuánto aporta cada integrante por semana.';
  }
  if (!MONEDAS_DISPONIBLES.includes(borrador.moneda)) {
    errores.moneda = 'Por ahora los círculos son en pesos.';
  }
  return errores;
}

export function esBorradorValido(borrador: BorradorDeCirculo): boolean {
  return Object.keys(validarBorrador(borrador)).length === 0;
}

export type ResumenDelBorrador = {
  cuota: number;
  /** Cuántas semanas dura: una por integrante. */
  semanas: number;
  /** Lo que recibe cada quien en su turno. */
  bote: number;
  /** Cuándo termina el círculo si arranca `hoy`. */
  termina: string;
};

/**
 * Cómo queda el círculo con lo elegido. La fecha de fin supone que arranca hoy:
 * dura una semana por integrante. La real depende de cuándo se llene el círculo.
 */
export function resumenDelBorrador(borrador: BorradorDeCirculo, hoy: string): ResumenDelBorrador {
  const bote = boteDelCirculo({
    id: '',
    nombre: borrador.nombre,
    moneda: borrador.moneda,
    cuotaSemanal: borrador.cuota,
    integrantes: Array.from({ length: borrador.integrantes }, (_, i) => ({
      id: String(i),
      nombre: '',
      turno: i + 1,
      estado: 'pendiente' as const,
      cuotasPagadas: 0,
    })),
    semanaActual: 1,
    inicio: hoy,
  });
  return {
    cuota: borrador.cuota,
    semanas: borrador.integrantes,
    bote,
    termina: sumarDias(hoy, borrador.integrantes * 7),
  };
}
