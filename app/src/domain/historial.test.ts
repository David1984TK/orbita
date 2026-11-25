import { fraccionDelPuntaje } from './historial';

describe('fraccionDelPuntaje', () => {
  it('es la proporción del puntaje sobre el máximo', () => {
    expect(fraccionDelPuntaje(340, 1000)).toBe(0.34);
    expect(fraccionDelPuntaje(500, 1000)).toBe(0.5);
  });

  it('en los extremos llena o vacía el medidor', () => {
    expect(fraccionDelPuntaje(0, 1000)).toBe(0);
    expect(fraccionDelPuntaje(1000, 1000)).toBe(1);
  });

  it('no se sale del rango aunque el puntaje sí', () => {
    expect(fraccionDelPuntaje(1500, 1000)).toBe(1);
    expect(fraccionDelPuntaje(-20, 1000)).toBe(0);
  });

  it('con un máximo inválido no inventa una proporción', () => {
    expect(fraccionDelPuntaje(340, 0)).toBe(0);
    expect(fraccionDelPuntaje(340, -5)).toBe(0);
    expect(fraccionDelPuntaje(340, Number.NaN)).toBe(0);
  });
});
