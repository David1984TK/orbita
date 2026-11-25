import type { Circulo, EstadoPago, Integrante } from './circulo';
import {
  etiquetaDeEstado,
  iniciales,
  integrantesOrdenados,
  quienCobra,
  resumenDelGrupo,
  textoDelResumen,
} from './grupo';

function integrante(
  id: string,
  turno: number,
  estado: EstadoPago = 'alDia',
  diasDeAtraso?: number,
): Integrante {
  return { id, nombre: `Persona ${id}`, turno, estado, cuotasPagadas: 5, diasDeAtraso };
}

function circulo(integrantes: Integrante[], semanaActual = 3): Circulo {
  return {
    id: 'c',
    nombre: 'Los del mercado',
    moneda: 'pesos',
    cuotaSemanal: 600,
    semanaActual,
    inicio: '2026-10-26',
    integrantes,
  };
}

describe('iniciales', () => {
  it('toma la primera letra de las dos primeras palabras, en mayúscula', () => {
    expect(iniciales('Rosa Martínez')).toBe('RM');
    expect(iniciales('david nava')).toBe('DN');
  });

  it('con un solo nombre da una sola letra', () => {
    expect(iniciales('Tere')).toBe('T');
  });

  it('con más de dos palabras usa solo las dos primeras', () => {
    expect(iniciales('Ana María de la Cruz')).toBe('AM');
  });

  it('ignora espacios de sobra y respeta las letras con acento', () => {
    expect(iniciales('  Álvaro   Íñiguez  ')).toBe('ÁÍ');
  });

  it('con un nombre vacío no da nada', () => {
    expect(iniciales('   ')).toBe('');
  });
});

describe('resumenDelGrupo y textoDelResumen', () => {
  it('cuenta cuántas van al día, pendientes y atrasadas', () => {
    const resumen = resumenDelGrupo(
      circulo([
        integrante('a', 1),
        integrante('b', 2),
        integrante('c', 3, 'pendiente'),
        integrante('d', 4, 'atrasado', 3),
        integrante('e', 5, 'atrasado', 1),
      ]),
    );

    expect(resumen).toEqual({ alDia: 2, pendientes: 1, atrasados: 2 });
  });

  it('"14 al día, 1 atrasado"', () => {
    expect(textoDelResumen({ alDia: 14, pendientes: 0, atrasados: 1 })).toBe('14 al día, 1 atrasado');
  });

  it('usa el plural cuando hace falta', () => {
    expect(textoDelResumen({ alDia: 10, pendientes: 3, atrasados: 2 })).toBe(
      '10 al día, 3 pendientes, 2 atrasados',
    );
  });

  it('nombra solo lo que existe', () => {
    expect(textoDelResumen({ alDia: 13, pendientes: 2, atrasados: 0 })).toBe('13 al día, 2 pendientes');
    expect(textoDelResumen({ alDia: 14, pendientes: 1, atrasados: 0 })).toBe('14 al día, 1 pendiente');
  });

  it('si todas van al día lo dice así', () => {
    expect(textoDelResumen({ alDia: 15, pendientes: 0, atrasados: 0 })).toBe('Todos al día');
  });
});

describe('quienCobra', () => {
  it('es la integrante cuyo turno es la semana en curso', () => {
    const c = circulo([integrante('a', 1), integrante('b', 3), integrante('c', 2)], 3);

    expect(quienCobra(c)?.id).toBe('b');
  });

  it('si nadie tiene ese turno no inventa a nadie', () => {
    expect(quienCobra(circulo([integrante('a', 1)], 9))).toBeUndefined();
  });
});

describe('integrantesOrdenados', () => {
  it('pone primero a la persona y luego a las demás por turno', () => {
    const c = circulo([integrante('a', 4), integrante('yo', 9), integrante('b', 2), integrante('c', 7)]);

    expect(integrantesOrdenados(c, 'yo').map((i) => i.id)).toEqual(['yo', 'b', 'a', 'c']);
  });

  it('no modifica el círculo original', () => {
    const c = circulo([integrante('a', 4), integrante('yo', 9), integrante('b', 2)]);
    integrantesOrdenados(c, 'yo');

    expect(c.integrantes.map((i) => i.id)).toEqual(['a', 'yo', 'b']);
  });

  it('conserva a todas las integrantes', () => {
    const c = circulo([integrante('a', 1), integrante('yo', 2), integrante('b', 3)]);

    expect(integrantesOrdenados(c, 'yo')).toHaveLength(3);
  });
});

describe('etiquetaDeEstado', () => {
  it('al día y pendiente', () => {
    expect(etiquetaDeEstado(integrante('a', 1, 'alDia'))).toEqual({ texto: 'Al día', tono: 'alDia' });
    expect(etiquetaDeEstado(integrante('a', 1, 'pendiente'))).toEqual({
      texto: 'Pendiente',
      tono: 'pendiente',
    });
  });

  it('atrasada dice cuántos días, con singular y plural', () => {
    expect(etiquetaDeEstado(integrante('a', 1, 'atrasado', 3))).toEqual({
      texto: '3 días tarde',
      tono: 'atrasado',
    });
    expect(etiquetaDeEstado(integrante('a', 1, 'atrasado', 1)).texto).toBe('1 día tarde');
  });

  it('atrasada sin saber cuántos días no inventa un número', () => {
    expect(etiquetaDeEstado(integrante('a', 1, 'atrasado'))).toEqual({
      texto: 'Atrasado',
      tono: 'atrasado',
    });
  });
});
