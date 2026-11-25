import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import type { MiCirculo } from '../domain';
import type { Aportes } from '../servicios/aportes';
import type { CirculoEnFormacion } from '../domain';
import { circuloDeEjemplo, formacionDeEjemplo } from '../servicios/circulos';
import type { Circulos, ResultadoDeCreacion } from '../servicios/circulos';
import type { Compartir, ResultadoDeCompartir } from '../servicios/compartir';
import { historialDeEjemplo } from '../servicios/historial';
import type { Historiales } from '../servicios/historial';
import { solicitudDeEjemplo } from '../servicios/recuperacion';
import type { Recuperacion, SolicitudDeRecuperacion } from '../servicios/recuperacion';
import type { Retiros } from '../servicios/retiros';
import { PrincipalScreen } from './PrincipalScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// El círculo de ejemplo con mi turno puesto en la semana en curso (la 6): ahí se
// puede retirar el bote.
function enMiTurno(): MiCirculo {
  const base = circuloDeEjemplo();
  const yoAntes = base.circulo.integrantes.find((i) => i.id === base.yoId)!;
  return {
    yoId: base.yoId,
    circulo: {
      ...base.circulo,
      integrantes: base.circulo.integrantes.map((i) => {
        if (i.id === base.yoId) {
          return { ...i, turno: base.circulo.semanaActual };
        }
        return i.turno === base.circulo.semanaActual ? { ...i, turno: yoAntes.turno } : i;
      }),
    },
  };
}

// Una recuperación de mentira: lo único que importa aquí es la solicitud pendiente.
function recuperacionCon(solicitud: SolicitudDeRecuperacion | null): Recuperacion {
  let pendiente = solicitud;
  return {
    verificarSelfie: jest.fn(async () => ({ ok: true }) as const),
    obtenerConfirmaciones: jest.fn(async () => ({ circuloNombre: '', personas: [] })),
    avisarAlGrupo: jest.fn(async () => {}),
    completar: jest.fn(),
    obtenerSolicitudPendiente: jest.fn(async () => pendiente),
    responderSolicitud: jest.fn(async () => {
      pendiente = null;
    }),
  } as unknown as Recuperacion;
}

async function abrir(
  obtener: () => Promise<MiCirculo | null> = async () => circuloDeEjemplo(),
  aportar: Aportes['aportar'] = async () => ({ ok: true }),
  retirar: Retiros['retirar'] = async () => ({ ok: true }),
  crear: Circulos['crearCirculo'] = async (): Promise<ResultadoDeCreacion> => ({
    ok: true,
    enFormacion: formacionDeEjemplo(),
  }),
  solicitud: SolicitudDeRecuperacion | null = null,
  formando: CirculoEnFormacion[] = [],
  alCompartir: (mensaje: string) => Promise<ResultadoDeCompartir> = async () => 'compartido',
) {
  const circulos: Circulos = {
    obtenerMiCirculo: jest.fn(obtener),
    crearCirculo: jest.fn(crear),
    obtenerCirculosEnFormacion: jest.fn(async () => formando),
    obtenerEnFormacion: jest.fn(
      async (id: string) => formando.find((c) => c.id === id) ?? formacionDeEjemplo({ id }),
    ),
  };
  const compartir: Compartir = { compartir: jest.fn(alCompartir) };
  const aportes: Aportes = { aportar: jest.fn(aportar) };
  const retiros: Retiros = { retirar: jest.fn(retirar) };
  const historiales: Historiales = { obtenerMiHistorial: jest.fn(async () => historialDeEjemplo()) };
  const recuperacion = recuperacionCon(solicitud);
  await render(
    <PrincipalScreen
      circulos={circulos}
      aportes={aportes}
      retiros={retiros}
      historiales={historiales}
      recuperacion={recuperacion}
      compartir={compartir}
    />,
  );
  return { circulos, aportes, retiros, historiales, recuperacion, compartir };
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
    expect(screen.getByText('El grupo')).toBeTruthy();
    expect(screen.getByText('LOS 15 INTEGRANTES')).toBeTruthy();
    expect(pestana('Grupo').props.accessibilityState.selected).toBe(true);

    await fireEvent.press(pestana('Perfil'));
    expect(await screen.findByText('Mi historial')).toBeTruthy();

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

  it('la pestaña Grupo muestra el mismo círculo cargado, sin volver a pedirlo', async () => {
    const { circulos } = await abrir();
    await screen.findByText('Los del mercado');

    await fireEvent.press(pestana('Grupo'));

    expect(screen.getByText('Semana 6 · 13 al día, 1 pendiente, 1 atrasado')).toBeTruthy();
    expect(circulos.obtenerMiCirculo).toHaveBeenCalledTimes(1);
  });

  it('al aportar, la pestaña Grupo ya me ve al día', async () => {
    await abrir();
    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));
    await fireEvent.press(botonConfirmar());
    await screen.findByText('Ya aportaste esta semana');

    await fireEvent.press(pestana('Grupo'));

    expect(screen.getByText('Semana 6 · 14 al día, 1 atrasado')).toBeTruthy();
    expect(screen.getByLabelText('Tú, Turno 12, Al día')).toBeTruthy();
  });

  it('si no pudo cargar el círculo, también se avisa desde la pestaña Grupo', async () => {
    await abrir(async () => {
      throw new Error('sin conexión');
    });
    await screen.findByText(/No pudimos cargar tu círculo/);

    await fireEvent.press(pestana('Grupo'));

    expect(screen.getByText(/No pudimos cargar tu círculo/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });

  describe('Tu turno (retirar)', () => {
    const botonRetirar = () => screen.getByRole('button', { name: 'Retirar mi dinero' });

    it('antes de mi turno no se ofrece retirar', async () => {
      await abrir();
      await screen.findByText('Los del mercado');

      expect(screen.queryByRole('button', { name: 'Retirar mi dinero' })).toBeNull();
    });

    it('en mi turno abre la pantalla de retiro, sin la barra de pestañas', async () => {
      await abrir(async () => enMiTurno());
      await fireEvent.press(await screen.findByRole('button', { name: 'Retirar mi dinero' }));

      expect(screen.getByText('Es tu turno, semana 6')).toBeTruthy();
      expect(screen.getByText('$8,865')).toBeTruthy();
      expect(screen.queryByRole('tab', { name: 'Círculo' })).toBeNull();
    });

    it('"Volver" regresa a Mi círculo sin retirar', async () => {
      const { retiros } = await abrir(async () => enMiTurno());
      await fireEvent.press(await screen.findByRole('button', { name: 'Retirar mi dinero' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

      expect(screen.getByText('Los del mercado')).toBeTruthy();
      expect(botonRetirar()).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
      expect(retiros.retirar).not.toHaveBeenCalled();
    });

    it('al retirar manda lo que recibes y Mi círculo ya dice que cobraste', async () => {
      const { retiros } = await abrir(async () => enMiTurno());
      await fireEvent.press(await screen.findByRole('button', { name: 'Retirar mi dinero' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Retirar mi dinero' }));

      expect(retiros.retirar).toHaveBeenCalledWith('los-del-mercado', 8865);
      expect(await screen.findByText('Ya cobraste en la semana 6')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Retirar mi dinero' })).toBeNull();
      expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
    });

    it('si el retiro falla se queda en la pantalla de retiro y no cambia nada', async () => {
      await abrir(
        async () => enMiTurno(),
        undefined,
        async () => ({ ok: false, motivo: 'error' }),
      );
      await fireEvent.press(await screen.findByRole('button', { name: 'Retirar mi dinero' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Retirar mi dinero' }));

      expect(await screen.findByText(/No pudimos completar tu retiro/)).toBeTruthy();
      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
      expect(screen.getByText('Te toca esta semana')).toBeTruthy();
      expect(botonRetirar()).toBeTruthy();
    });

    it('si la persona cancela la confirmación sigue en la pantalla de retiro', async () => {
      await abrir(
        async () => enMiTurno(),
        undefined,
        async () => ({ ok: false, motivo: 'cancelada' }),
      );
      await fireEvent.press(await screen.findByRole('button', { name: 'Retirar mi dinero' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Retirar mi dinero' }));

      expect(screen.getByText('Es tu turno, semana 6')).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('el botón de atrás de Android cierra la pantalla de retiro', async () => {
      let atras: Parameters<typeof BackHandler.addEventListener>[1] = () => false;
      const espia = jest
        .spyOn(BackHandler, 'addEventListener')
        .mockImplementation((_evento, manejador) => {
          atras = manejador;
          return { remove: jest.fn() };
        });
      await abrir(async () => enMiTurno());
      await fireEvent.press(await screen.findByRole('button', { name: 'Retirar mi dinero' }));
      expect(screen.getByText('Es tu turno, semana 6')).toBeTruthy();

      await act(async () => {
        expect(atras({} as never)).toBe(true);
      });

      expect(screen.queryByText('Es tu turno, semana 6')).toBeNull();
      expect(screen.getByText('Los del mercado')).toBeTruthy();
      espia.mockRestore();
    });
  });

  it('la pestaña Perfil pide el historial y lo muestra, con la barra de pestañas', async () => {
    const { historiales } = await abrir();
    await screen.findByText('Los del mercado');

    await fireEvent.press(pestana('Perfil'));

    expect(await screen.findByText('Básico')).toBeTruthy();
    expect(screen.getByText('Ahorrado con Órbita')).toBeTruthy();
    expect(pestana('Perfil').props.accessibilityState.selected).toBe(true);
    expect(historiales.obtenerMiHistorial).toHaveBeenCalledTimes(1);
  });

  describe('Crear un círculo', () => {
    const llenarYCrear = async () => {
      await fireEvent.changeText(screen.getByLabelText('Nombre del círculo'), 'Los del mercado');
      await fireEvent.changeText(screen.getByLabelText('Cuota semanal'), '600');
      await fireEvent.press(screen.getByRole('button', { name: 'Crear e invitar' }));
    };

    const aGrupoYCrear = async () => {
      await screen.findByText('Los del mercado');
      await fireEvent.press(pestana('Grupo'));
      await fireEvent.press(screen.getByRole('button', { name: 'Crear otro círculo' }));
    };

    it('quien no está en ningún círculo ve una pantalla para crear el primero', async () => {
      await abrir(async () => null);

      expect(await screen.findByText('Aún no tienes un círculo')).toBeTruthy();
      expect(screen.getByText(/de 5 a 15\s+integrantes/)).toBeTruthy();
      expect(pestana('Círculo').props.accessibilityState.selected).toBe(true);
    });

    it('la pestaña Grupo también ofrece crear el primer círculo cuando no hay ninguno', async () => {
      await abrir(async () => null);
      await screen.findByText('Aún no tienes un círculo');

      await fireEvent.press(pestana('Grupo'));

      expect(screen.getByText('Aún no tienes un círculo')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Crear un círculo' })).toBeTruthy();
    });

    it('desde la pantalla vacía abre "Nuevo círculo", sin la barra de pestañas', async () => {
      await abrir(async () => null);
      await fireEvent.press(await screen.findByRole('button', { name: 'Crear un círculo' }));

      expect(screen.getByText('Nuevo círculo')).toBeTruthy();
      expect(screen.queryByRole('tab', { name: 'Círculo' })).toBeNull();
    });

    it('desde la pestaña Grupo, "Crear otro círculo" abre "Nuevo círculo"', async () => {
      await abrir();
      await aGrupoYCrear();

      expect(screen.getByText('Nuevo círculo')).toBeTruthy();
      expect(screen.queryByRole('tab', { name: 'Grupo' })).toBeNull();
    });

    it('"Volver" regresa a la pestaña de donde se vino, sin crear nada', async () => {
      const { circulos } = await abrir();
      await aGrupoYCrear();

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

      expect(screen.getByText('El grupo')).toBeTruthy();
      expect(pestana('Grupo').props.accessibilityState.selected).toBe(true);
      expect(circulos.crearCirculo).not.toHaveBeenCalled();
    });

    it('al crear manda lo elegido', async () => {
      const { circulos } = await abrir();
      await aGrupoYCrear();

      await llenarYCrear();

      expect(circulos.crearCirculo).toHaveBeenCalledWith({
        nombre: 'Los del mercado',
        integrantes: 10,
        cuota: 600,
        moneda: 'pesos',
      });
    });

    it('con un círculo en curso, al crear abre el círculo en formación aparte, con "Volver"', async () => {
      await abrir();
      await aGrupoYCrear();

      await llenarYCrear();

      expect(await screen.findByText('EN FORMACIÓN')).toBeTruthy();
      expect(screen.getByText('Faltan 9 personas')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Volver' })).toBeTruthy();
      expect(screen.queryByRole('tab', { name: 'Grupo' })).toBeNull();
    });

    it('desde el círculo en formación "Volver" regresa a la pestaña, con su barra', async () => {
      await abrir();
      await aGrupoYCrear();
      await llenarYCrear();
      await screen.findByText('EN FORMACIÓN');

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

      expect(screen.getByText('El grupo')).toBeTruthy();
      expect(pestana('Grupo').props.accessibilityState.selected).toBe(true);
    });

    it('sin ningún círculo en curso, el círculo recién creado pasa a ser la pantalla principal', async () => {
      await abrir(async () => null);
      await fireEvent.press(await screen.findByRole('button', { name: 'Crear un círculo' }));

      await llenarYCrear();

      expect(await screen.findByText('EN FORMACIÓN')).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Volver' })).toBeNull();
      expect(screen.queryByText('Aún no tienes un círculo')).toBeNull();
    });

    it('si la creación falla se queda en "Nuevo círculo" con lo escrito', async () => {
      await abrir(undefined, undefined, undefined, async () => ({ ok: false, motivo: 'error' }));
      await aGrupoYCrear();

      await llenarYCrear();

      expect(await screen.findByText(/No pudimos crear tu círculo/)).toBeTruthy();
      expect(screen.getByLabelText('Nombre del círculo').props.value).toBe('Los del mercado');
      expect(screen.queryByText('EN FORMACIÓN')).toBeNull();
    });

    it('el botón de atrás de Android cierra "Nuevo círculo"', async () => {
      let atras: Parameters<typeof BackHandler.addEventListener>[1] = () => false;
      const espia = jest
        .spyOn(BackHandler, 'addEventListener')
        .mockImplementation((_evento, manejador) => {
          atras = manejador;
          return { remove: jest.fn() };
        });
      await abrir(async () => null);
      await fireEvent.press(await screen.findByRole('button', { name: 'Crear un círculo' }));
      expect(screen.getByText('Nuevo círculo')).toBeTruthy();

      await act(async () => {
        expect(atras({} as never)).toBe(true);
      });

      expect(screen.queryByText('Nuevo círculo')).toBeNull();
      expect(screen.getByText('Aún no tienes un círculo')).toBeTruthy();
      espia.mockRestore();
    });
  });

  describe('Círculo en formación', () => {
    const aviso = () => screen.getByRole('button', { name: /Estás formando/ });

    it('con un círculo en curso, "Mi círculo" avisa del que se está llenando y cuánto falta', async () => {
      await abrir(undefined, undefined, undefined, undefined, null, [formacionDeEjemplo()]);

      expect(await screen.findByText(/Faltan 9 personas/)).toBeTruthy();
      expect(aviso().props.accessibilityLabel).toBe('Estás formando Los del mercado. Faltan 9 personas.');
    });

    it('sin círculos en formación no hay aviso', async () => {
      await abrir();
      await screen.findByText('Los del mercado');

      expect(screen.queryByRole('button', { name: /Estás formando/ })).toBeNull();
    });

    it('al tocar el aviso abre el círculo en formación, y "Volver" regresa a Mi círculo', async () => {
      await abrir(undefined, undefined, undefined, undefined, null, [formacionDeEjemplo()]);
      await fireEvent.press(await screen.findByRole('button', { name: /Estás formando/ }));

      expect(screen.getByText('EN FORMACIÓN')).toBeTruthy();
      expect(screen.queryByRole('tab', { name: 'Círculo' })).toBeNull();

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

      expect(screen.getByText('15 personas · $600 cada semana')).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
    });

    it('sin círculo en curso pero con uno en formación, ese es el que se ve en Círculo y en Grupo', async () => {
      await abrir(async () => null, undefined, undefined, undefined, null, [formacionDeEjemplo()]);

      expect(await screen.findByText('EN FORMACIÓN')).toBeTruthy();
      expect(screen.queryByText('Aún no tienes un círculo')).toBeNull();

      await fireEvent.press(pestana('Grupo'));
      expect(screen.getByText('EN FORMACIÓN')).toBeTruthy();
    });

    it('si hay varios en formación sin círculo en curso, se ve el más reciente', async () => {
      await abrir(async () => null, undefined, undefined, undefined, null, [
        formacionDeEjemplo({ id: 'uno', nombre: 'Primero' }),
        formacionDeEjemplo({ id: 'dos', nombre: 'Segundo' }),
      ]);

      expect(await screen.findByText('Segundo')).toBeTruthy();
      expect(screen.queryByText('Primero')).toBeNull();
    });

    it('"Compartir por WhatsApp" manda la invitación con el nombre y el enlace', async () => {
      const { compartir } = await abrir(
        async () => null,
        undefined,
        undefined,
        undefined,
        null,
        [formacionDeEjemplo()],
      );

      await fireEvent.press(await screen.findByRole('button', { name: 'Compartir por WhatsApp' }));

      expect(compartir.compartir).toHaveBeenCalledTimes(1);
      const mensaje = (compartir.compartir as jest.Mock).mock.calls[0][0] as string;
      expect(mensaje).toContain('«Los del mercado»');
      expect(mensaje).toContain('https://orbita.example/c/los-del-mercado-nuevo');
    });

    it('lo que va entrando se refleja también en el aviso de Mi círculo', async () => {
      jest.useFakeTimers();
      try {
        const { circulos } = await abrir(
          undefined,
          undefined,
          undefined,
          undefined,
          null,
          [formacionDeEjemplo()],
        );
        (circulos.obtenerEnFormacion as jest.Mock).mockResolvedValue(
          formacionDeEjemplo({
            participantes: [
              { id: 'yo', nombre: 'David Nava' },
              { id: 'a', nombre: 'Rosa Martínez' },
              { id: 'b', nombre: 'Julio Lara' },
              { id: 'c', nombre: 'Ana Torres' },
            ],
          }),
        );
        await fireEvent.press(await screen.findByRole('button', { name: /Estás formando/ }));
        await act(async () => {
          jest.advanceTimersByTime(5000);
        });
        expect(screen.getByText('Faltan 6 personas')).toBeTruthy();

        await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

        expect(aviso().props.accessibilityLabel).toBe('Estás formando Los del mercado. Faltan 6 personas.');
      } finally {
        jest.useRealTimers();
      }
    });

    it('el botón de atrás de Android cierra el círculo en formación', async () => {
      let atras: Parameters<typeof BackHandler.addEventListener>[1] = () => false;
      const espia = jest
        .spyOn(BackHandler, 'addEventListener')
        .mockImplementation((_evento, manejador) => {
          atras = manejador;
          return { remove: jest.fn() };
        });
      await abrir(undefined, undefined, undefined, undefined, null, [formacionDeEjemplo()]);
      await fireEvent.press(await screen.findByRole('button', { name: /Estás formando/ }));
      expect(screen.getByText('EN FORMACIÓN')).toBeTruthy();

      await act(async () => {
        expect(atras({} as never)).toBe(true);
      });

      expect(screen.queryByText('EN FORMACIÓN')).toBeNull();
      expect(screen.getByText('Los del mercado')).toBeTruthy();
      espia.mockRestore();
    });
  });

  describe('después de recuperar el acceso', () => {
    it('el retiro queda en espera hasta la fecha que llega de la recuperación', async () => {
      const circulos: Circulos = {
        obtenerMiCirculo: jest.fn(async () => enMiTurno()),
        crearCirculo: jest.fn(),
        obtenerCirculosEnFormacion: jest.fn(async () => []),
        obtenerEnFormacion: jest.fn(),
      };
      await render(
        <PrincipalScreen
          circulos={circulos}
          aportes={{ aportar: jest.fn(async () => ({ ok: true }) as const) }}
          retiros={{ retirar: jest.fn(async () => ({ ok: true }) as const) }}
          historiales={{ obtenerMiHistorial: jest.fn(async () => historialDeEjemplo()) }}
          recuperacion={recuperacionCon(null)}
          compartir={{ compartir: jest.fn(async () => 'compartido' as const) }}
          retiroCongeladoHasta={new Date(Date.now() + 72 * 3600 * 1000).toISOString()}
        />,
      );

      const boton = await screen.findByRole('button', { name: 'Retirar mi dinero' });

      expect(boton.props.accessibilityState.disabled).toBe(true);
      expect(screen.getByText(/Por seguridad podrás retirar a partir del/)).toBeTruthy();
    });

    it('sin recuperación no hay espera', async () => {
      await abrir(async () => enMiTurno());

      const boton = await screen.findByRole('button', { name: 'Retirar mi dinero' });

      expect(boton.props.accessibilityState.disabled).not.toBe(true);
    });
  });

  describe('solicitud de recuperación de alguien del círculo', () => {
    const verSolicitud = () => screen.getByRole('button', { name: /perdió su teléfono y pide volver a entrar/ });

    it('sin solicitud pendiente no hay aviso', async () => {
      await abrir();
      await screen.findByText('Los del mercado');

      expect(screen.queryByText(/perdió su teléfono/)).toBeNull();
    });

    it('con una solicitud pendiente avisa en Mi círculo', async () => {
      await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');

      expect(await screen.findByText(/perdió su teléfono y\s+pide volver a entrar/)).toBeTruthy();
    });

    it('al tocarla abre la pantalla del grupo, sin la barra de pestañas', async () => {
      await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      await fireEvent.press(await screen.findByRole('button', { name: /perdió su teléfono y pide volver a entrar/ }));

      expect(screen.getByRole('button', { name: 'Sí, es Julio' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'No reconozco a Julio' })).toBeTruthy();
      expect(screen.queryByRole('tab', { name: 'Círculo' })).toBeNull();
    });

    it('al confirmar manda la respuesta, el aviso desaparece y se vuelve a Mi círculo', async () => {
      const { recuperacion } = await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      await fireEvent.press(await screen.findByRole('button', { name: /perdió su teléfono y pide volver a entrar/ }));

      await fireEvent.press(screen.getByRole('button', { name: 'Sí, es Julio' }));

      expect(recuperacion.responderSolicitud).toHaveBeenCalledWith('solicitud-julio', 'confirmo');
      expect(await screen.findByText('Los del mercado')).toBeTruthy();
      expect(screen.queryByText(/perdió su teléfono y\s+pide volver a entrar/)).toBeNull();
      expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
    });

    it('al decir que no lo reconoce manda el rechazo', async () => {
      const { recuperacion } = await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      await fireEvent.press(await screen.findByRole('button', { name: /perdió su teléfono y pide volver a entrar/ }));

      await fireEvent.press(screen.getByRole('button', { name: 'No reconozco a Julio' }));

      expect(recuperacion.responderSolicitud).toHaveBeenCalledWith('solicitud-julio', 'no-lo-reconozco');
      expect(await screen.findByText('Los del mercado')).toBeTruthy();
    });

    it('si falla la respuesta se queda en la pantalla y la solicitud sigue pendiente', async () => {
      const { recuperacion } = await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      (recuperacion.responderSolicitud as jest.Mock).mockRejectedValueOnce(new Error('sin conexión'));
      await screen.findByText('Los del mercado');
      await fireEvent.press(await screen.findByRole('button', { name: /perdió su teléfono y pide volver a entrar/ }));

      await fireEvent.press(screen.getByRole('button', { name: 'Sí, es Julio' }));

      expect(await screen.findByText(/No pudimos mandar tu respuesta/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Sí, es Julio' })).toBeTruthy();
    });

    it('el botón de atrás de Android cierra la pantalla sin responder', async () => {
      let atras: Parameters<typeof BackHandler.addEventListener>[1] = () => false;
      const espia = jest
        .spyOn(BackHandler, 'addEventListener')
        .mockImplementation((_evento, manejador) => {
          atras = manejador;
          return { remove: jest.fn() };
        });
      const { recuperacion } = await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      await fireEvent.press(await screen.findByRole('button', { name: /perdió su teléfono y pide volver a entrar/ }));

      await act(async () => {
        expect(atras({} as never)).toBe(true);
      });

      expect(await screen.findByText('Los del mercado')).toBeTruthy();
      expect(recuperacion.responderSolicitud).not.toHaveBeenCalled();
      expect(verSolicitud()).toBeTruthy();
      espia.mockRestore();
    });
  });
});
