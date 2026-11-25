// Los círculos de la persona.
//
// Los contratos y el servidor todavía no existen (Etapas 1 y 3). Mientras tanto
// la app habla con esta interfaz y detrás hay una versión simulada solo para
// desarrollo. Cuando haya de dónde leer el círculo se cambia la implementación
// y las pantallas no se enteran.

import type { BorradorDeCirculo, Circulo, Integrante, MiCirculo } from '../domain';

export type MotivoDeFalloDeCreacion =
  /** La persona cerró el Face ID o la huella sin confirmar. No es un error. */
  | 'cancelada'
  /** Cualquier otra cosa: sin conexión, fallo del sistema, etc. */
  | 'error';

export type ResultadoDeCreacion = { ok: true } | { ok: false; motivo: MotivoDeFalloDeCreacion };

export type Circulos = {
  /**
   * El círculo de la persona, o `null` si todavía no está en ninguno. Lanza un
   * error si no se pudo consultar (sin internet, servidor caído).
   */
  obtenerMiCirculo(): Promise<MiCirculo | null>;
  /**
   * Crea un círculo con lo que la persona eligió, pidiendo la confirmación
   * biométrica (crear un círculo es firmar con su llave). Devuelve el resultado
   * para lo esperado (cancelar, fallar); lanza solo ante lo inesperado. Invitar
   * a las demás integrantes es un paso aparte, que todavía no existe.
   */
  crearCirculo(borrador: BorradorDeCirculo): Promise<ResultadoDeCreacion>;
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
  async crearCirculo() {
    return { ok: true };
  },
};

// Fuera de desarrollo no hay de dónde leer el círculo ni con qué crearlo, así
// que falla. Es a propósito: una versión instalable no debe enseñar un círculo
// inventado como si fuera el dinero de la persona, ni decir que creó uno.
const sinContratos: Circulos = {
  async obtenerMiCirculo() {
    throw new Error('Todavía no hay de dónde leer los círculos.');
  },
  async crearCirculo() {
    throw new Error('Todavía no hay contratos con los que crear círculos.');
  },
};

export function crearCirculos(esDesarrollo: boolean = __DEV__): Circulos {
  return esDesarrollo ? simulados : sinContratos;
}
