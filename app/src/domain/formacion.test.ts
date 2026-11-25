import type { CirculoEnFormacion } from './formacion';
import {
  arrancarCirculo,
  estaLleno,
  faltanPorEntrar,
  lugaresDelCirculo,
  mensajeDeInvitacion,
  textoDeFaltantes,
} from './formacion';

function circulo(cuantosEntraron: number, integrantes = 10): CirculoEnFormacion {
  return {
    id: 'los-del-mercado',
    nombre: 'Los del mercado',
    moneda: 'pesos',
    cuotaSemanal: 600,
    integrantes,
    participantes: Array.from({ length: cuantosEntraron }, (_, i) => ({
      id: `p${i + 1}`,
      nombre: `Persona ${i + 1}`,
    })),
    enlace: 'https://orbita.example/c/los-del-mercado',
    organizadorId: 'p1',
  };
}

describe('faltanPorEntrar y estaLleno', () => {
  it('faltan las que aún no entran', () => {
    expect(faltanPorEntrar(circulo(1))).toBe(9);
    expect(faltanPorEntrar(circulo(4))).toBe(6);
  });

  it('cuando entran todas ya no falta nadie y está lleno', () => {
    expect(faltanPorEntrar(circulo(10))).toBe(0);
    expect(estaLleno(circulo(10))).toBe(true);
  });

  it('mientras falte alguien no está lleno', () => {
    expect(estaLleno(circulo(9))).toBe(false);
  });

  it('si por error entran más de las que caben no pide menos de cero', () => {
    expect(faltanPorEntrar(circulo(12, 10))).toBe(0);
    expect(estaLleno(circulo(12, 10))).toBe(true);
  });
});

describe('textoDeFaltantes', () => {
  it('plural, singular y lleno', () => {
    expect(textoDeFaltantes(circulo(4))).toBe('Faltan 6 personas');
    expect(textoDeFaltantes(circulo(9))).toBe('Falta 1 persona');
    expect(textoDeFaltantes(circulo(10))).toBe('Ya entraron todas');
  });
});

describe('lugaresDelCirculo', () => {
  it('hay un lugar por integrante, primero los ocupados y luego los libres', () => {
    const lugares = lugaresDelCirculo(circulo(3, 5));

    expect(lugares).toHaveLength(5);
    expect(lugares.map((l) => l.tipo)).toEqual(['entro', 'entro', 'entro', 'libre', 'libre']);
  });

  it('cada lugar ocupado trae a su participante', () => {
    const [primero] = lugaresDelCirculo(circulo(2));

    expect(primero).toEqual({ tipo: 'entro', participante: { id: 'p1', nombre: 'Persona 1' } });
  });

  it('un círculo lleno no tiene lugares libres', () => {
    expect(lugaresDelCirculo(circulo(5, 5)).every((l) => l.tipo === 'entro')).toBe(true);
  });
});

describe('mensajeDeInvitacion', () => {
  it('invita por el nombre, dice cuánto se ahorra y cuánto recibe cada quien, y trae el enlace', () => {
    expect(mensajeDeInvitacion(circulo(1))).toBe(
      'Te invito a «Los del mercado» en Órbita: 10 personas que ahorran juntas, con $600 cada ' +
        'semana, y cada quien recibe $6,000 en su turno. ' +
        'Entra aquí: https://orbita.example/c/los-del-mercado',
    );
  });

  it('nunca usa las palabras prohibidas del producto', () => {
    expect(mensajeDeInvitacion(circulo(1))).not.toMatch(/tanda|cundina|caja de ahorro|seguro/i);
  });
});

describe('arrancarCirculo', () => {
  // Un círculo de 5 personas, todas dentro: yo (p1, quien lo creó) y cuatro más.
  const lleno = () => circulo(5, 5);
  const turnos = { p1: 4, p2: 1, p3: 2, p4: 3, p5: 5 };

  it('un círculo lleno arranca: semana 1, con su inicio y los datos del círculo', () => {
    const { circulo: arrancado } = arrancarCirculo(lleno(), turnos, '2026-12-07');

    expect(arrancado).toMatchObject({
      id: 'los-del-mercado',
      nombre: 'Los del mercado',
      moneda: 'pesos',
      cuotaSemanal: 600,
      semanaActual: 1,
      inicio: '2026-12-07',
    });
    expect(arrancado.integrantes).toHaveLength(5);
  });

  it('cada integrante conserva su nombre, recibe su turno y debe su primera cuota', () => {
    const { circulo: arrancado } = arrancarCirculo(lleno(), turnos, '2026-12-07');

    expect(arrancado.integrantes[0]).toEqual({
      id: 'p1',
      nombre: 'Persona 1',
      turno: 4,
      estado: 'pendiente',
      cuotasPagadas: 0,
    });
    expect(arrancado.integrantes.map((i) => i.turno)).toEqual([4, 1, 2, 3, 5]);
    expect(arrancado.integrantes.every((i) => i.estado === 'pendiente' && i.cuotasPagadas === 0)).toBe(true);
  });

  it('quien lo creó sigue siendo "yo" en el círculo ya en curso', () => {
    expect(arrancarCirculo(lleno(), turnos, '2026-12-07').yoId).toBe('p1');
  });

  it('no arranca si todavía falta gente', () => {
    expect(() => arrancarCirculo(circulo(4, 5), turnos, '2026-12-07')).toThrow(/todavía no se llena/);
  });

  it('exige un turno válido para cada persona', () => {
    expect(() => arrancarCirculo(lleno(), { ...turnos, p3: 0 }, '2026-12-07')).toThrow(/p3/);
    expect(() => arrancarCirculo(lleno(), { ...turnos, p3: 6 }, '2026-12-07')).toThrow(/p3/);
    expect(() => arrancarCirculo(lleno(), { ...turnos, p3: 2.5 }, '2026-12-07')).toThrow(/p3/);
    const sinP5 = { p1: 4, p2: 1, p3: 2, p4: 3 };
    expect(() => arrancarCirculo(lleno(), sinP5, '2026-12-07')).toThrow(/p5/);
  });

  it('no acepta dos personas con el mismo turno', () => {
    expect(() => arrancarCirculo(lleno(), { ...turnos, p5: 1 }, '2026-12-07')).toThrow(/repetido/);
  });

  it('no modifica el círculo en formación', () => {
    const antes = lleno();
    arrancarCirculo(antes, turnos, '2026-12-07');

    expect(antes.participantes).toHaveLength(5);
    expect(antes).toEqual(lleno());
  });
});
