import type { BorradorDeCirculo } from './nuevoCirculo';
import {
  ajustarIntegrantes,
  cuotaDeTexto,
  esBorradorValido,
  MAX_DIGITOS_CUOTA,
  MAX_INTEGRANTES,
  MIN_INTEGRANTES,
  MONEDAS_DISPONIBLES,
  normalizarCuota,
  resumenDelBorrador,
  validarBorrador,
} from './nuevoCirculo';

const borrador = (cambios: Partial<BorradorDeCirculo> = {}): BorradorDeCirculo => ({
  nombre: 'Los del mercado',
  integrantes: 15,
  cuota: 600,
  moneda: 'pesos',
  ...cambios,
});

describe('normalizarCuota y cuotaDeTexto', () => {
  it('deja solo los dígitos', () => {
    expect(normalizarCuota('$ 1,250')).toBe('1250');
    expect(normalizarCuota('abc')).toBe('');
  });

  it('quita los ceros a la izquierda', () => {
    expect(normalizarCuota('007')).toBe('7');
    expect(normalizarCuota('000')).toBe('');
  });

  it('no pasa de 6 dígitos', () => {
    expect(normalizarCuota('12345678')).toHaveLength(MAX_DIGITOS_CUOTA);
    expect(normalizarCuota('12345678')).toBe('123456');
  });

  it('la cuota como número es cero si no hay nada escrito', () => {
    expect(cuotaDeTexto('')).toBe(0);
    expect(cuotaDeTexto('600')).toBe(600);
    expect(cuotaDeTexto('$0')).toBe(0);
  });
});

describe('ajustarIntegrantes', () => {
  it('sube y baja de uno en uno', () => {
    expect(ajustarIntegrantes(10, 1)).toBe(11);
    expect(ajustarIntegrantes(10, -1)).toBe(9);
  });

  it('no baja del mínimo ni sube del máximo', () => {
    expect(ajustarIntegrantes(MIN_INTEGRANTES, -1)).toBe(MIN_INTEGRANTES);
    expect(ajustarIntegrantes(MAX_INTEGRANTES, 1)).toBe(MAX_INTEGRANTES);
  });

  it('el rango es de 5 a 15', () => {
    expect([MIN_INTEGRANTES, MAX_INTEGRANTES]).toEqual([5, 15]);
  });
});

describe('validarBorrador', () => {
  it('un borrador completo no tiene errores', () => {
    expect(validarBorrador(borrador())).toEqual({});
    expect(esBorradorValido(borrador())).toBe(true);
  });

  it('pide un nombre, y espacios solos no cuentan', () => {
    expect(validarBorrador(borrador({ nombre: '' })).nombre).toMatch(/nombre/);
    expect(validarBorrador(borrador({ nombre: '   ' })).nombre).toMatch(/nombre/);
  });

  it('el nombre no puede ser larguísimo', () => {
    expect(validarBorrador(borrador({ nombre: 'a'.repeat(41) })).nombre).toMatch(/40/);
    expect(validarBorrador(borrador({ nombre: 'a'.repeat(40) })).nombre).toBeUndefined();
  });

  it('las integrantes van de 5 a 15 y son un número entero', () => {
    expect(validarBorrador(borrador({ integrantes: 4 })).integrantes).toMatch(/5 a 15/);
    expect(validarBorrador(borrador({ integrantes: 16 })).integrantes).toMatch(/5 a 15/);
    expect(validarBorrador(borrador({ integrantes: 7.5 })).integrantes).toMatch(/5 a 15/);
    expect(validarBorrador(borrador({ integrantes: 5 })).integrantes).toBeUndefined();
    expect(validarBorrador(borrador({ integrantes: 15 })).integrantes).toBeUndefined();
  });

  it('la cuota tiene que ser mayor que cero', () => {
    expect(validarBorrador(borrador({ cuota: 0 })).cuota).toMatch(/aporta/);
    expect(validarBorrador(borrador({ cuota: -5 })).cuota).toMatch(/aporta/);
    expect(validarBorrador(borrador({ cuota: Number.NaN })).cuota).toMatch(/aporta/);
  });

  it('por ahora solo se permiten los pesos', () => {
    expect(MONEDAS_DISPONIBLES).toEqual(['pesos']);
    expect(validarBorrador(borrador({ moneda: 'dolares' })).moneda).toMatch(/pesos/);
    expect(esBorradorValido(borrador({ moneda: 'dolares' }))).toBe(false);
  });

  it('junta todos los errores a la vez', () => {
    const errores = validarBorrador(borrador({ nombre: '', cuota: 0, integrantes: 2 }));

    expect(Object.keys(errores).sort()).toEqual(['cuota', 'integrantes', 'nombre']);
  });
});

describe('resumenDelBorrador', () => {
  it('15 personas con $600 duran 15 semanas y cada quien recibe $9,000', () => {
    const resumen = resumenDelBorrador(borrador(), '2026-11-24');

    expect(resumen).toMatchObject({ cuota: 600, semanas: 15, bote: 9000 });
  });

  it('el bote cambia con las integrantes y la cuota', () => {
    expect(resumenDelBorrador(borrador({ integrantes: 5, cuota: 300 }), '2026-11-24').bote).toBe(1500);
  });

  it('termina una semana por integrante después de hoy', () => {
    // 15 semanas = 105 días desde el 24 de noviembre de 2026.
    expect(resumenDelBorrador(borrador(), '2026-11-24').termina).toBe('2027-03-09');
    expect(resumenDelBorrador(borrador({ integrantes: 5 }), '2026-11-24').termina).toBe('2026-12-29');
  });
});
