// Creación de la llave (passkey) de la persona.
//
// Esta es la parte de riesgo técnico del proyecto: el puente entre
// `react-native-passkey` y la smart wallet de Soroban (Etapa 0 del roadmap) NO
// está hecho. Mientras tanto la app habla con esta interfaz y detrás hay una
// versión simulada solo para desarrollo. Cuando el puente exista se cambia la
// implementación y la pantalla no se entera.

export type MotivoDeFallo =
  /** La persona cerró el Face ID o la huella sin terminar. No es un error. */
  | 'cancelada'
  /** El teléfono no tiene Face ID, huella ni bloqueo de pantalla configurado. */
  | 'sin-biometria'
  /** Cualquier otra cosa: sin conexión, fallo del sistema, etc. */
  | 'error';

export type ResultadoLlave = { ok: true } | { ok: false; motivo: MotivoDeFallo };

export type Llave = {
  /**
   * Crea la llave de la cuenta de ese teléfono (10 dígitos) y la guarda en el
   * chip seguro del teléfono. Devuelve el resultado en vez de lanzar errores
   * para los casos esperados (cancelar, no tener biometría); lanza solo ante lo
   * inesperado.
   */
  crearLlave(telefono: string): Promise<ResultadoLlave>;
};

const simulada: Llave = {
  async crearLlave() {
    return { ok: true };
  },
};

// Fuera de desarrollo no hay llave real que crear, así que todo falla. Es a
// propósito: una versión instalable no debe fingir que creó una llave, porque
// la persona creería tener un acceso que no existe.
const sinPasskeys: Llave = {
  async crearLlave() {
    throw new Error('Todavía no hay creación real de llaves (spike de la Etapa 0).');
  },
};

export function crearLlave(esDesarrollo: boolean = __DEV__): Llave {
  return esDesarrollo ? simulada : sinPasskeys;
}
