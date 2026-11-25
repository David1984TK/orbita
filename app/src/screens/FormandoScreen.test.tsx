import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { CirculoEnFormacion } from '../domain';
import { formacionDeEjemplo } from '../servicios/circulos';
import type { ResultadoDeCompartir } from '../servicios/compartir';
import { FormandoScreen } from './FormandoScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const INTERVALO = 5000;

// El círculo de ejemplo: "Los del mercado", 10 personas, $600 a la semana, y solo
// ha entrado quien lo creó (David Nava).
function conGente(cuantas: number): CirculoEnFormacion {
  const nombres = ['Rosa Martínez', 'Julio Lara', 'Ana Torres', 'Carmen Ruiz', 'Miguel Gómez'];
  return formacionDeEjemplo({
    participantes: [
      { id: 'yo', nombre: 'David Nava' },
      ...nombres.slice(0, cuantas - 1).map((nombre, i) => ({ id: `p${i}`, nombre })),
    ],
  });
}

async function pasar(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

type Opciones = {
  circulo?: CirculoEnFormacion;
  obtener?: () => Promise<CirculoEnFormacion>;
  compartir?: (mensaje: string) => Promise<ResultadoDeCompartir>;
  conVolver?: boolean;
};

async function abrir({ circulo = conGente(1), obtener, compartir, conVolver = false }: Opciones = {}) {
  const consultar = jest.fn(obtener ?? (async () => circulo));
  const onActualizado = jest.fn();
  const onCompartir = jest.fn(compartir ?? (async (): Promise<ResultadoDeCompartir> => 'compartido'));
  const onVolver = jest.fn();
  await render(
    <FormandoScreen
      circulo={circulo}
      obtener={consultar}
      onActualizado={onActualizado}
      onCompartir={onCompartir}
      onVolver={conVolver ? onVolver : undefined}
      intervaloMs={INTERVALO}
    />,
  );
  return { consultar, onActualizado, onCompartir, onVolver };
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('FormandoScreen', () => {
  it('dice que el círculo está en formación, su nombre y los números', async () => {
    await abrir();

    expect(screen.getByText('EN FORMACIÓN')).toBeTruthy();
    expect(screen.getByText('Los del mercado')).toBeTruthy();
    expect(screen.getByText('10 personas · $600 cada semana')).toBeTruthy();
  });

  it('dice cuántas personas faltan y que el círculo arranca cuando entren todas', async () => {
    await abrir({ circulo: conGente(1) });

    expect(screen.getByText('Faltan 9 personas')).toBeTruthy();
    expect(screen.getByText('Cuando entren todas, el círculo arranca.')).toBeTruthy();
  });

  it('con una sola persona por entrar lo dice en singular', async () => {
    await abrir({ circulo: formacionDeEjemplo({ integrantes: 5, participantes: conGente(5).participantes }) });
    expect(screen.getByText('Ya entraron todas')).toBeTruthy();

    await abrir({ circulo: formacionDeEjemplo({ integrantes: 5, participantes: conGente(4).participantes }) });
    expect(screen.getByText('Falta 1 persona')).toBeTruthy();
  });

  it('dibuja un lugar por integrante y se lee cuántos ya entraron', async () => {
    await abrir({ circulo: conGente(3) });

    expect(screen.getByLabelText('3 de 10 ya entraron')).toBeTruthy();
  });

  it('en la lista, quien creó el círculo aparece como "Tú" y las demás con su nombre', async () => {
    await abrir({ circulo: conGente(3) });

    expect(screen.getByLabelText('Tú, creaste el círculo')).toBeTruthy();
    expect(screen.getByLabelText('Rosa Martínez, entró')).toBeTruthy();
    expect(screen.getByLabelText('Julio Lara, entró')).toBeTruthy();
    expect(screen.queryByText('David Nava')).toBeNull();
  });

  it('recuerda cuánto aporta cada quien y cuánto recibe', async () => {
    await abrir();

    expect(
      screen.getByText(/Cada integrante aporta\s+\$600 durante 10 semanas\s+y recibe\s+\$6,000\s+en su turno\./),
    ).toBeTruthy();
  });

  it('muestra el enlace de invitación', async () => {
    await abrir();

    expect(screen.getByText('https://orbita.example/c/los-del-mercado-nuevo')).toBeTruthy();
    expect(screen.getByText('Invita por WhatsApp')).toBeTruthy();
  });

  describe('compartir', () => {
    it('"Compartir por WhatsApp" abre el cuadro de compartir con el mensaje de invitación', async () => {
      const { onCompartir } = await abrir();

      await fireEvent.press(screen.getByRole('button', { name: 'Compartir por WhatsApp' }));

      expect(onCompartir).toHaveBeenCalledTimes(1);
      expect(onCompartir).toHaveBeenCalledWith(
        'Te invito a «Los del mercado» en Órbita: 10 personas que ahorran juntas, con $600 cada ' +
          'semana, y cada quien recibe $6,000 en su turno. ' +
          'Entra aquí: https://orbita.example/c/los-del-mercado-nuevo',
      );
    });

    it('si mandó el enlace lo confirma', async () => {
      await abrir();

      await fireEvent.press(screen.getByRole('button', { name: 'Compartir por WhatsApp' }));

      expect(await screen.findByText('Mandaste el enlace.')).toBeTruthy();
    });

    it('si cierra el cuadro sin mandar nada no dice nada', async () => {
      await abrir({ compartir: async () => 'cancelado' });

      await fireEvent.press(screen.getByRole('button', { name: 'Compartir por WhatsApp' }));

      expect(screen.queryByText('Mandaste el enlace.')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('si no se pudo abrir el cuadro lo dice y se puede reintentar', async () => {
      await abrir({
        compartir: async () => {
          throw new Error('sin cuadro de compartir');
        },
      });

      await fireEvent.press(screen.getByRole('button', { name: 'Compartir por WhatsApp' }));

      expect(
        await screen.findByText('No pudimos abrir el cuadro de compartir. Inténtalo de nuevo.'),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Compartir por WhatsApp' }).props.accessibilityState.disabled,
      ).toBe(false);
    });

    it('mientras abre el cuadro no deja abrirlo dos veces', async () => {
      let terminar: (r: ResultadoDeCompartir) => void = () => {};
      const { onCompartir } = await abrir({
        compartir: () => new Promise<ResultadoDeCompartir>((r) => (terminar = r)),
      });

      await fireEvent.press(screen.getByRole('button', { name: 'Compartir por WhatsApp' }));
      expect(screen.getByText('Abriendo…')).toBeTruthy();
      await fireEvent.press(screen.getByRole('button', { name: /Abriendo/ }));

      expect(onCompartir).toHaveBeenCalledTimes(1);
      await act(async () => terminar('compartido'));
    });

    it('el aviso de error desaparece al volver a intentar', async () => {
      let falla = true;
      await abrir({
        compartir: async () => {
          if (falla) {
            throw new Error('sin cuadro');
          }
          return 'cancelado';
        },
      });
      await fireEvent.press(screen.getByRole('button', { name: 'Compartir por WhatsApp' }));
      await screen.findByText(/No pudimos abrir el cuadro de compartir/);

      falla = false;
      await fireEvent.press(screen.getByRole('button', { name: 'Compartir por WhatsApp' }));

      expect(screen.queryByText(/No pudimos abrir el cuadro de compartir/)).toBeNull();
    });
  });

  describe('avance en vivo', () => {
    it('consulta solo cada pocos segundos y muestra quién va entrando', async () => {
      const { consultar, onActualizado } = await abrir({
        circulo: conGente(1),
        obtener: async () => conGente(3),
      });
      expect(consultar).not.toHaveBeenCalled();

      await pasar(INTERVALO);

      expect(consultar).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Faltan 7 personas')).toBeTruthy();
      expect(screen.getByLabelText('Rosa Martínez, entró')).toBeTruthy();
      expect(onActualizado).toHaveBeenCalledWith(conGente(3));
    });

    it('cuando entran todas deja de consultar y ya no ofrece invitar', async () => {
      const lleno = formacionDeEjemplo({ integrantes: 5, participantes: conGente(5).participantes });
      const { consultar } = await abrir({
        circulo: formacionDeEjemplo({ integrantes: 5, participantes: conGente(4).participantes }),
        obtener: async () => lleno,
      });

      await pasar(INTERVALO);
      expect(screen.getByText('Ya entraron todas')).toBeTruthy();
      const consultasAlLlenarse = consultar.mock.calls.length;

      await pasar(INTERVALO * 4);

      expect(consultar.mock.calls.length).toBe(consultasAlLlenarse);
      expect(screen.queryByRole('button', { name: 'Compartir por WhatsApp' })).toBeNull();
      expect(screen.queryByText('Invita por WhatsApp')).toBeNull();
      expect(screen.getByText(/Tu círculo está por arrancar/)).toBeTruthy();
    });

    it('si ya estaba lleno al abrirla no consulta ni ofrece invitar', async () => {
      const { consultar } = await abrir({
        circulo: formacionDeEjemplo({ integrantes: 5, participantes: conGente(5).participantes }),
      });

      await pasar(INTERVALO * 3);

      expect(consultar).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Compartir por WhatsApp' })).toBeNull();
    });

    it('si no puede consultar avisa, sigue intentando y lo quita al conseguirlo', async () => {
      let falla = true;
      await abrir({
        obtener: async () => {
          if (falla) {
            throw new Error('sin conexión');
          }
          return conGente(2);
        },
      });

      await pasar(INTERVALO);
      expect(screen.getByText(/No pudimos revisar quién entró\. Seguimos intentando\./)).toBeTruthy();

      falla = false;
      await pasar(INTERVALO);

      expect(screen.queryByText(/No pudimos revisar quién entró/)).toBeNull();
      expect(screen.getByText('Faltan 8 personas')).toBeTruthy();
    });

    it('al salir de la pantalla deja de consultar', async () => {
      const consultar = jest.fn(async () => conGente(2));
      const { unmount } = await render(
        <FormandoScreen
          circulo={conGente(1)}
          obtener={consultar}
          onActualizado={() => {}}
          onCompartir={async () => 'compartido'}
          intervaloMs={INTERVALO}
        />,
      );
      await pasar(INTERVALO);
      const antes = consultar.mock.calls.length;

      await unmount();
      await pasar(INTERVALO * 4);

      expect(consultar.mock.calls.length).toBe(antes);
    });
  });

  describe('"Volver"', () => {
    it('aparece solo si se pide, y regresa', async () => {
      const { onVolver } = await abrir({ conVolver: true });

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

      expect(onVolver).toHaveBeenCalledTimes(1);
    });

    it('si no se pide, no hay botón de volver', async () => {
      await abrir({ conVolver: false });

      expect(screen.queryByRole('button', { name: 'Volver' })).toBeNull();
    });
  });
});
