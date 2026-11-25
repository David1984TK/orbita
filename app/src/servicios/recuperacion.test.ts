import { HORAS_SIN_RETIRAR, resumenDeConfirmaciones } from '../domain';
import { crearRecuperacion, solicitudDeEjemplo } from './recuperacion';

describe('recuperación simulada (solo desarrollo)', () => {
  it('da la selfie por buena', async () => {
    await expect(crearRecuperacion(true).verificarSelfie()).resolves.toEqual({ ok: true });
  });

  it('el grupo confirma poco a poco: primero falta una confirmación y luego está completo', async () => {
    const recuperacion = crearRecuperacion(true);

    const primera = await recuperacion.obtenerConfirmaciones();
    const segunda = await recuperacion.obtenerConfirmaciones();

    expect(primera.personas).toHaveLength(3);
    expect(resumenDeConfirmaciones(primera.personas)).toMatchObject({ confirmaron: 1, faltan: 1 });
    expect(resumenDeConfirmaciones(segunda.personas)).toMatchObject({ confirmaron: 2, completo: true });
    expect(primera.circuloNombre).toBe('Los del mercado');
  });

  it('una selfie nueva reinicia el avance del grupo', async () => {
    const recuperacion = crearRecuperacion(true);
    await recuperacion.obtenerConfirmaciones();
    await recuperacion.obtenerConfirmaciones();

    await recuperacion.verificarSelfie();
    const otraVez = await recuperacion.obtenerConfirmaciones();

    expect(resumenDeConfirmaciones(otraVez.personas).completo).toBe(false);
  });

  it('al completar cuenta cómo quedó todo y congela el retiro 72 horas', async () => {
    const antes = Date.now();
    const resumen = await crearRecuperacion(true).completar();
    const despues = Date.now();

    expect(resumen).toMatchObject({ cuotasPagadas: 6, cobraEnSemana: 13, puntaje: 340 });
    const hasta = new Date(resumen.retiroCongeladoHasta).getTime();
    expect(hasta).toBeGreaterThanOrEqual(antes + HORAS_SIN_RETIRAR * 3600 * 1000);
    expect(hasta).toBeLessThanOrEqual(despues + HORAS_SIN_RETIRAR * 3600 * 1000);
  });

  it('hay una solicitud pendiente de alguien del círculo y desaparece al responderla', async () => {
    const recuperacion = crearRecuperacion(true);

    expect(await recuperacion.obtenerSolicitudPendiente()).toEqual(solicitudDeEjemplo());
    await recuperacion.responderSolicitud('solicitud-julio', 'confirmo');

    expect(await recuperacion.obtenerSolicitudPendiente()).toBeNull();
  });

  it('cada servicio es independiente: responder en uno no afecta a otro', async () => {
    const uno = crearRecuperacion(true);
    const otro = crearRecuperacion(true);
    await uno.responderSolicitud('solicitud-julio', 'no-lo-reconozco');

    expect(await otro.obtenerSolicitudPendiente()).not.toBeNull();
  });
});

describe('recuperación fuera de desarrollo', () => {
  const recuperacion = crearRecuperacion(false);

  it('nunca da por recuperado el acceso: todo falla por no haber servidor', async () => {
    await expect(recuperacion.verificarSelfie()).rejects.toThrow();
    await expect(recuperacion.obtenerConfirmaciones()).rejects.toThrow();
    await expect(recuperacion.avisarAlGrupo()).rejects.toThrow();
    await expect(recuperacion.completar()).rejects.toThrow();
    await expect(recuperacion.obtenerSolicitudPendiente()).rejects.toThrow();
    await expect(recuperacion.responderSolicitud('x', 'confirmo')).rejects.toThrow();
  });
});
