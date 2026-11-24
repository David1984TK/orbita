import { crearAportes } from './aportes';

describe('aportes simulados (solo desarrollo)', () => {
  it('dan el aporte por bueno', async () => {
    await expect(crearAportes(true).aportar('los-del-mercado', 603)).resolves.toEqual({ ok: true });
  });
});

describe('aportes fuera de desarrollo', () => {
  it('nunca dicen "aportaste": fallan por no haber contratos', async () => {
    await expect(crearAportes(false).aportar('los-del-mercado', 603)).rejects.toThrow();
  });
});
