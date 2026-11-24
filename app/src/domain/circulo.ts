// Modelo de un círculo de ahorro.
//
// Un "type" en TypeScript describe la forma de un dato. No genera código en la
// app: solo le permite al compilador avisarte si usas un campo que no existe o
// mezclas dos cosas distintas. En una app que mueve dinero ajeno, esos avisos
// valen mucho.

/**
 * En qué moneda ahorra el círculo.
 *
 * La moneda es propiedad del CÍRCULO, no de cada persona: si mezclaras monedas
 * y el tipo de cambio se moviera durante el ciclo, quien cobra temprano y quien
 * cobra tarde recibirían valores reales distintos.
 */
export type Moneda = 'pesos' | 'dolares';

/** Si un integrante ha cumplido con su cuota de la semana. */
export type EstadoPago = 'alDia' | 'pendiente' | 'atrasado';

export type Integrante = {
  id: string;
  nombre: string;
  /** Semana en la que cobra: del 1 al total de integrantes. */
  turno: number;
  /** Cómo va con la cuota de la semana en curso. */
  estado: EstadoPago;
  /** Cuántas cuotas lleva aportadas en total, de las `integrantes.length`. */
  cuotasPagadas: number;
};

export type Circulo = {
  id: string;
  nombre: string;
  moneda: Moneda;
  /** Lo que cada integrante aporta por semana, en la moneda del círculo. */
  cuotaSemanal: number;
  integrantes: Integrante[];
  /** Semana en curso, empezando en 1. */
  semanaActual: number;
  /**
   * Día en que vence la cuota de la semana 1, como "AAAA-MM-DD". Las demás
   * semanas vencen cada 7 días a partir de ahí.
   */
  inicio: string;
};

/** Un círculo visto por una de sus integrantes: `yoId` es quién mira. */
export type MiCirculo = {
  circulo: Circulo;
  yoId: string;
};

/**
 * Cuánto podría llevarse alguien si desapareciera hoy.
 *
 *   exposición neta = recibido − aportado − garantía
 *
 * Esta es la regla central de los contratos: la posición en la rueda y el
 * colateral exigido salen de exigir que
 *
 *   exposición neta ≤ límite(score)
 *
 * Aquí solo se calcula el número; el contrato es quien la hace cumplir. Si la
 * fórmula cambia en el contrato, tiene que cambiar aquí también.
 */
export function exposicionNeta(
  recibido: number,
  aportado: number,
  garantia: number,
): number {
  return recibido - aportado - garantia;
}

/** Total que recibe quien cobra en su turno: cuota × número de integrantes. */
export function boteDelCirculo(circulo: Circulo): number {
  return circulo.cuotaSemanal * circulo.integrantes.length;
}
