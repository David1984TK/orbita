import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Confirmacion } from '../domain';
import type { EstadoDeLaConfirmacion } from '../servicios/recuperacion';
import { GrupoConfirmaScreen } from './GrupoConfirmaScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const rosa: Confirmacion = { id: 'rosa', nombre: 'Rosa Martínez', estado: 'confirmo', haceMinutos: 4 };
const julio: Confirmacion = { id: 'julio', nombre: 'Julio Lara', estado: 'esperando' };
const ana: Confirmacion = { id: 'ana', nombre: 'Ana Torres', estado: 'esperando' };

const estado = (personas: Confirmacion[]): EstadoDeLaConfirmacion => ({
  circuloNombre: 'Los del mercado',
  personas,
});

const INTERVALO = 5000;

async function pasar(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

async function abrir(
  obtener: () => Promise<EstadoDeLaConfirmacion> = async () => estado([rosa, julio, ana]),
  onAvisar: () => Promise<void> = async () => {},
) {
  const consultar = jest.fn(obtener);
  const avisar = jest.fn(onAvisar);
  const onConfirmado = jest.fn();
  await render(
    <GrupoConfirmaScreen
      obtener={consultar}
      onAvisar={avisar}
      onConfirmado={onConfirmado}
      intervaloMs={INTERVALO}
    />,
  );
  await act(async () => {});
  return { consultar, avisar, onConfirmado };
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('GrupoConfirmaScreen', () => {
  it('dice en qué paso va y a cuántas personas se les preguntó', async () => {
    await abrir();

    expect(screen.getByText('Paso 3 de 3')).toBeTruthy();
    expect(screen.getByText('Tu grupo confirma')).toBeTruthy();
    expect(screen.getByLabelText('Paso 3 de 3')).toBeTruthy();
    expect(screen.getByText('Les preguntamos a 3 personas de Los del mercado')).toBeTruthy();
  });

  it('muestra a cada persona con su nombre, cuándo respondió y su etiqueta', async () => {
    await abrir();

    expect(screen.getByLabelText('Rosa Martínez, Hace 4 minutos, Confirmó')).toBeTruthy();
    expect(screen.getByLabelText('Julio Lara, Le llegó el aviso, Esperando')).toBeTruthy();
    expect(screen.getByLabelText('Ana Torres, Le llegó el aviso, Esperando')).toBeTruthy();
    expect(screen.getByText('Confirmó')).toBeTruthy();
    expect(screen.getAllByText('Esperando')).toHaveLength(2);
  });

  it('dice cuántas confirmaciones faltan', async () => {
    await abrir();

    expect(screen.getByText('Falta una confirmación.')).toBeTruthy();
    expect(screen.getByText(/Puedes\s+escribirles por WhatsApp para apurarlos\./)).toBeTruthy();
  });

  it('siempre hay salida: si nadie responde, se recupera en 7 días', async () => {
    await abrir();

    expect(screen.getByText('Si nadie responde, recuperas el acceso solo en 7 días.')).toBeTruthy();
  });

  it('antes de la primera respuesta dice que está revisando', async () => {
    let terminar: (e: EstadoDeLaConfirmacion) => void = () => {};
    await render(
      <GrupoConfirmaScreen
        obtener={() => new Promise<EstadoDeLaConfirmacion>((r) => (terminar = r))}
        onAvisar={async () => {}}
        onConfirmado={() => {}}
        intervaloMs={INTERVALO}
      />,
    );

    expect(screen.getByText('Revisando quién ya confirmó…')).toBeTruthy();

    await act(async () => terminar(estado([rosa, julio, ana])));
    expect(screen.queryByText('Revisando quién ya confirmó…')).toBeNull();
  });

  it('vuelve a consultar solo cada pocos segundos', async () => {
    const { consultar } = await abrir();
    expect(consultar).toHaveBeenCalledTimes(1);

    await pasar(INTERVALO);
    expect(consultar).toHaveBeenCalledTimes(2);

    await pasar(INTERVALO);
    expect(consultar).toHaveBeenCalledTimes(3);
  });

  it('en cuanto hay las confirmaciones necesarias avanza, y solo una vez', async () => {
    let respuestas = [estado([rosa, julio, ana])];
    const completo = estado([rosa, { ...julio, estado: 'confirmo', haceMinutos: 0 }, ana]);
    const { onConfirmado } = await abrir(async () => respuestas[0]);
    expect(onConfirmado).not.toHaveBeenCalled();

    respuestas = [completo];
    await pasar(INTERVALO);
    expect(onConfirmado).toHaveBeenCalledTimes(1);

    await pasar(INTERVALO * 3);
    expect(onConfirmado).toHaveBeenCalledTimes(1);
  });

  it('si ya estaba completo desde la primera consulta, avanza de inmediato', async () => {
    const { onConfirmado } = await abrir(async () =>
      estado([rosa, { ...julio, estado: 'confirmo', haceMinutos: 1 }, ana]),
    );

    expect(onConfirmado).toHaveBeenCalledTimes(1);
  });

  it('quien dijo que no no cuenta: sigue faltando', async () => {
    const { onConfirmado } = await abrir(async () =>
      estado([rosa, { ...julio, estado: 'rechazo', haceMinutos: 2 }, ana]),
    );

    expect(screen.getByText('Dijo que no')).toBeTruthy();
    expect(screen.getByText('Falta una confirmación.')).toBeTruthy();
    expect(onConfirmado).not.toHaveBeenCalled();
  });

  it('si no puede consultar avisa, sigue intentando y lo quita al conseguirlo', async () => {
    let falla = true;
    await abrir(async () => {
      if (falla) {
        throw new Error('sin conexión');
      }
      return estado([rosa, julio, ana]);
    });

    expect(screen.getByText(/No pudimos revisar las confirmaciones\. Seguimos intentando\./)).toBeTruthy();

    falla = false;
    await pasar(INTERVALO);

    expect(screen.queryByText(/No pudimos revisar las confirmaciones/)).toBeNull();
    expect(screen.getByText('Falta una confirmación.')).toBeTruthy();
  });

  it('"Avisarles por WhatsApp" manda otro aviso y lo confirma', async () => {
    const { avisar } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Avisarles por WhatsApp' }));

    expect(avisar).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Les mandamos otro aviso.')).toBeTruthy();
  });

  it('si el aviso falla lo dice', async () => {
    await abrir(undefined, async () => {
      throw new Error('sin conexión');
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Avisarles por WhatsApp' }));

    expect(await screen.findByText('No pudimos mandar el aviso. Inténtalo de nuevo.')).toBeTruthy();
  });

  it('mientras avisa no deja avisar dos veces', async () => {
    let terminar: () => void = () => {};
    const { avisar } = await abrir(undefined, () => new Promise<void>((r) => (terminar = r)));

    await fireEvent.press(screen.getByRole('button', { name: 'Avisarles por WhatsApp' }));
    expect(screen.getByText('Avisando…')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Avisando/ }));

    expect(avisar).toHaveBeenCalledTimes(1);
    await act(async () => terminar());
  });

  it('al salir de la pantalla deja de consultar', async () => {
    const consultar = jest.fn(async () => estado([rosa, julio, ana]));
    const { unmount } = await render(
      <GrupoConfirmaScreen
        obtener={consultar}
        onAvisar={async () => {}}
        onConfirmado={() => {}}
        intervaloMs={INTERVALO}
      />,
    );
    await act(async () => {});
    const antes = consultar.mock.calls.length;

    await unmount();
    await pasar(INTERVALO * 4);

    expect(consultar.mock.calls.length).toBe(antes);
  });
});
