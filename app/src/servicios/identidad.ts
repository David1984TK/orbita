// Verificación de identidad (KYC): foto de la INE, selfie y domicilio.
//
// El proveedor de KYC entra en la Etapa 3. Mientras tanto la app habla con esta
// interfaz y detrás hay una versión simulada solo para desarrollo, que da la
// verificación por buena sin pedir nada.

export type Identidad = {
  /** Termina la verificación completa. Lanza un error si no se pudo. */
  verificar(): Promise<void>;
};

const simulada: Identidad = {
  async verificar() {},
};

// Fuera de desarrollo no hay con qué verificar, así que falla. Es a propósito:
// una versión instalable no debe dar por verificada a alguien que no lo está.
const sinProveedor: Identidad = {
  async verificar() {
    throw new Error('Todavía no hay proveedor de verificación de identidad.');
  },
};

export function crearIdentidad(esDesarrollo: boolean = __DEV__): Identidad {
  return esDesarrollo ? simulada : sinProveedor;
}
