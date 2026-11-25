import type { Circulo, MiCirculo } from './circulo';
import type { CirculoEnFormacion } from './formacion';
import {
  conCirculoActualizado,
  conCirculoAgregado,
  elegirActual,
  enFormacionPendientes,
} from './misCirculos';

function mio(id: string, nombre = `Círculo ${id}`, semanaActual = 1): MiCirculo {
  const circulo: Circulo = {
    id,
    nombre,
    moneda: 'pesos',
    cuotaSemanal: 600,
    integrantes: [],
    semanaActual,
    inicio: '2026-10-26',
  };
  return { circulo, yoId: 'yo' };
}

function formando(id: string): CirculoEnFormacion {
  return {
    id,
    nombre: `Formando ${id}`,
    moneda: 'pesos',
    cuotaSemanal: 600,
    integrantes: 5,
    participantes: [],
    enlace: `https://orbita.example/c/${id}`,
    organizadorId: 'yo',
  };
}

describe('elegirActual', () => {
  const lista = [mio('a'), mio('b'), mio('c')];

  it('devuelve el que tiene ese identificador', () => {
    expect(elegirActual(lista, 'b')?.circulo.id).toBe('b');
  });

  it('si todavía no se eligió ninguno, el primero', () => {
    expect(elegirActual(lista, null)?.circulo.id).toBe('a');
  });

  it('si el elegido ya no existe, el primero', () => {
    expect(elegirActual(lista, 'x')?.circulo.id).toBe('a');
  });

  it('sin círculos no hay actual', () => {
    expect(elegirActual([], 'a')).toBeNull();
    expect(elegirActual([], null)).toBeNull();
  });
});

describe('conCirculoActualizado', () => {
  it('cambia solo el círculo con ese identificador, en su lugar', () => {
    const lista = [mio('a', 'Uno'), mio('b', 'Dos'), mio('c', 'Tres')];

    const nueva = conCirculoActualizado(lista, mio('b', 'Dos cambiado', 5));

    expect(nueva.map((m) => m.circulo.nombre)).toEqual(['Uno', 'Dos cambiado', 'Tres']);
    expect(nueva[1].circulo.semanaActual).toBe(5);
  });

  it('no modifica la lista original', () => {
    const lista = [mio('a', 'Uno')];
    conCirculoActualizado(lista, mio('a', 'Otro'));

    expect(lista[0].circulo.nombre).toBe('Uno');
  });

  it('si no está, la lista queda igual', () => {
    const lista = [mio('a'), mio('b')];

    expect(conCirculoActualizado(lista, mio('z'))).toEqual(lista);
  });
});

describe('conCirculoAgregado', () => {
  it('agrega al final', () => {
    const nueva = conCirculoAgregado([mio('a'), mio('b')], mio('c'));

    expect(nueva.map((m) => m.circulo.id)).toEqual(['a', 'b', 'c']);
  });

  it('si ya estaba lo reemplaza en su lugar y no lo repite', () => {
    const nueva = conCirculoAgregado([mio('a', 'Uno'), mio('b', 'Dos')], mio('a', 'Uno cambiado'));

    expect(nueva).toHaveLength(2);
    expect(nueva[0].circulo.nombre).toBe('Uno cambiado');
  });

  it('no modifica la lista original', () => {
    const lista = [mio('a')];
    conCirculoAgregado(lista, mio('b'));

    expect(lista).toHaveLength(1);
  });

  it('funciona con una lista vacía', () => {
    expect(conCirculoAgregado([], mio('a')).map((m) => m.circulo.id)).toEqual(['a']);
  });
});

describe('enFormacionPendientes', () => {
  it('quita los que ya aparecen en curso', () => {
    const pendientes = enFormacionPendientes([formando('a'), formando('b')], [mio('a')]);

    expect(pendientes.map((f) => f.id)).toEqual(['b']);
  });

  it('conserva el orden y no modifica la lista', () => {
    const lista = [formando('a'), formando('b'), formando('c')];

    expect(enFormacionPendientes(lista, []).map((f) => f.id)).toEqual(['a', 'b', 'c']);
    expect(lista).toHaveLength(3);
  });
});
