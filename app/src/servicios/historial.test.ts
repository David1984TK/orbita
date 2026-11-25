import { fraccionDelPuntaje } from '../domain';
import { crearHistoriales, historialDeEjemplo } from './historial';

describe('historial de ejemplo (solo desarrollo)', () => {
  it('es coherente: el puntaje cabe en el medidor y el siguiente nivel deja cobrar antes', () => {
    const h = historialDeEjemplo();

    expect(h.puntaje).toBeLessThanOrEqual(h.puntajeMaximo);
    expect(fraccionDelPuntaje(h.puntaje, h.puntajeMaximo)).toBeGreaterThan(0);
    expect(h.siguienteNivel!.cobraDesdeTurno).toBeLessThan(h.nivel.cobraDesdeTurno);
    expect(h.pagosATiempo).toBeLessThanOrEqual(h.pagosTotales);
  });

  it('se entrega por la interfaz en desarrollo', async () => {
    await expect(crearHistoriales(true).obtenerMiHistorial()).resolves.toEqual(historialDeEjemplo());
  });
});

describe('historial fuera de desarrollo', () => {
  it('nunca enseña un historial inventado: falla por no haber de dónde leerlo', async () => {
    await expect(crearHistoriales(false).obtenerMiHistorial()).rejects.toThrow();
  });
});
