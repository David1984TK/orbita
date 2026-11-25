// El historial de la persona: lo que ha hecho en Órbita y lo que eso le
// desbloquea. Es el "puntaje" del plan, pero en pantalla no se llama así: se
// explica por lo que desbloquea, no por el número.
//
// Los niveles y sus umbrales los define el contrato (la regla es
// `exposición neta ≤ límite(score)`), así que la app no los calcula: los recibe
// ya resueltos y solo los muestra.

import type { Moneda } from './circulo';

export type Nivel = {
  nombre: string;
  /** El turno más temprano desde el que este nivel deja cobrar. */
  cobraDesdeTurno: number;
};

export type Historial = {
  puntaje: number;
  /** El puntaje más alto posible, para dibujar el medidor. */
  puntajeMaximo: number;
  nivel: Nivel;
  /** El nivel que sigue; falta si ya está en el más alto. */
  siguienteNivel?: Nivel;
  pagosATiempo: number;
  pagosTotales: number;
  circulosCompletados: number;
  /** Lo ahorrado en total con Órbita, en `moneda`. */
  ahorrado: number;
  moneda: Moneda;
};

/** Qué parte del medidor se llena: de 0 a 1, aunque el puntaje se salga del rango. */
export function fraccionDelPuntaje(puntaje: number, puntajeMaximo: number): number {
  if (!(puntajeMaximo > 0)) {
    return 0;
  }
  return Math.min(1, Math.max(0, puntaje / puntajeMaximo));
}
