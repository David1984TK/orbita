import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Historial } from '../domain';
import { historialDeEjemplo } from '../servicios/historial';
import type { Historiales } from '../servicios/historial';
import { PerfilScreen } from './PerfilScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrir(obtener: () => Promise<Historial> = async () => historialDeEjemplo()) {
  const historiales: Historiales = { obtenerMiHistorial: jest.fn(obtener) };
  await render(<PerfilScreen historiales={historiales} />);
  return { historiales };
}

describe('PerfilScreen', () => {
  it('pide el historial y lo muestra', async () => {
    const { historiales } = await abrir();

    expect(await screen.findByText('Mi historial')).toBeTruthy();
    expect(screen.getByText('Básico')).toBeTruthy();
    expect(historiales.obtenerMiHistorial).toHaveBeenCalledTimes(1);
  });

  it('mientras carga lo dice, y después muestra el historial', async () => {
    let terminar: (historial: Historial) => void = () => {};
    await abrir(() => new Promise<Historial>((resolver) => (terminar = resolver)));

    expect(screen.getByText('Cargando tu historial…')).toBeTruthy();
    expect(screen.queryByText('Mi historial')).toBeNull();

    terminar(historialDeEjemplo());
    expect(await screen.findByText('Mi historial')).toBeTruthy();
    expect(screen.queryByText('Cargando tu historial…')).toBeNull();
  });

  it('si no puede cargar avisa y deja reintentar', async () => {
    let intentos = 0;
    await abrir(async () => {
      intentos += 1;
      if (intentos === 1) {
        throw new Error('sin conexión');
      }
      return historialDeEjemplo();
    });

    expect(await screen.findByText(/No pudimos cargar tu historial/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Mi historial')).toBeTruthy();
    expect(screen.queryByText(/No pudimos cargar tu historial/)).toBeNull();
  });

  it('"Compartir mi historial" abre un marcador de lugar y se puede volver', async () => {
    await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: /Compartir mi historial/ }));

    expect(screen.getByText(/Aquí va «Compartir mi historial»/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText('Mi historial')).toBeTruthy();
  });
});
