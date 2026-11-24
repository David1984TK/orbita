import { crearIdentidad } from './identidad';

describe('identidad simulada (solo desarrollo)', () => {
  it('da la verificación por buena', async () => {
    await expect(crearIdentidad(true).verificar()).resolves.toBeUndefined();
  });
});

describe('identidad fuera de desarrollo', () => {
  it('nunca da por verificada a nadie: falla por no haber proveedor', async () => {
    await expect(crearIdentidad(false).verificar()).rejects.toThrow();
  });
});
