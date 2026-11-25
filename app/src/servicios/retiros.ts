// Retirar el bote de tu turno.
//
// Retirar es firmar una transacción con la llave de la persona. Los contratos
// y el servidor todavía no existen (Etapas 1 y 3); mientras tanto la app habla
// con esta interfaz y detrás hay una versión simulada solo para desarrollo.

export type MotivoDeFalloDeRetiro =
  /** La persona cerró el Face ID o la huella sin confirmar. No es un error. */
  | 'cancelada'
  /** Cualquier otra cosa: sin conexión, fallo del sistema, etc. */
  | 'error';

export type ResultadoDeRetiro = { ok: true } | { ok: false; motivo: MotivoDeFalloDeRetiro };

export type Retiros = {
  /**
   * Retira el bote del turno de la persona, pidiendo la confirmación
   * biométrica. `recibes` es lo que le llega después de las comisiones.
   * Devuelve el resultado para lo esperado (cancelar, fallar); lanza solo ante
   * lo inesperado.
   */
  retirar(circuloId: string, recibes: number): Promise<ResultadoDeRetiro>;
};

const simulados: Retiros = {
  async retirar() {
    return { ok: true };
  },
};

// Fuera de desarrollo no hay contrato del que retirar, así que falla. Es a
// propósito: una versión instalable no debe decir "retiraste" cuando no se movió
// ningún dinero.
const sinContratos: Retiros = {
  async retirar() {
    throw new Error('Todavía no hay contratos de los que retirar.');
  },
};

export function crearRetiros(esDesarrollo: boolean = __DEV__): Retiros {
  return esDesarrollo ? simulados : sinContratos;
}
