import { crearRetiros } from './retiros';

describe('retiros simulados (solo desarrollo)', () => {
  it('dan el retiro por bueno', async () => {
    await expect(crearRetiros(true).retirar('los-del-mercado', 8865)).resolves.toEqual({ ok: true });
  });
});

describe('retiros fuera de desarrollo', () => {
  it('nunca dicen "retiraste": fallan por no haber contratos', async () => {
    await expect(crearRetiros(false).retirar('los-del-mercado', 8865)).rejects.toThrow();
  });
});
