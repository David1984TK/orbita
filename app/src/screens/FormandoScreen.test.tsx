import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { arrancarCirculo } from '../domain';
import type { CirculoEnFormacion, MiCirculo } from '../domain';
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
  arranque?: () => Promise<MiCirculo | null>;
  conLista?: boolean;
};

async function abrir({
  circulo = conGente(1),
  obtener,
  compartir,
  conVolver = false,
  arranque,
  conLista = false,
}: Opciones = {}) {
  const consultar = jest.fn(obtener ?? (async () => circulo));
  const onActualizado = jest.fn();
  const onCompartir = jest.fn(compartir ?? (async (): Promise<ResultadoDeCompartir> => 'compartido'));
  const consultarArranque = jest.fn(arranque ?? (async (): Promise<MiCirculo | null> => null));
  const onVerCirculo = jest.fn();
  const onAbrirLista = jest.fn();
  const onVolver = jest.fn();
  await render(
    <FormandoScreen
      circulo={circulo}
      obtener={consultar}
      onActualizado={onActualizado}
      onCompartir={onCompartir}
      obtenerArranque={consultarArranque}
      onVerCirculo={onVerCirculo}
      onAbrirLista={conLista ? onAbrirLista : undefined}
      onVolver={conVolver ? onVolver : undefined}
      intervaloMs={INTERVALO}
    />,
  );
  return {
    consultar,
    onActualizado,
    onCompartir,
    consultarArranque,
    onVerCirculo,
    onAbrirLista,
    onVolver,
  };
}

// Un círculo de 5 personas ya lleno, y ese mismo círculo ya arrancado: quien lo creó
// (David Nava, "yo") tiene el turno 4.
const llenoDe5 = () =>
  formacionDeEjemplo({ integrantes: 5, participantes: conGente(5).participantes });

function arrancado(turnoDeYo = 4): MiCirculo {
  const formacion = llenoDe5();
  const turnos: Record<string, number> = {};
  const otros = [1, 2, 3, 4, 5].filter((t) => t !== turnoDeYo);
  formacion.participantes.forEach((p) => {
    turnos[p.id] = p.id === 'yo' ? turnoDeYo : otros.shift()!;
  });
  return arrancarCirculo(formacion, turnos, '2026-12-07');
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
      expect(screen.getByText('Tu círculo está arrancando…')).toBeTruthy();
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
          obtenerArranque={async () => null}
          onVerCirculo={() => {}}
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

  describe('cuando hay más de un círculo', () => {
    it('el nombre es un botón que abre la lista de círculos', async () => {
      const { onAbrirLista } = await abrir({ conLista: true });

      await fireEvent.press(screen.getByRole('button', { name: 'Los del mercado. Cambiar de círculo.' }));

      expect(onAbrirLista).toHaveBeenCalledTimes(1);
    });

    it('con un solo círculo el nombre es solo un título', async () => {
      await abrir({ conLista: false });

      expect(screen.getByText('Los del mercado')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Cambiar de círculo/ })).toBeNull();
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

  describe('cuando se llena y el círculo arranca', () => {
    it('mientras falta gente nunca pregunta si arrancó', async () => {
      const { consultarArranque } = await abrir({ circulo: conGente(2) });

      await pasar(INTERVALO * 3);

      expect(consultarArranque).not.toHaveBeenCalled();
    });

    it('ya lleno pregunta de inmediato si arrancó, y sigue preguntando hasta que sí', async () => {
      let respuestas = 0;
      const { consultarArranque } = await abrir({
        circulo: llenoDe5(),
        arranque: async () => {
          respuestas += 1;
          return respuestas >= 3 ? arrancado() : null;
        },
      });
      expect(consultarArranque).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Ya entraron todas')).toBeTruthy();
      expect(screen.getByText('Tu círculo está arrancando…')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Ver mi círculo' })).toBeNull();

      await pasar(INTERVALO);
      expect(screen.queryByRole('button', { name: 'Ver mi círculo' })).toBeNull();
      await pasar(INTERVALO);

      expect(screen.getByRole('button', { name: 'Ver mi círculo' })).toBeTruthy();
    });

    it('al arrancar lo anuncia y dice cuál es el turno de la persona y cuánto recibe', async () => {
      await abrir({ circulo: llenoDe5(), arranque: async () => arrancado(4) });

      expect(await screen.findByText('¡Tu círculo arrancó!')).toBeTruthy();
      expect(screen.getByText('YA ARRANCÓ')).toBeTruthy();
      expect(screen.queryByText('EN FORMACIÓN')).toBeNull();
      expect(screen.getByText('Ya cada integrante tiene su turno.')).toBeTruthy();
      expect(screen.getByText('Tu turno: semana 4')).toBeTruthy();
      expect(
        screen.getByText(/Recibes \$3,000 cuando te toque\. La primera cuota\s+es de \$600\./),
      ).toBeTruthy();
    });

    it('el turno sale del círculo ya arrancado, no de un número fijo', async () => {
      await abrir({ circulo: llenoDe5(), arranque: async () => arrancado(1) });

      expect(await screen.findByText('Tu turno: semana 1')).toBeTruthy();
    });

    it('al arrancar deja de preguntar', async () => {
      const { consultarArranque } = await abrir({ circulo: llenoDe5(), arranque: async () => arrancado() });
      await screen.findByText('¡Tu círculo arrancó!');
      const antes = consultarArranque.mock.calls.length;

      await pasar(INTERVALO * 4);

      expect(consultarArranque.mock.calls.length).toBe(antes);
    });

    it('"Ver mi círculo" entrega el círculo ya en curso', async () => {
      const circuloEnCurso = arrancado();
      const { onVerCirculo } = await abrir({ circulo: llenoDe5(), arranque: async () => circuloEnCurso });

      await fireEvent.press(await screen.findByRole('button', { name: 'Ver mi círculo' }));

      expect(onVerCirculo).toHaveBeenCalledTimes(1);
      expect(onVerCirculo).toHaveBeenCalledWith(circuloEnCurso);
    });

    it('ya no ofrece invitar ni compartir', async () => {
      await abrir({ circulo: llenoDe5(), arranque: async () => arrancado() });
      await screen.findByText('¡Tu círculo arrancó!');

      expect(screen.queryByText('Invita por WhatsApp')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Compartir por WhatsApp' })).toBeNull();
    });

    it('si no puede preguntar si arrancó avisa, sigue intentando y lo quita al conseguirlo', async () => {
      let falla = true;
      await abrir({
        circulo: llenoDe5(),
        arranque: async () => {
          if (falla) {
            throw new Error('sin conexión');
          }
          return arrancado();
        },
      });

      expect(await screen.findByText(/No pudimos revisar si ya arrancó\. Seguimos intentando\./)).toBeTruthy();

      falla = false;
      await pasar(INTERVALO);

      expect(screen.queryByText(/No pudimos revisar si ya arrancó/)).toBeNull();
      expect(screen.getByText('¡Tu círculo arrancó!')).toBeTruthy();
    });

    it('al salir de la pantalla deja de preguntar', async () => {
      const preguntar = jest.fn(async () => null);
      const { unmount } = await render(
        <FormandoScreen
          circulo={llenoDe5()}
          obtener={async () => llenoDe5()}
          onActualizado={() => {}}
          onCompartir={async () => 'compartido'}
          obtenerArranque={preguntar}
          onVerCirculo={() => {}}
          intervaloMs={INTERVALO}
        />,
      );
      await pasar(INTERVALO);
      const antes = preguntar.mock.calls.length;

      await unmount();
      await pasar(INTERVALO * 4);

      expect(preguntar.mock.calls.length).toBe(antes);
    });
  });
});
