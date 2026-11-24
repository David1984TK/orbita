import { fireEvent, render, screen } from '@testing-library/react-native';
import type { MiCirculo } from '../domain';
import { circuloDeEjemplo } from '../servicios/circulos';
import type { Circulos } from '../servicios/circulos';
import { PrincipalScreen } from './PrincipalScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrir(obtener: () => Promise<MiCirculo> = async () => circuloDeEjemplo()) {
  const circulos: Circulos = { obtenerMiCirculo: jest.fn(obtener) };
  await render(<PrincipalScreen circulos={circulos} />);
  return { circulos };
}

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

  it('"Aportar mi cuota" abre la pantalla de aportar y se puede volver', async () => {
    await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));

    expect(screen.getByText(/Aquí va «Aportar»/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText('Los del mercado')).toBeTruthy();
  });

  it('al cambiar de pestaña se cierra "Aportar"', async () => {
    await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));

    await fireEvent.press(pestana('Grupo'));
    await fireEvent.press(pestana('Círculo'));

    expect(screen.getByText('Los del mercado')).toBeTruthy();
    expect(screen.queryByText(/Aquí va «Aportar»/)).toBeNull();
  });
});
