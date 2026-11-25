import {
  fechaDeHoy,
  fechaLocalDe,
  formatearFecha,
  formatearFechaConDia,
  formatearMonto,
  sumarDias,
} from './formato';

describe('sumarDias', () => {
  it('suma una semana dentro del mismo mes y entre meses', () => {
    expect(sumarDias('2026-10-19', 7)).toBe('2026-10-26');
    expect(sumarDias('2026-10-26', 7)).toBe('2026-11-02');
  });

  it('cruza el fin de año', () => {
    expect(sumarDias('2026-12-28', 7)).toBe('2027-01-04');
  });

  it('respeta los años bisiestos', () => {
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(sumarDias('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('con cero días devuelve la misma fecha', () => {
    expect(sumarDias('2026-10-26', 0)).toBe('2026-10-26');
  });

  it('rechaza fechas que no existen o mal escritas, en vez de corregirlas en silencio', () => {
    expect(() => sumarDias('2026-02-31', 1)).toThrow();
    expect(() => sumarDias('26/10/2026', 1)).toThrow();
    expect(() => sumarDias('', 1)).toThrow();
  });
});

describe('formatearFecha', () => {
  it('escribe el día y el mes en español, sin ceros', () => {
    expect(formatearFecha('2026-10-20')).toBe('20 de octubre');
    expect(formatearFecha('2026-09-08')).toBe('8 de septiembre');
    expect(formatearFecha('2027-01-01')).toBe('1 de enero');
  });
});

describe('formatearFechaConDia', () => {
  it('agrega el día de la semana correcto', () => {
    expect(formatearFechaConDia('2026-10-26')).toBe('lunes 26 de octubre');
    expect(formatearFechaConDia('2026-11-24')).toBe('martes 24 de noviembre');
    expect(formatearFechaConDia('2026-12-30')).toBe('miércoles 30 de diciembre');
  });
});

describe('formatearMonto', () => {
  it('pone comas de miles y no muestra centavos en enteros', () => {
    expect(formatearMonto(600, 'pesos')).toBe('$600');
    expect(formatearMonto(9000, 'pesos')).toBe('$9,000');
    expect(formatearMonto(1234567, 'pesos')).toBe('$1,234,567');
    expect(formatearMonto(0, 'pesos')).toBe('$0');
  });

  it('muestra dos decimales cuando hay centavos', () => {
    expect(formatearMonto(603.5, 'pesos')).toBe('$603.50');
    expect(formatearMonto(8865.05, 'pesos')).toBe('$8,865.05');
  });

  it('con "centavos" siempre muestra dos decimales, también en enteros', () => {
    expect(formatearMonto(600, 'pesos', { centavos: true })).toBe('$600.00');
    expect(formatearMonto(9000, 'pesos', { centavos: true })).toBe('$9,000.00');
    expect(formatearMonto(603.5, 'pesos', { centavos: true })).toBe('$603.50');
  });

  it('distingue los dólares de los pesos', () => {
    expect(formatearMonto(600, 'dolares')).toBe('US$600');
  });

  it('un monto negativo lleva el signo antes del símbolo', () => {
    expect(formatearMonto(-1800, 'pesos')).toBe('−$1,800');
  });
});

describe('fechaDeHoy', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('da la fecha local en formato AAAA-MM-DD, con ceros', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 5, 10, 30));

    expect(fechaDeHoy()).toBe('2026-01-05');
  });

  it('a las 11 de la noche sigue siendo el mismo día local, no el siguiente en UTC', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 24, 23, 30));

    expect(fechaDeHoy()).toBe('2026-11-24');
  });
});

describe('fechaLocalDe', () => {
  it('da la fecha local de un instante, con ceros', () => {
    expect(fechaLocalDe(new Date(2027, 2, 9, 8, 0))).toBe('2027-03-09');
  });
});
