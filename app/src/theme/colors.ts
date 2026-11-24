// Colores de la marca Órbita. Salen del sistema de diseño aprobado.
//
// Regla de uso (importante):
//   - cobalto = el GRUPO. Botón principal, enlaces, lo que ya pasó en la rueda.
//   - ambar   = LO TUYO. Tu turno. Nunca se usa para decorar.
//
// `as const` le dice a TypeScript que estos valores no cambian, así que el
// editor te autocompleta "colors.cobalto" y marca error si escribes un nombre
// que no existe.

export const colors = {
  cobalto: '#2F4BD8',
  cobaltoClaro: '#8399FF', // para fondos oscuros
  ambar: '#E08700',
  ambarClaro: '#FFC24D', // el ámbar cuando va sobre cobalto
  tinta: '#15171E', // texto principal; negro apenas azulado

  // Superficies y texto secundario (modo claro)
  fondo: '#F2F2F7',
  tarjeta: '#FFFFFF',
  textoSecundario: '#585D6E',
  textoTenue: 'rgba(60, 60, 67, 0.32)', // texto de ayuda dentro de un campo vacío
  linea: '#DEE0E7',
  separador: 'rgba(60, 60, 67, 0.20)',

  // Estados de los integrantes del grupo
  alDia: '#248A3D',
  atrasado: '#D70015',
} as const;

export type NombreColor = keyof typeof colors;
