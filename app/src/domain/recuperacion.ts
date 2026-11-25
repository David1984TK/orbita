// Recuperar el acceso cuando se pierde el teléfono.
//
// La llave vivía en el chip seguro del teléfono anterior y no sale de ahí, así
// que se crea una nueva. Para que nadie se haga pasar por otra persona, la
// recuperación usa el factor más fuerte que ningún banco tiene: el grupo. Dos
// integrantes del círculo confirman que eres tú y el retiro de dinero queda
// congelado 72 horas por si alguien te suplantó.

/** A cuántas personas del círculo se les pregunta. */
export const PERSONAS_QUE_CONFIRMAN = 3;
/** Cuántas tienen que confirmar para recuperar el acceso. */
export const CONFIRMACIONES_NECESARIAS = 2;
/** Si nadie responde, el acceso se recupera solo después de tantos días. */
export const DIAS_SIN_RESPUESTA = 7;
/** Horas que no se puede retirar dinero después de recuperar el acceso. */
export const HORAS_SIN_RETIRAR = 72;

export type EstadoDeConfirmacion = 'confirmo' | 'esperando' | 'rechazo';

export type Confirmacion = {
  id: string;
  nombre: string;
  estado: EstadoDeConfirmacion;
  /** Hace cuántos minutos respondió. Solo cuando ya respondió. */
  haceMinutos?: number;
};

/** "Hace 4 minutos", "Hace 1 hora", "Hace 2 días". */
export function formatearHace(minutos: number): string {
  const total = Math.max(0, Math.floor(minutos));
  if (total < 1) {
    return 'Hace un momento';
  }
  if (total < 60) {
    return total === 1 ? 'Hace 1 minuto' : `Hace ${total} minutos`;
  }
  const horas = Math.floor(total / 60);
  if (horas < 24) {
    return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
  }
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
}

/** Lo que se lee bajo el nombre y la etiqueta de cada persona. */
export function detalleDeConfirmacion(confirmacion: Confirmacion): string {
  switch (confirmacion.estado) {
    case 'confirmo':
      return confirmacion.haceMinutos === undefined
        ? 'Confirmó'
        : formatearHace(confirmacion.haceMinutos);
    case 'rechazo':
      return confirmacion.haceMinutos === undefined
        ? 'No te reconoció'
        : formatearHace(confirmacion.haceMinutos);
    case 'esperando':
      return 'Le llegó el aviso';
  }
}

/** La etiqueta de cada persona: "Confirmó", "Esperando" o "Dijo que no". */
export function etiquetaDeConfirmacion(estado: EstadoDeConfirmacion): string {
  switch (estado) {
    case 'confirmo':
      return 'Confirmó';
    case 'esperando':
      return 'Esperando';
    case 'rechazo':
      return 'Dijo que no';
  }
}

export type ResumenDeConfirmaciones = {
  confirmaron: number;
  esperando: number;
  rechazaron: number;
  /** Cuántas confirmaciones faltan para recuperar el acceso. */
  faltan: number;
  /** `true` cuando ya hay las necesarias. */
  completo: boolean;
};

export function resumenDeConfirmaciones(confirmaciones: Confirmacion[]): ResumenDeConfirmaciones {
  const cuantas = (estado: EstadoDeConfirmacion) =>
    confirmaciones.filter((c) => c.estado === estado).length;
  const confirmaron = cuantas('confirmo');
  const faltan = Math.max(0, CONFIRMACIONES_NECESARIAS - confirmaron);
  return {
    confirmaron,
    esperando: cuantas('esperando'),
    rechazaron: cuantas('rechazo'),
    faltan,
    completo: faltan === 0,
  };
}

/** "Falta una confirmación." / "Faltan 2 confirmaciones." */
export function textoDeFaltantes(faltan: number): string {
  return faltan === 1 ? 'Falta una confirmación.' : `Faltan ${faltan} confirmaciones.`;
}

/** "Hace 4 meses", "Hace 1 mes", "Hace menos de un mes". */
export function formatearHaceMeses(meses: number): string {
  const total = Math.max(0, Math.floor(meses));
  if (total < 1) {
    return 'Hace menos de un mes';
  }
  return total === 1 ? 'Hace 1 mes' : `Hace ${total} meses`;
}
