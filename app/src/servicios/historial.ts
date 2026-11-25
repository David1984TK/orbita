// El historial de la persona.
//
// El historial sale de lo que quedó registrado en los contratos (Etapa 1) y se
// lee a través del servidor (Etapa 3). Mientras tanto la app habla con esta
// interfaz y detrás hay una versión simulada solo para desarrollo.

import type { Historial } from '../domain';

export type Historiales = {
  /**
   * El historial de la persona. Lanza un error si no se pudo consultar (sin
   * internet, servidor caído).
   */
  obtenerMiHistorial(): Promise<Historial>;
};

/**
 * Un historial de ejemplo: un círculo completado y cinco cuotas del actual, todas
 * a tiempo, en el nivel Básico. Los niveles y el puntaje máximo son de ejemplo;
 * los reales los define el contrato.
 */
export function historialDeEjemplo(): Historial {
  return {
    puntaje: 340,
    puntajeMaximo: 1000,
    nivel: { nombre: 'Básico', cobraDesdeTurno: 5 },
    siguienteNivel: { nombre: 'Sólido', cobraDesdeTurno: 3 },
    pagosATiempo: 20,
    pagosTotales: 20,
    circulosCompletados: 1,
    ahorrado: 12000,
    moneda: 'pesos',
  };
}

const simulados: Historiales = {
  async obtenerMiHistorial() {
    return historialDeEjemplo();
  },
};

// Fuera de desarrollo no hay de dónde leer el historial, así que falla. Es a
// propósito: una versión instalable no debe enseñar un historial inventado como
// si fuera el de la persona.
const sinContratos: Historiales = {
  async obtenerMiHistorial() {
    throw new Error('Todavía no hay de dónde leer el historial.');
  },
};

export function crearHistoriales(esDesarrollo: boolean = __DEV__): Historiales {
  return esDesarrollo ? simulados : sinContratos;
}
