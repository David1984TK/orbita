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
  cobaltoSuave: 'rgba(47, 75, 216, 0.12)', // fondo tenue de un ícono o una etiqueta
  ambar: '#E08700',
  ambarClaro: '#FFC24D', // el ámbar cuando va sobre cobalto
  tinta: '#15171E', // texto principal; negro apenas azulado

  // Superficies y texto secundario (modo claro)
  fondo: '#F2F2F7',
  tarjeta: '#FFFFFF',
  textoSecundario: '#585D6E',
  textoTenue: 'rgba(60, 60, 67, 0.32)', // texto de ayuda dentro de un campo vacío
  textoInactivo: '#8A8FA0', // pestañas que no son la actual
  linea: '#DEE0E7',
  separador: 'rgba(60, 60, 67, 0.20)',

  // Estados de los integrantes del grupo
  alDia: '#248A3D',
  alDiaSuave: 'rgba(36, 138, 61, 0.12)', // fondo de la etiqueta "Al día"
  atrasado: '#D70015',
  atrasadoSuave: 'rgba(215, 0, 21, 0.10)', // fondo de la etiqueta "N días tarde"
  precaucionSuave: 'rgba(150, 80, 40, 0.12)', // fondo de un aviso de seguridad

  // Pantalla del grupo que confirma a quien recuperó su acceso (modo oscuro)
  noche: '#1B2140',
  nocheTarjeta: 'rgba(255, 255, 255, 0.07)',
  nocheTexto: 'rgba(255, 255, 255, 0.62)',
  nocheRechazo: '#FF6B6B',
} as const;

export type NombreColor = keyof typeof colors;
