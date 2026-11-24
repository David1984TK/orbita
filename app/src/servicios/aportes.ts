// Aportar la cuota de la semana al círculo.
//
// Aportar es firmar una transacción con la llave de la persona (Face ID o
// huella). Los contratos y el servidor todavía no existen (Etapas 1 y 3);
// mientras tanto la app habla con esta interfaz y detrás hay una versión
// simulada solo para desarrollo.

export type MotivoDeFalloDeAporte =
  /** La persona cerró el Face ID o la huella sin confirmar. No es un error. */
  | 'cancelada'
  /** Cualquier otra cosa: sin conexión, fallo del sistema, etc. */
  | 'error';

export type ResultadoDeAporte = { ok: true } | { ok: false; motivo: MotivoDeFalloDeAporte };

export type Aportes = {
  /**
   * Aporta la cuota de esta semana al círculo, pidiendo la confirmación
   * biométrica. `total` es lo que se descuenta (cuota + comisión). Devuelve el
   * resultado para lo esperado (cancelar, fallar); lanza solo ante lo
   * inesperado.
   */
  aportar(circuloId: string, total: number): Promise<ResultadoDeAporte>;
};

const simulados: Aportes = {
  async aportar() {
    return { ok: true };
  },
};

// Fuera de desarrollo no hay contrato al que aportar, así que falla. Es a
// propósito: una versión instalable no debe decir "aportaste" cuando no se movió
// ningún dinero.
const sinContratos: Aportes = {
  async aportar() {
    throw new Error('Todavía no hay contratos a los que aportar.');
  },
};

export function crearAportes(esDesarrollo: boolean = __DEV__): Aportes {
  return esDesarrollo ? simulados : sinContratos;
}
