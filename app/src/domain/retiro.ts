// El retiro: lo que recibe quien cobra en su turno, después de las comisiones.

import type { Circulo, Moneda } from './circulo';
import { boteDelCirculo } from './circulo';
import { miIntegrante } from './rueda';

/**
 * Comisión de Órbita: 1% de lo que se recibe (el bote). Sale del diseño; si
 * cambia, cambia aquí y en el contrato.
 */
export const COMISION_ORBITA = 0.01;

/** La comisión de Órbita como se escribe en pantalla: 0.01 → "1". */
export const PORCENTAJE_COMISION_ORBITA = String(Math.round(COMISION_ORBITA * 1000) / 10);

/**
 * Comisión de retiro: $45 fijos, en pesos. Sale del diseño y está pensada solo
 * para pesos: en un círculo en dólares no hay una cifra definida, así que ahí
 * no se ofrece el retiro (ver `puedeRetirar`).
 */
export const COMISION_DE_RETIRO = 45;

export type DesgloseDeRetiro = {
  /** Lo que juntó el círculo para esta persona. */
  bote: number;
  /** Comisión de Órbita, sobre el bote. */
  comisionOrbita: number;
  /** Comisión de retiro, fija. */
  comisionDeRetiro: number;
  /** Lo que llega a la persona: el bote menos las dos comisiones. */
  recibes: number;
};

/**
 * Desglosa un retiro. La cuenta se hace en centavos enteros para que no haya
 * errores de decimales; si la comisión cae a media fracción de centavo, se
 * redondea hacia arriba. Lanza un error en un círculo en dólares, donde la
 * comisión de retiro todavía no está definida.
 */
export function desgloseDeRetiro(bote: number, moneda: Moneda): DesgloseDeRetiro {
  if (moneda !== 'pesos') {
    throw new Error('La comisión de retiro solo está definida en pesos.');
  }
  const centavosDelBote = Math.round(bote * 100);
  const centavosDeOrbita = Math.round(centavosDelBote * COMISION_ORBITA);
  const centavosDeRetiro = COMISION_DE_RETIRO * 100;
  return {
    bote: centavosDelBote / 100,
    comisionOrbita: centavosDeOrbita / 100,
    comisionDeRetiro: COMISION_DE_RETIRO,
    recibes: (centavosDelBote - centavosDeOrbita - centavosDeRetiro) / 100,
  };
}

/** Todo lo que se pide para retirar, salvo la espera de seguridad. */
function esMomentoDeRetirar(circulo: Circulo, yoId: string): boolean {
  const yo = miIntegrante(circulo, yoId);
  if (yo.turno !== circulo.semanaActual || yo.yaRetiro === true || circulo.moneda !== 'pesos') {
    return false;
  }
  return desgloseDeRetiro(boteDelCirculo(circulo), circulo.moneda).recibes > 0;
}

/**
 * Hasta cuándo no puede retirar la persona, si ahora mismo está en la espera de
 * seguridad que sigue a recuperar el acceso. `null` si no hay espera (o ya pasó).
 */
export function esperaDeRetiro(circulo: Circulo, yoId: string, ahora: Date = new Date()): Date | null {
  const hasta = miIntegrante(circulo, yoId).retiroCongeladoHasta;
  if (hasta === undefined) {
    return null;
  }
  const fecha = new Date(hasta);
  return fecha.getTime() > ahora.getTime() ? fecha : null;
}

/**
 * ¿Se le ofrece retirar a esta persona? Solo en la semana de su turno, si aún
 * no retiró, si el círculo es en pesos, si después de las comisiones le queda
 * algo y si no está en la espera de seguridad de después de recuperar el acceso.
 *
 * Qué pasa con quien no retira en su semana (¿sigue disponible?, ¿se acumula?)
 * lo decide el contrato; mientras tanto no se ofrece.
 */
export function puedeRetirar(circulo: Circulo, yoId: string, ahora: Date = new Date()): boolean {
  return esMomentoDeRetirar(circulo, yoId) && esperaDeRetiro(circulo, yoId, ahora) === null;
}

/**
 * Si es su momento de retirar pero la espera de seguridad se lo impide, hasta
 * cuándo. `null` en cualquier otro caso.
 */
export function retiroEnEspera(circulo: Circulo, yoId: string, ahora: Date = new Date()): Date | null {
  return esMomentoDeRetirar(circulo, yoId) ? esperaDeRetiro(circulo, yoId, ahora) : null;
}

/**
 * El círculo después de que `yoId` retira su bote. No modifica el original.
 * Lanza un error si ya había retirado: el bote no se cobra dos veces.
 */
export function registrarRetiro(circulo: Circulo, yoId: string): Circulo {
  const yo = miIntegrante(circulo, yoId);
  if (yo.yaRetiro === true) {
    throw new Error(`"${yoId}" ya retiró el bote de la semana ${yo.turno}.`);
  }
  return {
    ...circulo,
    integrantes: circulo.integrantes.map((integrante) =>
      integrante.id === yoId ? { ...integrante, yaRetiro: true } : integrante,
    ),
  };
}

/**
 * El círculo con la espera de seguridad puesta a `yoId`: no puede retirar hasta
 * `hasta` (fecha y hora ISO). No modifica el original. Es lo que se aplica al
 * recuperar el acceso, mientras el servidor no entregue el círculo ya con ella.
 */
export function ponerEsperaDeRetiro(circulo: Circulo, yoId: string, hasta: string): Circulo {
  miIntegrante(circulo, yoId);
  return {
    ...circulo,
    integrantes: circulo.integrantes.map((integrante) =>
      integrante.id === yoId ? { ...integrante, retiroCongeladoHasta: hasta } : integrante,
    ),
  };
}
