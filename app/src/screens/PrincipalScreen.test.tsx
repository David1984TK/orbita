import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import type { MiCirculo } from '../domain';
import type { Aportes } from '../servicios/aportes';
import { circuloDeEjemplo } from '../servicios/circulos';
import type { Circulos } from '../servicios/circulos';
import { PrincipalScreen } from './PrincipalScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrir(
  obtener: () => Promise<MiCirculo> = async () => circuloDeEjemplo(),
  aportar: Aportes['aportar'] = async () => ({ ok: true }),
) {
  const circulos: Circulos = { obtenerMiCirculo: jest.fn(obtener) };
  const aportes: Aportes = { aportar: jest.fn(aportar) };
  await render(<PrincipalScreen circulos={circulos} aportes={aportes} />);
  return { circulos, aportes };
}

const botonConfirmar = () => screen.getByRole('button', { name: /Confirmar con/ });

const pestana = (nombre: string) => screen.getByRole('tab', { name: nombre });

describe('PrincipalScreen', () => {
  it('abre en "Círculo" con las tres pestañas', async () => {
    await abrir();

    expect(await screen.findByText('Los del mercado')).toBeTruthy();
    expect(pestana('Círculo').props.accessibilityState.selected).toBe(true);
    expect(pestana('Grupo').props.accessibilityState.selected).toBe(false);
    expect(pestana('Perfil').props.accessibilityState.selected).toBe(false);
  });

  it('mientras carga lo dice, y después muestra el círculo', async () => {
    let terminar: (miCirculo: MiCirculo) => void = () => {};
    await abrir(() => new Promise<MiCirculo>((resolver) => (terminar = resolver)));

    expect(screen.getByText('Cargando tu círculo…')).toBeTruthy();
    expect(screen.queryByText('Los del mercado')).toBeNull();

    terminar(circuloDeEjemplo());
    expect(await screen.findByText('Los del mercado')).toBeTruthy();
    expect(screen.queryByText('Cargando tu círculo…')).toBeNull();
  });

  it('si no puede cargar avisa y deja reintentar', async () => {
    let intentos = 0;
    await abrir(async () => {
      intentos += 1;
      if (intentos === 1) {
        throw new Error('sin conexión');
      }
      return circuloDeEjemplo();
    });

    expect(await screen.findByText(/No pudimos cargar tu círculo/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Los del mercado')).toBeTruthy();
    expect(screen.queryByText(/No pudimos cargar tu círculo/)).toBeNull();
  });

  it('cambia de pestaña y regresa al círculo sin volver a cargarlo', async () => {
    const { circulos } = await abrir();
    await screen.findByText('Los del mercado');

    await fireEvent.press(pestana('Grupo'));
    expect(screen.getByText(/Aquí va «El grupo»/)).toBeTruthy();
    expect(pestana('Grupo').props.accessibilityState.selected).toBe(true);

    await fireEvent.press(pestana('Perfil'));
    expect(screen.getByText(/Aquí va «Mi historial»/)).toBeTruthy();

    await fireEvent.press(pestana('Círculo'));
    expect(screen.getByText('Los del mercado')).toBeTruthy();
    expect(circulos.obtenerMiCirculo).toHaveBeenCalledTimes(1);
  });

  it('"Aportar mi cuota" abre la pantalla de aportar, sin la barra de pestañas', async () => {
    await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));

    expect(screen.getByText('Se descuenta de tu cuenta')).toBeTruthy();
    expect(screen.getByText('$603')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Círculo' })).toBeNull();
  });

  it('"Volver" regresa a Mi círculo sin aportar y con la barra de pestañas', async () => {
    const { aportes } = await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText('Los del mercado')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aportar mi cuota' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
    expect(aportes.aportar).not.toHaveBeenCalled();
  });

  it('el botón de atrás de Android cierra Aportar en vez de salir de la app', async () => {
    let atras: Parameters<typeof BackHandler.addEventListener>[1] = () => false;
    const espia = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_evento, manejador) => {
        atras = manejador;
        return { remove: jest.fn() };
      });
    await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));
    expect(screen.getByText('Se descuenta de tu cuenta')).toBeTruthy();

    await act(async () => {
      expect(atras({} as never)).toBe(true);
    });

    expect(screen.queryByText('Se descuenta de tu cuenta')).toBeNull();
    expect(screen.getByText('Los del mercado')).toBeTruthy();
    espia.mockRestore();
  });

  it('al aportar manda el total al servicio y Mi círculo queda al día', async () => {
    const { aportes } = await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));

    await fireEvent.press(botonConfirmar());

    expect(aportes.aportar).toHaveBeenCalledWith('los-del-mercado', 603);
    expect(await screen.findByText('Ya aportaste esta semana')).toBeTruthy();
    expect(screen.getByText('6 de 15 cuotas, todas a tiempo')).toBeTruthy();
    expect(screen.getByText('$3,600')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Aportar mi cuota' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
  });

  it('si el aporte falla se queda en Aportar y Mi círculo no cambia', async () => {
    await abrir(undefined, async () => ({ ok: false, motivo: 'error' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));

    await fireEvent.press(botonConfirmar());

    expect(await screen.findByText(/No pudimos completar tu aporte/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByText('5 de 15 cuotas, todas a tiempo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aportar mi cuota' })).toBeTruthy();
  });

  it('si la persona cancela la confirmación sigue en Aportar y no se registra nada', async () => {
    await abrir(undefined, async () => ({ ok: false, motivo: 'cancelada' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));

    await fireEvent.press(botonConfirmar());

    expect(screen.getByText('Se descuenta de tu cuenta')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
