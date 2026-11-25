import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import type { Llave, ResultadoLlave } from '../servicios/llave';
import type {
  EstadoDeLaConfirmacion,
  Recuperacion,
  ResultadoDeSelfie,
  ResumenDeRecuperacion,
} from '../servicios/recuperacion';
import type { Verificacion } from '../servicios/verificacion';
import { CODIGO_DE_PRUEBA } from '../servicios/verificacion';
import { RecuperarFlow } from './RecuperarFlow';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const TELEFONO = '5598765432';
const resumen: ResumenDeRecuperacion = {
  cuotasPagadas: 6,
  cobraEnSemana: 13,
  puntaje: 340,
  retiroCongeladoHasta: '2026-11-27T12:00:00Z',
};

const incompleto: EstadoDeLaConfirmacion = {
  circuloNombre: 'Los del mercado',
  personas: [
    { id: 'rosa', nombre: 'Rosa Martínez', estado: 'confirmo', haceMinutos: 4 },
    { id: 'julio', nombre: 'Julio Lara', estado: 'esperando' },
    { id: 'ana', nombre: 'Ana Torres', estado: 'esperando' },
  ],
};
const completo: EstadoDeLaConfirmacion = {
  circuloNombre: 'Los del mercado',
  personas: [
    incompleto.personas[0],
    { id: 'julio', nombre: 'Julio Lara', estado: 'confirmo', haceMinutos: 0 },
    incompleto.personas[2],
  ],
};

type Opciones = {
  selfie?: () => Promise<ResultadoDeSelfie>;
  grupo?: () => Promise<EstadoDeLaConfirmacion>;
  crearLlave?: () => Promise<ResultadoLlave>;
};

async function abrir({ selfie, grupo, crearLlave }: Opciones = {}) {
  const verificacion: Verificacion = {
    enviarCodigo: jest.fn(async () => {}),
    verificarCodigo: jest.fn(async (_telefono, codigo) => codigo === CODIGO_DE_PRUEBA),
  };
  const llave: Llave = {
    crearLlave: jest.fn(crearLlave ?? (async (): Promise<ResultadoLlave> => ({ ok: true }))),
  };
  const recuperacion: Recuperacion = {
    verificarSelfie: jest.fn(selfie ?? (async (): Promise<ResultadoDeSelfie> => ({ ok: true }))),
    obtenerConfirmaciones: jest.fn(grupo ?? (async () => completo)),
    avisarAlGrupo: jest.fn(async () => {}),
    completar: jest.fn(async () => resumen),
    obtenerSolicitudPendiente: jest.fn(async () => null),
    responderSolicitud: jest.fn(async () => {}),
  };
  const onCancelar = jest.fn();
  const onTerminar = jest.fn();
  await render(
    <RecuperarFlow
      verificacion={verificacion}
      llave={llave}
      recuperacion={recuperacion}
      onCancelar={onCancelar}
      onTerminar={onTerminar}
    />,
  );
  return { verificacion, llave, recuperacion, onCancelar, onTerminar };
}

const ETIQUETA_TELEFONO = 'Número de teléfono celular, 10 dígitos';

async function hastaElCodigo() {
  await fireEvent.changeText(screen.getByLabelText(ETIQUETA_TELEFONO), TELEFONO);
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
}

async function hastaLaSelfie() {
  await hastaElCodigo();
  await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), CODIGO_DE_PRUEBA);
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Mírate a la cámara');
}

describe('RecuperarFlow', () => {
  it('empieza en "Recuperar mi acceso"', async () => {
    await abrir();

    expect(screen.getByText('Recuperar mi acceso')).toBeTruthy();
  });

  it('del teléfono pasa al código, que se manda a ese número', async () => {
    const { verificacion } = await abrir();

    await hastaElCodigo();

    expect(verificacion.enviarCodigo).toHaveBeenCalledWith(TELEFONO);
    expect(screen.getByText('Te lo mandamos por WhatsApp al 55 9876 5432')).toBeTruthy();
  });

  it('"Cambiar número" regresa al teléfono', async () => {
    await abrir();
    await hastaElCodigo();

    await fireEvent.press(screen.getByText('Cambiar número'));

    expect(screen.getByText('Recuperar mi acceso')).toBeTruthy();
  });

  it('con un código equivocado se queda en el código', async () => {
    await abrir();
    await hastaElCodigo();

    await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '000000');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/no es correcto/)).toBeTruthy();
    expect(screen.queryByText('Mírate a la cámara')).toBeNull();
  });

  it('con el código correcto pasa a la selfie', async () => {
    const { verificacion } = await abrir();

    await hastaLaSelfie();

    expect(verificacion.verificarCodigo).toHaveBeenCalledWith(TELEFONO, CODIGO_DE_PRUEBA);
    expect(screen.getByText('Paso 2 de 3')).toBeTruthy();
  });

  it('si la selfie no coincide se queda en la selfie', async () => {
    await abrir({ selfie: async () => ({ ok: false, motivo: 'no-coincide' }) });
    await hastaLaSelfie();

    await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));

    expect(await screen.findByText(/No pudimos confirmar que eres tú/)).toBeTruthy();
    expect(screen.queryByText('Tu grupo confirma')).toBeNull();
  });

  it('con la selfie buena pasa a que el grupo confirme', async () => {
    await abrir({ grupo: async () => incompleto });
    await hastaLaSelfie();

    await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));

    expect(await screen.findByText('Tu grupo confirma')).toBeTruthy();
    expect(await screen.findByText('Falta una confirmación.')).toBeTruthy();
  });

  it('mientras falten confirmaciones no pide la llave', async () => {
    const { llave } = await abrir({ grupo: async () => incompleto });
    await hastaLaSelfie();
    await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));
    await screen.findByText('Falta una confirmación.');

    expect(screen.queryByText('Crea tu llave')).toBeNull();
    expect(llave.crearLlave).not.toHaveBeenCalled();
  });

  it('cuando el grupo confirma pide crear la llave nueva, para el mismo teléfono', async () => {
    const { llave } = await abrir();
    await hastaLaSelfie();

    await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));
    expect(await screen.findByText('Crea tu llave')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Activar/ }));

    expect(llave.crearLlave).toHaveBeenCalledWith(TELEFONO);
  });

  it('si la persona cancela la llave nueva no se da por recuperado el acceso', async () => {
    const { recuperacion } = await abrir({ crearLlave: async () => ({ ok: false, motivo: 'cancelada' }) });
    await hastaLaSelfie();
    await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));
    await screen.findByText('Crea tu llave');

    await fireEvent.press(screen.getByRole('button', { name: /Activar/ }));

    expect(recuperacion.completar).not.toHaveBeenCalled();
    expect(screen.queryByText('Recuperaste tu acceso')).toBeNull();
  });

  it('con la llave creada cierra la recuperación y dice cómo quedó todo', async () => {
    const { recuperacion } = await abrir();
    await hastaLaSelfie();
    await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));
    await screen.findByText('Crea tu llave');

    await fireEvent.press(screen.getByRole('button', { name: /Activar/ }));

    expect(await screen.findByText('Recuperaste tu acceso')).toBeTruthy();
    expect(recuperacion.completar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('6 cuotas pagadas · cobras en la semana 13')).toBeTruthy();
  });

  it('"Entrar a mi círculo" termina la recuperación y entrega el resumen', async () => {
    const { onTerminar } = await abrir();
    await hastaLaSelfie();
    await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));
    await screen.findByText('Crea tu llave');
    await fireEvent.press(screen.getByRole('button', { name: /Activar/ }));
    await screen.findByText('Recuperaste tu acceso');

    await fireEvent.press(screen.getByRole('button', { name: 'Entrar a mi círculo' }));

    expect(onTerminar).toHaveBeenCalledTimes(1);
    expect(onTerminar).toHaveBeenCalledWith(resumen);
  });

  it('"Volver" en el primer paso cancela la recuperación', async () => {
    const { onCancelar } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  describe('botón de atrás de Android', () => {
    let atras: Parameters<typeof BackHandler.addEventListener>[1] = () => false;
    let espia: jest.SpyInstance;

    beforeEach(() => {
      espia = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_evento, manejador) => {
        atras = manejador;
        return { remove: jest.fn() };
      });
    });
    afterEach(() => {
      espia.mockRestore();
    });

    it('en el primer paso cancela la recuperación', async () => {
      const { onCancelar } = await abrir();

      await act(async () => {
        expect(atras({} as never)).toBe(true);
      });

      expect(onCancelar).toHaveBeenCalledTimes(1);
    });

    it('en el código regresa al teléfono', async () => {
      const { onCancelar } = await abrir();
      await hastaElCodigo();

      await act(async () => {
        expect(atras({} as never)).toBe(true);
      });

      expect(screen.getByText('Recuperar mi acceso')).toBeTruthy();
      expect(onCancelar).not.toHaveBeenCalled();
    });
  });
});
