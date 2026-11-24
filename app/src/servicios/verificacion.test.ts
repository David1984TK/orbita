import { CODIGO_DE_PRUEBA, crearVerificacion } from './verificacion';

describe('verificación simulada (solo desarrollo)', () => {
  const verificacion = crearVerificacion(true);

  it('acepta el código de prueba y rechaza cualquier otro', async () => {
    await expect(verificacion.verificarCodigo('5512345678', CODIGO_DE_PRUEBA)).resolves.toBe(true);
    await expect(verificacion.verificarCodigo('5512345678', '000000')).resolves.toBe(false);
  });
});

describe('verificación fuera de desarrollo', () => {
  const verificacion = crearVerificacion(false);

  it('nunca acepta un código: falla por no haber servidor', async () => {
    await expect(verificacion.verificarCodigo('5512345678', CODIGO_DE_PRUEBA)).rejects.toThrow();
    await expect(verificacion.enviarCodigo('5512345678')).rejects.toThrow();
  });
});
