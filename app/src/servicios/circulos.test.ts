import { miIntegrante, resumenDeAportes, resumenDeMiTurno } from '../domain';
import { circuloDeEjemplo, crearCirculos } from './circulos';

describe('círculo de ejemplo (solo desarrollo)', () => {
  it('es coherente: 15 turnos distintos del 1 al 15 y yo estoy dentro', () => {
    const { circulo, yoId } = circuloDeEjemplo();

    const turnos = circulo.integrantes.map((i) => i.turno).sort((a, b) => a - b);
    expect(turnos).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(miIntegrante(circulo, yoId).nombre).toBe('David Nava');
  });

  it('me toca más adelante y me falta pagar la cuota de esta semana', () => {
    const { circulo, yoId } = circuloDeEjemplo();

    expect(resumenDeMiTurno(circulo, yoId).tipo).toBe('faltan');
    expect(resumenDeAportes(circulo, yoId).alDia).toBe(false);
  });

  it('se entrega por la interfaz en desarrollo', async () => {
    await expect(crearCirculos(true).obtenerMiCirculo()).resolves.toEqual(circuloDeEjemplo());
  });
});

describe('crear un círculo', () => {
  const borrador = { nombre: 'Los del mercado', integrantes: 15, cuota: 600, moneda: 'pesos' } as const;

  it('en desarrollo da la creación por buena', async () => {
    await expect(crearCirculos(true).crearCirculo(borrador)).resolves.toEqual({ ok: true });
  });
});

describe('círculos fuera de desarrollo', () => {
  it('nunca enseña un círculo inventado: falla por no haber de dónde leerlo', async () => {
    await expect(crearCirculos(false).obtenerMiCirculo()).rejects.toThrow();
  });

  it('nunca dice que creó un círculo: falla por no haber contratos', async () => {
    await expect(
      crearCirculos(false).crearCirculo({
        nombre: 'Los del mercado',
        integrantes: 15,
        cuota: 600,
        moneda: 'pesos',
      }),
    ).rejects.toThrow();
  });
});
