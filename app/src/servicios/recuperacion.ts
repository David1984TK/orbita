// Recuperar el acceso cuando se pierde el teléfono, y confirmar a quien lo pide.
//
// La comparación de la selfie la hace el proveedor de verificación de identidad
// (Etapa 3), y las confirmaciones del grupo y la espera de 72 horas las hace
// cumplir el contrato (Etapa 1). Mientras tanto la app habla con esta interfaz y
// detrás hay una versión simulada solo para desarrollo.

import type { Confirmacion } from '../domain';
import { HORAS_SIN_RETIRAR } from '../domain';

export type MotivoDeFalloDeSelfie =
  /** La persona cerró la cámara sin terminar. No es un error. */
  | 'cancelada'
  /** La selfie no coincide con la foto del registro, o no se vio una persona real. */
  | 'no-coincide'
  /** Cualquier otra cosa: sin conexión, fallo del sistema, etc. */
  | 'error';

export type ResultadoDeSelfie = { ok: true } | { ok: false; motivo: MotivoDeFalloDeSelfie };

export type EstadoDeLaConfirmacion = {
  /** El círculo cuyas integrantes confirman. */
  circuloNombre: string;
  personas: Confirmacion[];
};

/** Lo que se le cuenta a la persona al recuperar el acceso. */
export type ResumenDeRecuperacion = {
  cuotasPagadas: number;
  cobraEnSemana: number;
  puntaje: number;
  /** Hasta cuándo no puede retirar dinero (fecha y hora ISO). */
  retiroCongeladoHasta: string;
};

/** Alguien del círculo perdió su teléfono y pide volver a entrar. */
export type SolicitudDeRecuperacion = {
  id: string;
  nombre: string;
  turno: number;
  cuotasPagadas: number;
  /** Hace cuántos meses se registró. */
  registradoHaceMeses: number;
  circuloNombre: string;
};

export type RespuestaASolicitud = 'confirmo' | 'no-lo-reconozco';

export type Recuperacion = {
  /**
   * Compara la selfie con la foto del registro y, si coincide, avisa a las
   * personas del círculo. Devuelve el resultado para lo esperado; lanza solo
   * ante lo inesperado.
   */
  verificarSelfie(): Promise<ResultadoDeSelfie>;
  /** Quién del grupo ya confirmó. Lanza un error si no se pudo consultar. */
  obtenerConfirmaciones(): Promise<EstadoDeLaConfirmacion>;
  /** Manda otro aviso a quienes no han respondido. */
  avisarAlGrupo(): Promise<void>;
  /** Cierra la recuperación, con la llave nueva ya creada, y cuenta cómo quedó todo. */
  completar(): Promise<ResumenDeRecuperacion>;
  /** La solicitud de alguien del círculo que espera que la confirmes, o `null`. */
  obtenerSolicitudPendiente(): Promise<SolicitudDeRecuperacion | null>;
  /** Responde a una solicitud: "sí, es él" o "no lo reconozco". */
  responderSolicitud(id: string, respuesta: RespuestaASolicitud): Promise<void>;
};

const MS_POR_HORA = 60 * 60 * 1000;

/** Una solicitud de ejemplo: Julio Lara perdió su teléfono. */
export function solicitudDeEjemplo(): SolicitudDeRecuperacion {
  return {
    id: 'solicitud-julio',
    nombre: 'Julio Lara',
    turno: 7,
    cuotasPagadas: 6,
    registradoHaceMeses: 4,
    circuloNombre: 'Los del mercado',
  };
}

function crearSimulada(): Recuperacion {
  // La primera consulta del grupo muestra una confirmación de tres; la siguiente
  // ya trae la segunda, para poder ver el avance sin servidor.
  let consultas = 0;
  let solicitud: SolicitudDeRecuperacion | null = solicitudDeEjemplo();

  return {
    async verificarSelfie() {
      consultas = 0;
      return { ok: true };
    },
    async obtenerConfirmaciones() {
      consultas += 1;
      const todas = consultas > 1;
      return {
        circuloNombre: 'Los del mercado',
        personas: [
          { id: 'rosa', nombre: 'Rosa Martínez', estado: 'confirmo', haceMinutos: 4 },
          todas
            ? { id: 'julio', nombre: 'Julio Lara', estado: 'confirmo', haceMinutos: 0 }
            : { id: 'julio', nombre: 'Julio Lara', estado: 'esperando' },
          { id: 'ana', nombre: 'Ana Torres', estado: 'esperando' },
        ],
      };
    },
    async avisarAlGrupo() {},
    async completar() {
      return {
        cuotasPagadas: 6,
        cobraEnSemana: 13,
        puntaje: 340,
        retiroCongeladoHasta: new Date(Date.now() + HORAS_SIN_RETIRAR * MS_POR_HORA).toISOString(),
      };
    },
    async obtenerSolicitudPendiente() {
      return solicitud;
    },
    async responderSolicitud() {
      solicitud = null;
    },
  };
}

// Fuera de desarrollo no hay con qué verificar ni a quién preguntar, así que todo
// falla. Es a propósito: una versión instalable no debe dar por recuperado el
// acceso de alguien a quien nadie confirmó.
const sinServidor: Recuperacion = {
  async verificarSelfie() {
    throw new Error('Todavía no hay verificación de identidad.');
  },
  async obtenerConfirmaciones() {
    throw new Error('Todavía no hay de dónde leer las confirmaciones.');
  },
  async avisarAlGrupo() {
    throw new Error('Todavía no hay cómo avisar al grupo.');
  },
  async completar() {
    throw new Error('Todavía no hay cómo cerrar la recuperación.');
  },
  async obtenerSolicitudPendiente() {
    throw new Error('Todavía no hay de dónde leer las solicitudes.');
  },
  async responderSolicitud() {
    throw new Error('Todavía no hay cómo responder a una solicitud.');
  },
};

export function crearRecuperacion(esDesarrollo: boolean = __DEV__): Recuperacion {
  return esDesarrollo ? crearSimulada() : sinServidor;
}
