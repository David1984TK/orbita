// La persona puede estar en varios círculos a la vez. Estas funciones manejan la
// lista: cuál es el que se está viendo, cómo se actualiza uno y cómo se agrega
// otro, sin modificar nunca la lista original.

import type { MiCirculo } from './circulo';
import type { CirculoEnFormacion } from './formacion';

/**
 * El círculo que se está viendo: el que tiene ese identificador o, si no existe
 * (o todavía no se eligió ninguno), el primero. `null` si no hay ninguno.
 */
export function elegirActual(circulos: MiCirculo[], actualId: string | null): MiCirculo | null {
  return circulos.find((c) => c.circulo.id === actualId) ?? circulos[0] ?? null;
}

/** La lista con ese círculo cambiado (por ejemplo, después de aportar). */
export function conCirculoActualizado(circulos: MiCirculo[], actualizado: MiCirculo): MiCirculo[] {
  return circulos.map((c) => (c.circulo.id === actualizado.circulo.id ? actualizado : c));
}

/**
 * La lista con otro círculo al final. Si ya estaba (el mismo identificador), lo
 * reemplaza en su lugar en vez de repetirlo.
 */
export function conCirculoAgregado(circulos: MiCirculo[], nuevo: MiCirculo): MiCirculo[] {
  return circulos.some((c) => c.circulo.id === nuevo.circulo.id)
    ? conCirculoActualizado(circulos, nuevo)
    : [...circulos, nuevo];
}

/**
 * Los círculos que todavía se están llenando, sin los que ya aparecen en curso:
 * cuando uno se llena y arranca puede seguir apareciendo en las dos listas un
 * momento, y no debe verse dos veces.
 */
export function enFormacionPendientes(
  enFormacion: CirculoEnFormacion[],
  circulos: MiCirculo[],
): CirculoEnFormacion[] {
  return enFormacion.filter((f) => !circulos.some((c) => c.circulo.id === f.id));
}
