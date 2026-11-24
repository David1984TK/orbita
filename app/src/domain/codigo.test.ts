import {
  esCodigoCompleto,
  formatearCuentaAtras,
  LARGO_CODIGO,
  normalizarCodigo,
} from './codigo';

describe('normalizarCodigo', () => {
  it('deja solo los dígitos', () => {
    expect(normalizarCodigo('492 716')).toBe('492716');
    expect(normalizarCodigo('492-716')).toBe('492716');
    expect(normalizarCodigo('abc4x9')).toBe('49');
  });

  it('recorta a 6 dígitos', () => {
    expect(normalizarCodigo('49271688')).toHaveLength(LARGO_CODIGO);
    expect(normalizarCodigo('49271688')).toBe('492716');
  });

  it('con texto vacío o sin dígitos devuelve vacío', () => {
    expect(normalizarCodigo('')).toBe('');
    expect(normalizarCodigo('hola')).toBe('');
  });
});

describe('esCodigoCompleto', () => {
  it('solo con 6 dígitos', () => {
    expect(esCodigoCompleto('49271')).toBe(false);
    expect(esCodigoCompleto('492716')).toBe(true);
    expect(esCodigoCompleto('492 716')).toBe(true);
  });
});

describe('formatearCuentaAtras', () => {
  it('formatea minutos y segundos', () => {
    expect(formatearCuentaAtras(42)).toBe('0:42');
    expect(formatearCuentaAtras(9)).toBe('0:09');
    expect(formatearCuentaAtras(60)).toBe('1:00');
    expect(formatearCuentaAtras(0)).toBe('0:00');
  });

  it('no baja de cero ni muestra decimales', () => {
    expect(formatearCuentaAtras(-5)).toBe('0:00');
    expect(formatearCuentaAtras(41.9)).toBe('0:41');
  });
});
