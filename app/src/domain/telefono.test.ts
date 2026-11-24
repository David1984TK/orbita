import {
  esTelefonoValido,
  formatearTelefono,
  normalizarTelefono,
} from './telefono';

describe('normalizarTelefono', () => {
  it('deja solo los dígitos', () => {
    expect(normalizarTelefono('55 1234-5678')).toBe('5512345678');
    expect(normalizarTelefono('(55) 1234 5678')).toBe('5512345678');
  });

  it('ignora las letras', () => {
    expect(normalizarTelefono('55abc12')).toBe('5512');
  });

  it('quita la lada del país cuando se pega el número completo', () => {
    // Así llega un número copiado desde WhatsApp o desde los contactos.
    expect(normalizarTelefono('+52 55 1234 5678')).toBe('5512345678');
    expect(normalizarTelefono('525512345678')).toBe('5512345678');
  });

  it('no confunde un número que empieza con 52 con la lada del país', () => {
    // Diez dígitos que casualmente empiezan con 52: el número es ese, completo.
    expect(normalizarTelefono('5212345678')).toBe('5212345678');
  });

  it('recorta lo que sobre de los 10 dígitos', () => {
    expect(normalizarTelefono('55123456789999')).toBe('5512345678');
  });

  it('un texto vacío queda vacío', () => {
    expect(normalizarTelefono('')).toBe('');
  });
});

describe('formatearTelefono', () => {
  // El formato del diseño es "55 1234 5678". Sin espacios sobrantes al final:
  // si hubiera uno, al borrar un dígito el cursor se atoraría en el espacio.
  it.each([
    ['', ''],
    ['5', '5'],
    ['55', '55'],
    ['551', '55 1'],
    ['551234', '55 1234'],
    ['5512345', '55 1234 5'],
    ['5512345678', '55 1234 5678'],
  ])('"%s" se muestra como "%s"', (digitos, esperado) => {
    expect(formatearTelefono(digitos)).toBe(esperado);
  });
});

describe('esTelefonoValido', () => {
  it('acepta exactamente 10 dígitos, con o sin formato', () => {
    expect(esTelefonoValido('5512345678')).toBe(true);
    expect(esTelefonoValido('55 1234 5678')).toBe(true);
    expect(esTelefonoValido('+52 55 1234 5678')).toBe(true);
  });

  it('rechaza los que están incompletos', () => {
    expect(esTelefonoValido('')).toBe(false);
    expect(esTelefonoValido('551234567')).toBe(false); // 9 dígitos
  });
});
