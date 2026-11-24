import { crearLlave } from './llave';

describe('llave simulada (solo desarrollo)', () => {
  it('crea la llave sin pedir nada', async () => {
    await expect(crearLlave(true).crearLlave('5512345678')).resolves.toEqual({ ok: true });
  });
});

describe('llave fuera de desarrollo', () => {
  it('nunca finge haber creado una llave: falla por no haber passkeys reales', async () => {
    await expect(crearLlave(false).crearLlave('5512345678')).rejects.toThrow();
  });
});
