// Los círculos de la persona.
//
// Los contratos y el servidor todavía no existen (Etapas 1 y 3). Mientras tanto
// la app habla con esta interfaz y detrás hay una versión simulada solo para
// desarrollo. Cuando haya de dónde leer el círculo se cambia la implementación
// y las pantallas no se enteran.

import type {
  BorradorDeCirculo,
  Circulo,
  CirculoEnFormacion,
  Integrante,
  MiCirculo,
} from '../domain';

export type MotivoDeFalloDeCreacion =
  /** La persona cerró el Face ID o la huella sin confirmar. No es un error. */
  | 'cancelada'
  /** Cualquier otra cosa: sin conexión, fallo del sistema, etc. */
  | 'error';

export type ResultadoDeCreacion =
  | { ok: true; enFormacion: CirculoEnFormacion }
  | { ok: false; motivo: MotivoDeFalloDeCreacion };

export type Circulos = {
  /**
   * El círculo de la persona, o `null` si todavía no está en ninguno. Lanza un
   * error si no se pudo consultar (sin internet, servidor caído).
   */
  obtenerMiCirculo(): Promise<MiCirculo | null>;
  /**
   * Crea un círculo con lo que la persona eligió, pidiendo la confirmación
   * biométrica (crear un círculo es firmar con su llave). El círculo nace "en
   * formación": solo está quien lo creó, y arranca cuando entran todas. Devuelve
   * el resultado para lo esperado (cancelar, fallar); lanza solo ante lo
   * inesperado.
   */
  crearCirculo(borrador: BorradorDeCirculo): Promise<ResultadoDeCreacion>;
  /** Los círculos que la persona creó y todavía se están llenando. */
  obtenerCirculosEnFormacion(): Promise<CirculoEnFormacion[]>;
  /** Cómo va un círculo en formación: quién ya entró. Lanza un error si no se pudo consultar. */
  obtenerEnFormacion(id: string): Promise<CirculoEnFormacion>;
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

/** Un círculo en formación de ejemplo: solo está quien lo creó. */
export function formacionDeEjemplo(
  cambios: Partial<CirculoEnFormacion> = {},
): CirculoEnFormacion {
  return {
    id: 'los-del-mercado-nuevo',
    nombre: 'Los del mercado',
    moneda: 'pesos',
    cuotaSemanal: 600,
    integrantes: 10,
    participantes: [{ id: 'yo', nombre: 'David Nava' }],
    // El dominio "example" nunca existe: el enlace real lo entrega el servidor.
    enlace: 'https://orbita.example/c/los-del-mercado-nuevo',
    organizadorId: 'yo',
    ...cambios,
  };
}

// Quienes van entrando, en orden, a los círculos en formación de la versión simulada.
const QUIENES_ENTRAN = [
  'Rosa Martínez',
  'Julio Lara',
  'Ana Torres',
  'Carmen Ruiz',
  'Miguel Gómez',
  'Tere Aguilar',
  'Sergio Ramos',
  'Elena Vargas',
  'Pedro Salas',
  'Lucía Ortega',
  'Marcos Díaz',
  'Beto Ibarra',
  'Paty Núñez',
  'Luis Cano',
];

/** Convierte un nombre en algo que sirva de identificador: "Los del mercado" → "los-del-mercado". */
function identificadorDe(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// La versión simulada guarda en memoria los círculos que se crean, y en cada
// consulta de avance entra una persona más, para poder ver cómo se llena el
// círculo sin servidor.
function crearSimulados(): Circulos {
  const enFormacion: CirculoEnFormacion[] = [];

  return {
    async obtenerMiCirculo() {
      return circuloDeEjemplo();
    },
    async crearCirculo(borrador) {
      const numero = enFormacion.length + 1;
      const id = `${identificadorDe(borrador.nombre) || 'circulo'}-${numero}`;
      const nuevo = formacionDeEjemplo({
        id,
        nombre: borrador.nombre,
        moneda: borrador.moneda,
        cuotaSemanal: borrador.cuota,
        integrantes: borrador.integrantes,
        enlace: `https://orbita.example/c/${id}`,
      });
      enFormacion.push(nuevo);
      return { ok: true, enFormacion: nuevo };
    },
    async obtenerCirculosEnFormacion() {
      return enFormacion.map((c) => ({ ...c, participantes: [...c.participantes] }));
    },
    async obtenerEnFormacion(id) {
      const indice = enFormacion.findIndex((c) => c.id === id);
      if (indice === -1) {
        throw new Error(`No existe el círculo en formación "${id}".`);
      }
      const actual = enFormacion[indice];
      if (actual.participantes.length < actual.integrantes) {
        const nombre = QUIENES_ENTRAN[(actual.participantes.length - 1) % QUIENES_ENTRAN.length];
        enFormacion[indice] = {
          ...actual,
          participantes: [...actual.participantes, { id: `entro-${actual.participantes.length}`, nombre }],
        };
      }
      const despues = enFormacion[indice];
      return { ...despues, participantes: [...despues.participantes] };
    },
  };
}

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
  async obtenerCirculosEnFormacion() {
    throw new Error('Todavía no hay de dónde leer los círculos en formación.');
  },
  async obtenerEnFormacion() {
    throw new Error('Todavía no hay de dónde leer los círculos en formación.');
  },
};

export function crearCirculos(esDesarrollo: boolean = __DEV__): Circulos {
  return esDesarrollo ? crearSimulados() : sinContratos;
}
