// La rueda: en qué semana va el círculo y cuándo le toca cobrar a cada quien.
//
// Todo lo que muestra la pantalla "Mi círculo" se calcula aquí, aparte de la
// interfaz, para poder probarlo con números a la vista. El turno de cada
// integrante es la semana en la que cobra (turno 13 = cobra en la semana 13).

import type { Circulo, Integrante } from './circulo';
import { sumarDias } from './formato';

/** Busca a la integrante que está mirando. Lanza un error si no está en el círculo. */
export function miIntegrante(circulo: Circulo, yoId: string): Integrante {
  const yo = circulo.integrantes.find((integrante) => integrante.id === yoId);
  if (yo === undefined) {
    throw new Error(`La integrante "${yoId}" no está en el círculo "${circulo.id}".`);
  }
  return yo;
}

/** Día en que vence la cuota de una semana (1 = la primera). */
export function fechaDeSemana(circulo: Circulo, semana: number): string {
  return sumarDias(circulo.inicio, (semana - 1) * 7);
}

/**
 * Cada segmento de la rueda es una semana:
 *   - `cobraron`: la semana ya empezó, así que su integrante ya cobró (o cobra hoy)
 *   - `tuTurno`:  la semana en la que cobras tú
 *   - `faltan`:   las semanas que todavía no llegan
 *
 * Tu turno siempre se marca como tuyo, aunque ya haya pasado.
 */
export type EstadoSegmento = 'cobraron' | 'tuTurno' | 'faltan';

export function segmentosDeLaRueda(circulo: Circulo, yoId: string): EstadoSegmento[] {
  const miTurno = miIntegrante(circulo, yoId).turno;
  return Array.from({ length: circulo.integrantes.length }, (_, i): EstadoSegmento => {
    const semana = i + 1;
    if (semana === miTurno) {
      return 'tuTurno';
    }
    return semana <= circulo.semanaActual ? 'cobraron' : 'faltan';
  });
}

/** Cuándo cobra la persona, dicho de las tres formas en que puede estar. */
export type ResumenDeMiTurno =
  | { tipo: 'faltan'; semana: number; semanasRestantes: number; fecha: string }
  | { tipo: 'estaSemana'; semana: number; fecha: string }
  | { tipo: 'yaCobraste'; semana: number };

export function resumenDeMiTurno(circulo: Circulo, yoId: string): ResumenDeMiTurno {
  const yo = miIntegrante(circulo, yoId);
  const semana = yo.turno;
  // Si ya retiró el bote, el turno pasó aunque sea esta misma semana.
  if (semana < circulo.semanaActual || yo.yaRetiro === true) {
    return { tipo: 'yaCobraste', semana };
  }
  const fecha = fechaDeSemana(circulo, semana);
  if (semana === circulo.semanaActual) {
    return { tipo: 'estaSemana', semana, fecha };
  }
  return { tipo: 'faltan', semana, semanasRestantes: semana - circulo.semanaActual, fecha };
}

export type ResumenDeAportes = {
  /** Cuotas que lleva aportadas. */
  cuotas: number;
  /** Cuotas que tiene el círculo en total. */
  totalDeCuotas: number;
  /** Lo aportado, en la moneda del círculo. */
  monto: number;
  /** `true` si va al día con la cuota de esta semana. */
  alDia: boolean;
  /** `true` si tiene la cuota de esta semana vencida. */
  atrasada: boolean;
  /** Día en que vence la cuota de esta semana. */
  vence: string;
};

export function resumenDeAportes(circulo: Circulo, yoId: string): ResumenDeAportes {
  const yo = miIntegrante(circulo, yoId);
  return {
    cuotas: yo.cuotasPagadas,
    totalDeCuotas: circulo.integrantes.length,
    monto: yo.cuotasPagadas * circulo.cuotaSemanal,
    alDia: yo.estado === 'alDia',
    atrasada: yo.estado === 'atrasado',
    vence: fechaDeSemana(circulo, circulo.semanaActual),
  };
}
