import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { MiCirculo } from '../domain';
import type { Aportes } from '../servicios/aportes';
import { arrancarCirculo } from '../domain';
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
  obtener: () => Promise<MiCirculo | MiCirculo[] | null> = async () => circuloDeEjemplo(),
  aportar: Aportes['aportar'] = async () => ({ ok: true }),
  retirar: Retiros['retirar'] = async () => ({ ok: true }),
  crear: Circulos['crearCirculo'] = async (): Promise<ResultadoDeCreacion> => ({
    ok: true,
    enFormacion: formacionDeEjemplo(),
  }),
  solicitud: SolicitudDeRecuperacion | null = null,
  formando: CirculoEnFormacion[] = [],
  alCompartir: (mensaje: string) => Promise<ResultadoDeCompartir> = async () => 'compartido',
  arranque: MiCirculo | null = null,
) {
  const circulos: Circulos = {
    obtenerMisCirculos: jest.fn(async () => {
      const respuesta = await obtener();
      if (respuesta === null) {
        return [];
      }
      return Array.isArray(respuesta) ? respuesta : [respuesta];
    }),
    crearCirculo: jest.fn(crear),
    obtenerCirculosEnFormacion: jest.fn(async () => formando),
    obtenerEnFormacion: jest.fn(
      async (id: string) => formando.find((c) => c.id === id) ?? formacionDeEjemplo({ id }),
    ),
    obtenerArranque: jest.fn(async () => arranque),
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
    expect(circulos.obtenerMisCirculos).toHaveBeenCalledTimes(1);
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
    expect(circulos.obtenerMisCirculos).toHaveBeenCalledTimes(1);
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
        // Al regresar el aviso ya tuvo su tiempo: queda el distintivo para verlo.
        await fireEvent.press(screen.getByRole('button', { name: 'Ver 1 aviso' }));

        expect(aviso().props.accessibilityLabel).toBe('Estás formando Los del mercado. Faltan 6 personas.');
      } finally {
        jest.useRealTimers();
      }
    });

    describe('cuando el círculo se llena y arranca', () => {
      // Un círculo lleno de 5 personas ("Las del taller") y ese mismo círculo ya en curso.
      const lleno = () =>
        formacionDeEjemplo({
          id: 'las-del-taller',
          nombre: 'Las del taller',
          integrantes: 5,
          cuotaSemanal: 500,
          participantes: [
            { id: 'yo', nombre: 'David Nava' },
            { id: 'a', nombre: 'Rosa Martínez' },
            { id: 'b', nombre: 'Julio Lara' },
            { id: 'c', nombre: 'Ana Torres' },
            { id: 'd', nombre: 'Carmen Ruiz' },
          ],
        });
      const enCurso = () =>
        arrancarCirculo(lleno(), { yo: 4, a: 1, b: 2, c: 3, d: 5 }, '2026-12-07');

      it('sin otro círculo, "Ver mi círculo" lo convierte en "Mi círculo"', async () => {
        await abrir(async () => null, undefined, undefined, undefined, null, [lleno()], undefined, enCurso());
        expect(await screen.findByText('¡Tu círculo arrancó!')).toBeTruthy();

        await fireEvent.press(screen.getByRole('button', { name: 'Ver mi círculo' }));

        // Ahora es la pantalla de siempre, con la rueda y su semana 1.
        expect(await screen.findByText('Las del taller')).toBeTruthy();
        expect(screen.getByText('5 personas · $500 cada semana')).toBeTruthy();
        expect(screen.getByLabelText('Semana 1 de 5')).toBeTruthy();
        expect(screen.getByText('Te toca en la semana 4')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Aportar mi cuota' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Círculo' }).props.accessibilityState.selected).toBe(true);
      });

      it('al convertirse en "Mi círculo" deja de ser un círculo en formación', async () => {
        await abrir(async () => null, undefined, undefined, undefined, null, [lleno()], undefined, enCurso());
        await fireEvent.press(await screen.findByRole('button', { name: 'Ver mi círculo' }));
        await screen.findByText('Las del taller');

        expect(screen.queryByText('YA ARRANCÓ')).toBeNull();
        expect(screen.queryByText('EN FORMACIÓN')).toBeNull();
        expect(screen.queryByRole('button', { name: /Tu círculo Las del taller ya arrancó/ })).toBeNull();
        expect(screen.queryByText('Aún no tienes un círculo')).toBeNull();
      });

      it('también en Grupo se ve el círculo recién arrancado, con su gente y sus turnos', async () => {
        await abrir(async () => null, undefined, undefined, undefined, null, [lleno()], undefined, enCurso());
        await fireEvent.press(await screen.findByRole('button', { name: 'Ver mi círculo' }));
        await screen.findByText('Las del taller');

        await fireEvent.press(pestana('Grupo'));

        expect(screen.getByText('LOS 5 INTEGRANTES')).toBeTruthy();
        expect(screen.getByLabelText('Tú, Turno 4, Pendiente')).toBeTruthy();
        expect(screen.getByLabelText('Rosa Martínez, Turno 1, Pendiente')).toBeTruthy();
      });

      it('con otro círculo en curso, el que arrancó se suma y pasa a ser el que se ve', async () => {
        await abrir(undefined, undefined, undefined, undefined, null, [lleno()], undefined, enCurso());
        await screen.findByText('Los del mercado');
        await fireEvent.press(await screen.findByRole('button', { name: /Tu círculo Las del taller ya arrancó/ }));
        expect(await screen.findByText('¡Tu círculo arrancó!')).toBeTruthy();

        await fireEvent.press(screen.getByRole('button', { name: 'Ver mi círculo' }));

        // Ahora se ve el nuevo...
        expect(await screen.findByText('Las del taller')).toBeTruthy();
        expect(screen.getByLabelText('Semana 1 de 5')).toBeTruthy();
        // ...y el que ya tenía sigue en la lista de círculos.
        await fireEvent.press(screen.getByRole('button', { name: 'Las del taller. Cambiar de círculo.' }));
        expect(screen.getByRole('button', { name: /Los del mercado\. Semana 6 de 15/ })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Las del taller\. Semana 1 de 5/ })).toBeTruthy();
      });

      it('mientras no arranca, la pantalla dice que está arrancando y no ofrece verlo', async () => {
        await abrir(async () => null, undefined, undefined, undefined, null, [lleno()]);

        expect(await screen.findByText('Tu círculo está arrancando…')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ver mi círculo' })).toBeNull();
      });
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
        obtenerMisCirculos: jest.fn(async () => [enMiTurno()]),
        crearCirculo: jest.fn(),
        obtenerCirculosEnFormacion: jest.fn(async () => []),
        obtenerEnFormacion: jest.fn(),
        obtenerArranque: jest.fn(),
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
      // La solicitud sigue pendiente: tras su tiempo queda el distintivo para verla.
      await fireEvent.press(screen.getByRole('button', { name: 'Ver 1 aviso' }));
      expect(verSolicitud()).toBeTruthy();
      espia.mockRestore();
    });
  });

  describe('los avisos duran 6 segundos', () => {
    const textoDelAviso = /perdió su teléfono y\s+pide volver a entrar/;

    afterEach(() => {
      jest.useRealTimers();
    });

    it('salen al abrir Mi círculo y se quitan a los 6 segundos, dejando el distintivo', async () => {
      jest.useFakeTimers();
      await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      expect(screen.getByText(textoDelAviso)).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(5900);
      });
      expect(screen.getByText(textoDelAviso)).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(200);
      });
      expect(screen.queryByText(textoDelAviso)).toBeNull();
      expect(screen.getByRole('button', { name: 'Ver 1 aviso' })).toBeTruthy();
    });

    it('al cambiar de pestaña y regresar no vuelven a salir solos', async () => {
      jest.useFakeTimers();
      await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      await act(async () => {
        jest.advanceTimersByTime(6100);
      });
      expect(screen.queryByText(textoDelAviso)).toBeNull();

      await fireEvent.press(pestana('Grupo'));
      await fireEvent.press(pestana('Círculo'));

      expect(screen.queryByText(textoDelAviso)).toBeNull();
      expect(screen.getByRole('button', { name: 'Ver 1 aviso' })).toBeTruthy();
    });

    it('si se cambia de pestaña antes de que pasen los 6 segundos, al regresar todavía salen', async () => {
      jest.useFakeTimers();
      await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await fireEvent.press(pestana('Grupo'));
      await fireEvent.press(pestana('Círculo'));

      expect(screen.getByText(textoDelAviso)).toBeTruthy();
    });

    it('el distintivo los vuelve a sacar por otros 6 segundos', async () => {
      jest.useFakeTimers();
      await abrir(undefined, undefined, undefined, undefined, solicitudDeEjemplo());
      await screen.findByText('Los del mercado');
      await act(async () => {
        jest.advanceTimersByTime(6100);
      });

      await fireEvent.press(screen.getByRole('button', { name: 'Ver 1 aviso' }));
      expect(screen.getByText(textoDelAviso)).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(6100);
      });
      expect(screen.queryByText(textoDelAviso)).toBeNull();
    });
  });

  describe('varios círculos', () => {
    // Un segundo círculo en curso: "Las del taller", 5 personas, $500, semana 1.
    function delTaller(): MiCirculo {
      return arrancarCirculo(
        formacionDeEjemplo({
          id: 'las-del-taller',
          nombre: 'Las del taller',
          integrantes: 5,
          cuotaSemanal: 500,
          participantes: [
            { id: 'yo', nombre: 'David Nava' },
            { id: 'a', nombre: 'Rosa Martínez' },
            { id: 'b', nombre: 'Julio Lara' },
            { id: 'c', nombre: 'Ana Torres' },
            { id: 'd', nombre: 'Carmen Ruiz' },
          ],
        }),
        { yo: 4, a: 1, b: 2, c: 3, d: 5 },
        '2026-12-07',
      );
    }
    const dos = async () => [circuloDeEjemplo(), delTaller()];
    const selector = (nombre: string) =>
      screen.getByRole('button', { name: `${nombre}. Cambiar de círculo.` });

    it('con un solo círculo no hay nada que cambiar: el nombre es solo un título', async () => {
      await abrir();
      await screen.findByText('Los del mercado');

      expect(screen.queryByRole('button', { name: /Cambiar de círculo/ })).toBeNull();
    });

    it('con varios, empieza viendo el primero y su nombre abre la lista de círculos', async () => {
      await abrir(dos);
      await screen.findByText('15 personas · $600 cada semana');

      await fireEvent.press(selector('Los del mercado'));

      expect(screen.getByText('Mis círculos')).toBeTruthy();
      expect(screen.getByText('EN CURSO')).toBeTruthy();
      expect(screen.getByText('Semana 6 de 15 · $600 cada semana')).toBeTruthy();
      expect(screen.getByText('Semana 1 de 5 · $500 cada semana')).toBeTruthy();
      expect(screen.queryByRole('tab', { name: 'Círculo' })).toBeNull();
    });

    it('elegir otro círculo lo muestra en "Mi círculo", con la barra de pestañas', async () => {
      await abrir(dos);
      await screen.findByText('15 personas · $600 cada semana');
      await fireEvent.press(selector('Los del mercado'));

      await fireEvent.press(screen.getByRole('button', { name: /Las del taller\. Semana 1 de 5/ }));

      expect(screen.getByText('5 personas · $500 cada semana')).toBeTruthy();
      expect(screen.getByLabelText('Semana 1 de 5')).toBeTruthy();
      expect(screen.getByText('Te toca en la semana 4')).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Círculo' }).props.accessibilityState.selected).toBe(true);
    });

    it('la pestaña Grupo muestra el círculo elegido y su nombre abre la lista', async () => {
      await abrir(dos);
      await screen.findByText('15 personas · $600 cada semana');
      await fireEvent.press(selector('Los del mercado'));
      await fireEvent.press(screen.getByRole('button', { name: /Las del taller\. Semana 1 de 5/ }));

      await fireEvent.press(pestana('Grupo'));

      expect(screen.getByText('LOS 5 INTEGRANTES')).toBeTruthy();
      expect(screen.getByLabelText('Rosa Martínez, Turno 1, Pendiente')).toBeTruthy();
      await fireEvent.press(selector('Las del taller'));
      expect(screen.getByText('Mis círculos')).toBeTruthy();
    });

    it('lo que se hace en un círculo no toca a los demás: aportar en uno deja el otro pendiente', async () => {
      const { aportes } = await abrir(dos);
      await screen.findByText('15 personas · $600 cada semana');
      await fireEvent.press(selector('Los del mercado'));
      await fireEvent.press(screen.getByRole('button', { name: /Las del taller\. Semana 1 de 5/ }));

      await fireEvent.press(screen.getByRole('button', { name: 'Aportar mi cuota' }));
      await fireEvent.press(screen.getByRole('button', { name: /Confirmar con/ }));

      // Aportó al del taller: $500 más la comisión de depósito, no los $600 del otro.
      expect(aportes.aportar).toHaveBeenCalledWith('las-del-taller', 502.5);
      expect(await screen.findByText('Ya aportaste esta semana')).toBeTruthy();

      await fireEvent.press(selector('Las del taller'));
      await fireEvent.press(screen.getByRole('button', { name: /Los del mercado\. Semana 6 de 15/ }));

      expect(screen.getByText('15 personas · $600 cada semana')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Aportar mi cuota' })).toBeTruthy();
    });

    it('"Volver" en la lista regresa sin cambiar de círculo', async () => {
      await abrir(dos);
      await screen.findByText('15 personas · $600 cada semana');
      await fireEvent.press(selector('Los del mercado'));

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

      expect(screen.getByText('15 personas · $600 cada semana')).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
    });

    it('la lista también tiene los que se están llenando, y tocar uno lo abre', async () => {
      await abrir(dos, undefined, undefined, undefined, null, [
        formacionDeEjemplo({ id: 'barrio', nombre: 'Las del barrio' }),
      ]);
      await screen.findByText('15 personas · $600 cada semana');
      await fireEvent.press(selector('Los del mercado'));
      expect(screen.getByText('SE ESTÁN LLENANDO')).toBeTruthy();

      await fireEvent.press(screen.getByRole('button', { name: /Las del barrio/ }));

      expect(screen.getByText('EN FORMACIÓN')).toBeTruthy();
      expect(screen.getByText('Faltan 9 personas')).toBeTruthy();
    });

    it('con un círculo en curso y otro llenándose también hay algo que elegir', async () => {
      await abrir(undefined, undefined, undefined, undefined, null, [
        formacionDeEjemplo({ id: 'barrio', nombre: 'Las del barrio' }),
      ]);
      await screen.findByText('15 personas · $600 cada semana');

      expect(selector('Los del mercado')).toBeTruthy();
    });

    it('"Crear un círculo" en la lista abre la creación', async () => {
      await abrir(dos);
      await screen.findByText('15 personas · $600 cada semana');
      await fireEvent.press(selector('Los del mercado'));

      await fireEvent.press(screen.getByRole('button', { name: 'Crear un círculo' }));

      expect(screen.getByText('Nuevo círculo')).toBeTruthy();
    });

    it('sin círculo en curso y con varios llenándose, el nombre también abre la lista', async () => {
      await abrir(async () => null, undefined, undefined, undefined, null, [
        formacionDeEjemplo({ id: 'uno', nombre: 'Primero' }),
        formacionDeEjemplo({ id: 'dos', nombre: 'Segundo' }),
      ]);

      await fireEvent.press(await screen.findByRole('button', { name: 'Segundo. Cambiar de círculo.' }));

      expect(screen.getByText('Mis círculos')).toBeTruthy();
      expect(screen.getByText('Primero')).toBeTruthy();
      expect(screen.getByText('Segundo')).toBeTruthy();
    });

    it('el botón de atrás de Android cierra la lista', async () => {
      let atras: Parameters<typeof BackHandler.addEventListener>[1] = () => false;
      const espia = jest
        .spyOn(BackHandler, 'addEventListener')
        .mockImplementation((_evento, manejador) => {
          atras = manejador;
          return { remove: jest.fn() };
        });
      await abrir(dos);
      await screen.findByText('15 personas · $600 cada semana');
      await fireEvent.press(selector('Los del mercado'));
      expect(screen.getByText('Mis círculos')).toBeTruthy();

      await act(async () => {
        expect(atras({} as never)).toBe(true);
      });

      expect(screen.queryByText('Mis círculos')).toBeNull();
      expect(screen.getByText('15 personas · $600 cada semana')).toBeTruthy();
      espia.mockRestore();
    });

    it('al recuperar el acceso, el retiro queda en espera en todos los círculos', async () => {
      const enSuTurno = (id: string, nombre: string): MiCirculo => {
        const base = enMiTurno();
        return { ...base, circulo: { ...base.circulo, id, nombre } };
      };
      const circulosMock: Circulos = {
        obtenerMisCirculos: jest.fn(async () => [enSuTurno('uno', 'Uno'), enSuTurno('dos', 'Dos')]),
        crearCirculo: jest.fn(),
        obtenerCirculosEnFormacion: jest.fn(async () => []),
        obtenerEnFormacion: jest.fn(),
        obtenerArranque: jest.fn(),
      };
      await render(
        <PrincipalScreen
          circulos={circulosMock}
          aportes={{ aportar: jest.fn(async () => ({ ok: true }) as const) }}
          retiros={{ retirar: jest.fn(async () => ({ ok: true }) as const) }}
          historiales={{ obtenerMiHistorial: jest.fn(async () => historialDeEjemplo()) }}
          recuperacion={recuperacionCon(null)}
          compartir={{ compartir: jest.fn(async () => 'compartido' as const) }}
          retiroCongeladoHasta={new Date(Date.now() + 72 * 3600 * 1000).toISOString()}
        />,
      );

      expect((await screen.findByRole('button', { name: 'Retirar mi dinero' })).props.accessibilityState.disabled).toBe(true);
      await fireEvent.press(screen.getByRole('button', { name: 'Uno. Cambiar de círculo.' }));
      await fireEvent.press(screen.getByRole('button', { name: /^Dos\./ }));

      expect(screen.getByRole('button', { name: 'Retirar mi dinero' }).props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('espacio que se queda el sistema (barra de gestos, botones)', () => {
    // Un teléfono con barra de gestos abajo: el sistema se queda 34 puntos.
    const METRICAS = {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 54, left: 0, right: 0, bottom: 34 },
    };
    const margen = () => StyleSheet.flatten(screen.getByTestId('margen-inferior').props.style).paddingBottom;

    async function abrirEnTelefono() {
      await render(
        <SafeAreaProvider initialMetrics={METRICAS}>
          <PrincipalScreen
            circulos={{
              obtenerMisCirculos: jest.fn(async () => [circuloDeEjemplo()]),
              crearCirculo: jest.fn(),
              obtenerCirculosEnFormacion: jest.fn(async () => []),
              obtenerEnFormacion: jest.fn(),
              obtenerArranque: jest.fn(),
            }}
            aportes={{ aportar: jest.fn(async () => ({ ok: true }) as const) }}
            retiros={{ retirar: jest.fn(async () => ({ ok: true }) as const) }}
            historiales={{ obtenerMiHistorial: jest.fn(async () => historialDeEjemplo()) }}
            recuperacion={recuperacionCon(null)}
            compartir={{ compartir: jest.fn(async () => 'compartido' as const) }}
          />
        </SafeAreaProvider>,
      );
      await screen.findByText('Los del mercado');
    }

    it('con la barra de pestañas no suma margen: la barra ya se apoya en él', async () => {
      await abrirEnTelefono();

      expect(margen()).toBe(0);
    });

    it('en una pantalla sin barra de pestañas deja libre el espacio de abajo', async () => {
      await abrirEnTelefono();

      await fireEvent.press(screen.getByRole('button', { name: 'Aportar mi cuota' }));

      expect(screen.queryByRole('tab', { name: 'Círculo' })).toBeNull();
      expect(margen()).toBe(34);
    });

    it('al volver a la barra de pestañas, el margen se quita', async () => {
      await abrirEnTelefono();
      await fireEvent.press(screen.getByRole('button', { name: 'Aportar mi cuota' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

      expect(margen()).toBe(0);
    });
  });
});
