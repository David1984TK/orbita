// Los círculos de la persona.
//
// Los contratos y el servidor todavía no existen (Etapas 1 y 3). Mientras tanto
// la app habla con esta interfaz y detrás hay una versión simulada solo para
// desarrollo. Cuando haya de dónde leer el círculo se cambia la implementación
// y las pantallas no se enteran.

import type { Circulo, Integrante, MiCirculo } from '../domain';

export type Circulos = {
  /**
   * El círculo de la persona. Lanza un error si no se pudo consultar (sin
   * internet, servidor caído).
   */
  obtenerMiCirculo(): Promise<MiCirculo>;
};

const NOMBRES = [
  'Marcos Díaz',
  'Lucía Ortega',
  'Pedro Salas',
  'Elena Vargas',
  'Sergio Ramos',
  'Rosa Martínez',
  'Julio Lara',
  'Carmen Ruiz',
  'Miguel Gómez',
  'Ana Torres',
  'Tere Aguilar',
  'David Nava',
  'Beto Ibarra',
  'Paty Núñez',
  'Luis Cano',
];

const SEMANA_ACTUAL = 6;
const TURNO_DE_CARMEN = 8;
const MI_TURNO = 12;

/** Un círculo de ejemplo: 15 personas, $600 a la semana, en la semana 6. */
export function circuloDeEjemplo(): MiCirculo {
  const integrantes: Integrante[] = NOMBRES.map((nombre, i) => {
    const turno = i + 1;
    const soyYo = turno === MI_TURNO;
    const atrasada = turno === TURNO_DE_CARMEN;
    return {
      id: soyYo ? 'yo' : `integrante-${turno}`,
      nombre,
      turno,
      // Yo todavía no pago esta semana; una integrante va atrasada.
      estado: soyYo ? 'pendiente' : atrasada ? 'atrasado' : 'alDia',
      cuotasPagadas: soyYo || atrasada ? SEMANA_ACTUAL - 1 : SEMANA_ACTUAL,
      ...(atrasada ? { diasDeAtraso: 3 } : {}),
    };
  });

  const circulo: Circulo = {
    id: 'los-del-mercado',
    nombre: 'Los del mercado',
    moneda: 'pesos',
    cuotaSemanal: 600,
    integrantes,
    semanaActual: SEMANA_ACTUAL,
    inicio: '2026-10-26',
  };

  return { circulo, yoId: 'yo' };
}

const simulados: Circulos = {
  async obtenerMiCirculo() {
    return circuloDeEjemplo();
  },
};

// Fuera de desarrollo no hay de dónde leer el círculo, así que falla. Es a
// propósito: una versión instalable no debe enseñar un círculo inventado como
// si fuera el dinero de la persona.
const sinContratos: Circulos = {
  async obtenerMiCirculo() {
    throw new Error('Todavía no hay de dónde leer los círculos.');
  },
};

export function crearCirculos(esDesarrollo: boolean = __DEV__): Circulos {
  return esDesarrollo ? simulados : sinContratos;
}
