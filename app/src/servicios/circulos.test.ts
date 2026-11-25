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

  it('en desarrollo nace "en formación": solo está quien lo creó', async () => {
    const resultado = await crearCirculos(true).crearCirculo(borrador);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      return;
    }
    expect(resultado.enFormacion).toMatchObject({
      nombre: 'Los del mercado',
      integrantes: 15,
      cuotaSemanal: 600,
      moneda: 'pesos',
      organizadorId: 'yo',
    });
    expect(resultado.enFormacion.participantes).toHaveLength(1);
    expect(resultado.enFormacion.enlace).toMatch(/^https:\/\/orbita\.example\/c\//);
  });

  it('cada círculo creado tiene su propio identificador y enlace', async () => {
    const circulos = crearCirculos(true);
    const uno = await circulos.crearCirculo(borrador);
    const otro = await circulos.crearCirculo(borrador);

    if (!uno.ok || !otro.ok) {
      throw new Error('se esperaba que se crearan');
    }
    expect(uno.enFormacion.id).not.toBe(otro.enFormacion.id);
    expect(uno.enFormacion.enlace).not.toBe(otro.enFormacion.enlace);
  });

  it('el identificador sale del nombre, sin acentos ni signos', async () => {
    const resultado = await crearCirculos(true).crearCirculo({ ...borrador, nombre: 'Ahorro: ¡Mamá & Tías!' });

    if (!resultado.ok) {
      throw new Error('se esperaba que se creara');
    }
    expect(resultado.enFormacion.id).toBe('ahorro-mama-tias-1');
  });

  it('los círculos creados aparecen en la lista de los que se están llenando', async () => {
    const circulos = crearCirculos(true);
    expect(await circulos.obtenerCirculosEnFormacion()).toEqual([]);

    await circulos.crearCirculo(borrador);

    expect(await circulos.obtenerCirculosEnFormacion()).toHaveLength(1);
  });

  it('en cada consulta de avance entra una persona más, hasta llenarse', async () => {
    const circulos = crearCirculos(true);
    const creado = await circulos.crearCirculo({ ...borrador, integrantes: 5 });
    if (!creado.ok) {
      throw new Error('se esperaba que se creara');
    }

    const tamanos: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      tamanos.push((await circulos.obtenerEnFormacion(creado.enFormacion.id)).participantes.length);
    }

    expect(tamanos).toEqual([2, 3, 4, 5, 5, 5]);
  });

  it('quienes entran no se repiten con quien creó el círculo', async () => {
    const circulos = crearCirculos(true);
    const creado = await circulos.crearCirculo({ ...borrador, integrantes: 15 });
    if (!creado.ok) {
      throw new Error('se esperaba que se creara');
    }
    let ultimo = creado.enFormacion;
    for (let i = 0; i < 14; i += 1) {
      ultimo = await circulos.obtenerEnFormacion(creado.enFormacion.id);
    }

    const ids = ultimo.participantes.map((p) => p.id);
    expect(new Set(ids).size).toBe(15);
  });

  it('pedir el avance de un círculo que no existe lanza un error', async () => {
    await expect(crearCirculos(true).obtenerEnFormacion('no-existe')).rejects.toThrow(/no-existe/);
  });
});

describe('círculos fuera de desarrollo', () => {
  it('nunca enseña un círculo inventado: falla por no haber de dónde leerlo', async () => {
    await expect(crearCirculos(false).obtenerMiCirculo()).rejects.toThrow();
  });

  it('nunca enseña círculos en formación inventados', async () => {
    await expect(crearCirculos(false).obtenerCirculosEnFormacion()).rejects.toThrow();
    await expect(crearCirculos(false).obtenerEnFormacion('x')).rejects.toThrow();
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
