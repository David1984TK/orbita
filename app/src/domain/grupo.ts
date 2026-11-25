// El grupo: quién va al día, quién cobra esta semana y cómo se muestra cada
// integrante. Es la vigilancia mutua del círculo: se ve quién pagó y quién no,
// sin ambigüedad.

import type { Circulo, EstadoPago, Integrante } from './circulo';

/** "Rosa Martínez" → "RM". Con un solo nombre, una sola letra. */
export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0)
    .slice(0, 2)
    // Se separa con [...] y no con [0] para no partir letras de varios bytes.
    .map((palabra) => [...palabra][0].toUpperCase())
    .join('');
}

export type ResumenDelGrupo = {
  alDia: number;
  pendientes: number;
  atrasados: number;
};

/** Cuántas integrantes hay en cada estado de pago. */
export function resumenDelGrupo(circulo: Circulo): ResumenDelGrupo {
  const cuantas = (estado: EstadoPago) =>
    circulo.integrantes.filter((integrante) => integrante.estado === estado).length;
  return {
    alDia: cuantas('alDia'),
    pendientes: cuantas('pendiente'),
    atrasados: cuantas('atrasado'),
  };
}

/**
 * "14 al día, 1 atrasado". Los estados que no tiene nadie no se nombran, y si
 * todas van al día se dice así.
 */
export function textoDelResumen({ alDia, pendientes, atrasados }: ResumenDelGrupo): string {
  if (pendientes === 0 && atrasados === 0) {
    return 'Todos al día';
  }
  const partes = [`${alDia} al día`];
  if (pendientes > 0) {
    partes.push(pendientes === 1 ? '1 pendiente' : `${pendientes} pendientes`);
  }
  if (atrasados > 0) {
    partes.push(atrasados === 1 ? '1 atrasado' : `${atrasados} atrasados`);
  }
  return partes.join(', ');
}

/** Quien cobra esta semana, si el turno de alguien coincide con la semana en curso. */
export function quienCobra(circulo: Circulo): Integrante | undefined {
  return circulo.integrantes.find((integrante) => integrante.turno === circulo.semanaActual);
}

/** La lista del grupo: primero tú y luego las demás por orden de turno. */
export function integrantesOrdenados(circulo: Circulo, yoId: string): Integrante[] {
  const yo = circulo.integrantes.filter((integrante) => integrante.id === yoId);
  const demas = circulo.integrantes
    .filter((integrante) => integrante.id !== yoId)
    .sort((a, b) => a.turno - b.turno);
  return [...yo, ...demas];
}

export type TonoDeEstado = 'alDia' | 'pendiente' | 'atrasado';

/** La etiqueta de pago de una integrante: "Al día", "Pendiente" o "3 días tarde". */
export function etiquetaDeEstado(integrante: Integrante): { texto: string; tono: TonoDeEstado } {
  switch (integrante.estado) {
    case 'alDia':
      return { texto: 'Al día', tono: 'alDia' };
    case 'pendiente':
      return { texto: 'Pendiente', tono: 'pendiente' };
    case 'atrasado': {
      const dias = integrante.diasDeAtraso;
      if (dias === undefined) {
        return { texto: 'Atrasado', tono: 'atrasado' };
      }
      return { texto: dias === 1 ? '1 día tarde' : `${dias} días tarde`, tono: 'atrasado' };
    }
  }
}
