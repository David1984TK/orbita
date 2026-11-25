import type { CirculoEnFormacion } from './formacion';
import {
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
