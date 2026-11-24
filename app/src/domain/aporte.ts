// El aporte semanal: cuánto se paga en total y cómo queda el círculo después.

import type { Circulo } from './circulo';
import { miIntegrante } from './rueda';

/**
 * Comisión de depósito: 0.5% de la cuota. Sale del diseño; si cambia, cambia
 * aquí y en el contrato.
 */
export const COMISION_DE_DEPOSITO = 0.005;

/** La comisión como se escribe en pantalla: 0.005 → "0.5". */
export const PORCENTAJE_DE_COMISION = String(Math.round(COMISION_DE_DEPOSITO * 1000) / 10);

export type DesgloseDeAporte = {
  /** Lo que llega al círculo: la cuota completa. */
  aCirculo: number;
  /** La comisión de depósito, que se cobra aparte y nunca sale de la cuota. */
  comision: number;
  /** Lo que se descuenta de la cuenta: la cuota más la comisión. */
  total: number;
};

/**
 * Desglosa un aporte. La cuenta se hace en centavos enteros para que 0.1 + 0.2
 * no dé 0.30000000000000004 en un monto de dinero; si la comisión cae a media
 * fracción de centavo, se redondea hacia arriba.
 */
export function desgloseDeAporte(cuota: number): DesgloseDeAporte {
  const centavosDeCuota = Math.round(cuota * 100);
  const centavosDeComision = Math.round(centavosDeCuota * COMISION_DE_DEPOSITO);
  return {
    aCirculo: centavosDeCuota / 100,
    comision: centavosDeComision / 100,
    total: (centavosDeCuota + centavosDeComision) / 100,
  };
}

/**
 * El círculo después de que `yoId` aporta la cuota de esta semana: queda al día
 * y suma una cuota. No modifica el original.
 *
 * Lanza un error si ya estaba al día: una cuota no se paga dos veces.
 */
export function registrarAporte(circulo: Circulo, yoId: string): Circulo {
  const yo = miIntegrante(circulo, yoId);
  if (yo.estado === 'alDia') {
    throw new Error(`"${yoId}" ya aportó la cuota de la semana ${circulo.semanaActual}.`);
  }
  return {
    ...circulo,
    integrantes: circulo.integrantes.map((integrante) =>
      integrante.id === yoId
        ? { ...integrante, estado: 'alDia', cuotasPagadas: integrante.cuotasPagadas + 1 }
        : integrante,
    ),
  };
}
