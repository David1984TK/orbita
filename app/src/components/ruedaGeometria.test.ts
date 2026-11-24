import { trazoDeSegmento } from './ruedaGeometria';

describe('trazoDeSegmento', () => {
  it('el primer segmento de cuatro va de las 12 a las 3, sin hueco', () => {
    // Centro (100, 100), radio 50: arriba es (100, 50) y la derecha es (150, 100).
    expect(trazoDeSegmento(0, 4, 100, 100, 50, 0)).toBe('M 100 50 A 50 50 0 0 1 150 100');
  });

  it('el segundo va de las 3 a las 6', () => {
    expect(trazoDeSegmento(1, 4, 100, 100, 50, 0)).toBe('M 150 100 A 50 50 0 0 1 100 150');
  });

  it('el último termina donde empieza el primero', () => {
    expect(trazoDeSegmento(3, 4, 100, 100, 50, 0)).toBe('M 50 100 A 50 50 0 0 1 100 50');
  });

  it('el hueco acorta el segmento por ambos lados', () => {
    const sinHueco = trazoDeSegmento(0, 15, 120, 120, 100, 0);
    const conHueco = trazoDeSegmento(0, 15, 120, 120, 100, 6);

    expect(conHueco).not.toBe(sinHueco);
    // Con hueco, el segmento ya no arranca exactamente arriba (x = 120).
    expect(conHueco.startsWith('M 120 ')).toBe(false);
  });

  it('con un solo segmento pide el arco grande', () => {
    expect(trazoDeSegmento(0, 1, 100, 100, 50, 10)).toContain('A 50 50 0 1 1');
  });
});
