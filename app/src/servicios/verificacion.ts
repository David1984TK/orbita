// Verificación del teléfono por código de WhatsApp.
//
// El servidor todavía no existe (se construye en la Etapa 3). Mientras tanto la
// app habla con esta interfaz, y detrás hay una versión simulada solo para
// desarrollo. Cuando haya servidor se cambia la implementación y las pantallas
// no se enteran.

export type Verificacion = {
  /** Pide que se mande un código por WhatsApp al teléfono (10 dígitos). */
  enviarCodigo(telefono: string): Promise<void>;
  /**
   * `true` si el código es correcto, `false` si no lo es. Lanza un error si no
   * se pudo preguntar, que no es lo mismo que un código equivocado.
   */
  verificarCodigo(telefono: string, codigo: string): Promise<boolean>;
};

/** Código que acepta la versión simulada. Solo existe en desarrollo. */
export const CODIGO_DE_PRUEBA = '123456';

const simulada: Verificacion = {
  async enviarCodigo() {},
  async verificarCodigo(_telefono, codigo) {
    return codigo === CODIGO_DE_PRUEBA;
  },
};

// Fuera de desarrollo no hay con qué verificar, así que todo falla. Es a
// propósito: un acceso que "acepta cualquier cosa" nunca debe salir en una
// versión instalable.
const sinServidor: Verificacion = {
  async enviarCodigo() {
    throw new Error('Todavía no hay servidor de verificación.');
  },
  async verificarCodigo() {
    throw new Error('Todavía no hay servidor de verificación.');
  },
};

export function crearVerificacion(esDesarrollo: boolean = __DEV__): Verificacion {
  return esDesarrollo ? simulada : sinServidor;
}
