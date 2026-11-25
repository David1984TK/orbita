import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarraPestanas } from '../components/BarraPestanas';
import type { Pestana } from '../components/BarraPestanas';
import { ConMargenInferior } from '../components/ConMargenInferior';
import {
  conCirculoActualizado,
  conCirculoAgregado,
  elegirActual,
  enFormacionPendientes,
  ponerEsperaDeRetiro,
  registrarAporte,
  registrarRetiro,
} from '../domain';
import type { BorradorDeCirculo, CirculoEnFormacion, MiCirculo } from '../domain';
import type { Aportes } from '../servicios/aportes';
import type { Circulos } from '../servicios/circulos';
import type { Compartir } from '../servicios/compartir';
import type { Historiales } from '../servicios/historial';
import type { Recuperacion, RespuestaASolicitud, SolicitudDeRecuperacion } from '../servicios/recuperacion';
import type { Retiros } from '../servicios/retiros';
import { colors } from '../theme';
import { AportarScreen } from './AportarScreen';
import { CirculosScreen } from './CirculosScreen';
import { ConfirmarIdentidadScreen } from './ConfirmarIdentidadScreen';
import { FormandoScreen } from './FormandoScreen';
import { GrupoScreen } from './GrupoScreen';
import { InicioScreen } from './InicioScreen';
import { NuevoCirculoScreen } from './NuevoCirculoScreen';
import { PerfilScreen } from './PerfilScreen';
import { RetirarScreen } from './RetirarScreen';
import { SinCirculoScreen } from './SinCirculoScreen';

type Props = {
  circulos: Circulos;
  aportes: Aportes;
  retiros: Retiros;
  historiales: Historiales;
  recuperacion: Recuperacion;
  /** Abre el cuadro de compartir, para mandar la invitación a un círculo en formación. */
  compartir: Compartir;
  /**
   * Si la persona acaba de recuperar su acceso: hasta cuándo no puede retirar
   * dinero (fecha y hora ISO). Se aplica a sus círculos al cargarlos, mientras el
   * servidor no los entregue ya con la espera.
   */
  retiroCongeladoHasta?: string;
};

/**
 * La pantalla de la pestaña o uno de los pasos cortos que se abren encima:
 * aportar, retirar y responder a una solicitud de recuperación (desde "Círculo"),
 * ver la lista de círculos y crear uno (desde "Círculo" o "Grupo"). "formando" es
 * un círculo que todavía se está llenando.
 */
type Vista = 'inicio' | 'aportar' | 'retirar' | 'crear' | 'formando' | 'solicitud' | 'circulos';

/** Si ya se cargaron los círculos. La lista misma vive aparte; vacía es "ninguno". */
type Carga = 'cargando' | 'listo' | 'error';

const MENSAJE_ERROR = 'No pudimos cargar tu círculo. Revisa tu conexión e inténtalo de nuevo.';

/**
 * La app una vez dentro: la barra de pestañas y la pantalla de cada una.
 *
 * La persona puede estar en varios círculos. "Círculo" (con "Aportar" y "Tu
 * turno" dentro) y "Grupo" muestran el que tiene elegido, y "Mis círculos" deja
 * cambiarlo. "Perfil" pide su propio historial. Mientras se aporta, se retira, se
 * crea un círculo o se elige uno no se ve la barra de pestañas: son pasos cortos
 * que se confirman o se cancelan.
 */
export function PrincipalScreen({
  circulos,
  aportes,
  retiros,
  historiales,
  recuperacion,
  compartir,
  retiroCongeladoHasta,
}: Props) {
  const [pestana, setPestana] = useState<Pestana>('circulo');
  const [vista, setVista] = useState<Vista>('inicio');
  const [carga, setCarga] = useState<Carga>('cargando');
  // Los círculos en curso de la persona, y cuál está viendo.
  const [activos, setActivos] = useState<MiCirculo[]>([]);
  const [actualId, setActualId] = useState<string | null>(null);
  const [solicitud, setSolicitud] = useState<SolicitudDeRecuperacion | null>(null);
  // Los círculos que la persona creó y todavía se están llenando, y cuál está
  // viendo en este momento.
  const [enFormacion, setEnFormacion] = useState<CirculoEnFormacion[]>([]);
  const [formandoId, setFormandoId] = useState<string | null>(null);
  // Los avisos que ya tuvieron sus segundos a la vista en "Mi círculo". Se guardan
  // aquí y no en esa pantalla porque se desmonta al cambiar de pestaña, y los
  // avisos no deben volver a salir cada vez que la persona regresa.
  const [avisosMostrados, setAvisosMostrados] = useState<string[]>([]);

  // Después de recuperar el acceso, el retiro queda en espera en todos los círculos.
  const conEspera = useCallback(
    (miCirculo: MiCirculo): MiCirculo =>
      retiroCongeladoHasta === undefined
        ? miCirculo
        : {
            circulo: ponerEsperaDeRetiro(miCirculo.circulo, miCirculo.yoId, retiroCongeladoHasta),
            yoId: miCirculo.yoId,
          },
    [retiroCongeladoHasta],
  );

  const cargar = useCallback(() => {
    let cancelado = false;
    setCarga('cargando');
    circulos
      .obtenerMisCirculos()
      .then((lista) => {
        if (!cancelado) {
          setActivos(lista.map(conEspera));
          setCarga('listo');
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCarga('error');
        }
      });
    return () => {
      cancelado = true;
    };
  }, [circulos, conEspera]);

  useEffect(() => cargar(), [cargar]);

  // Si alguien del círculo perdió su teléfono y espera confirmación, se avisa en
  // "Mi círculo". Si no se puede consultar, simplemente no hay aviso.
  useEffect(() => {
    let cancelado = false;
    recuperacion
      .obtenerSolicitudPendiente()
      .then((pendiente) => {
        if (!cancelado) {
          setSolicitud(pendiente);
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [recuperacion]);

  // Los círculos que se están llenando. Si no se pueden consultar, simplemente no
  // se muestran: no es un error que le toque resolver a la persona.
  useEffect(() => {
    let cancelado = false;
    circulos
      .obtenerCirculosEnFormacion()
      .then((lista) => {
        if (!cancelado) {
          setEnFormacion(lista);
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [circulos]);

  // En Android el botón de atrás cierra el paso corto en vez de salirse de la app.
  useEffect(() => {
    if (vista === 'inicio') {
      return undefined;
    }
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      setVista('inicio');
      return true;
    });
    return () => suscripcion.remove();
  }, [vista]);

  // "Círculo" y "Grupo" se alimentan del mismo círculo.
  const necesitaCirculo = pestana === 'circulo' || pestana === 'grupo';

  // El círculo en curso que se está viendo, si hay alguno.
  const actual = elegirActual(activos, actualId);
  const sinCirculo = carga === 'listo' && actual === null;
  // Los que se llenan, sin los que ya aparecen en curso (cuando uno arranca puede
  // estar en las dos listas un momento).
  const llenandose = enFormacionPendientes(enFormacion, activos);
  // Con más de un círculo (en curso o llenándose) hay algo que elegir.
  const hayVarios = activos.length + llenandose.length >= 2;

  // El círculo en formación que se está viendo, si existe.
  const viendoFormacion = llenandose.find((c) => c.id === formandoId) ?? null;
  // Sin un círculo en curso, la pantalla de "Círculo" y "Grupo" es el círculo que
  // se está llenando (el más reciente), si hay alguno.
  const formacionPrincipal =
    sinCirculo && llenandose.length > 0 ? llenandose[llenandose.length - 1] : null;

  // Crear y elegir círculo se pueden abrir desde "Círculo" o "Grupo". Ver cómo va
  // un círculo que se llena, también. Aportar, retirar y responder una solicitud,
  // solo desde "Círculo" y con un círculo en curso.
  const paso: Vista =
    vista === 'crear' ||
    vista === 'circulos' ||
    (vista === 'formando' && viendoFormacion !== null)
      ? vista
      : (vista === 'aportar' || vista === 'retirar' || vista === 'solicitud') &&
          pestana === 'circulo' &&
          actual !== null
        ? vista
        : 'inicio';
  const enPasoAparte = paso !== 'inicio';

  function actualizarFormacion(actualizado: CirculoEnFormacion) {
    setEnFormacion((lista) => lista.map((c) => (c.id === actualizado.id ? actualizado : c)));
  }

  // El círculo que se llenaba ya arrancó: se suma a los círculos en curso y pasa a
  // ser el que se está viendo.
  function pasarAMiCirculo(arrancado: MiCirculo) {
    setActivos((lista) => conCirculoAgregado(lista, conEspera(arrancado)));
    setActualId(arrancado.circulo.id);
    setEnFormacion((lista) => lista.filter((c) => c.id !== arrancado.circulo.id));
    setFormandoId(null);
    setPestana('circulo');
    setVista('inicio');
  }

  // La persona eligió cuál de sus círculos ver.
  function elegirCirculo(id: string) {
    setActualId(id);
    setPestana('circulo');
    setVista('inicio');
  }

  async function confirmarAporte(total: number) {
    if (actual === null) {
      return { ok: false, motivo: 'error' } as const;
    }
    const { circulo, yoId } = actual;
    const resultado = await aportes.aportar(circulo.id, total);
    if (resultado.ok) {
      setActivos((lista) =>
        conCirculoActualizado(lista, { circulo: registrarAporte(circulo, yoId), yoId }),
      );
      setVista('inicio');
    }
    return resultado;
  }

  async function confirmarRetiro(recibes: number) {
    if (actual === null) {
      return { ok: false, motivo: 'error' } as const;
    }
    const { circulo, yoId } = actual;
    const resultado = await retiros.retirar(circulo.id, recibes);
    if (resultado.ok) {
      setActivos((lista) =>
        conCirculoActualizado(lista, { circulo: registrarRetiro(circulo, yoId), yoId }),
      );
      setVista('inicio');
    }
    return resultado;
  }

  async function confirmarCreacion(borrador: BorradorDeCirculo) {
    const resultado = await circulos.crearCirculo(borrador);
    if (resultado.ok) {
      setEnFormacion((lista) => [...lista, resultado.enFormacion]);
      setFormandoId(resultado.enFormacion.id);
      // Con un círculo en curso se abre aparte, con "Volver"; sin él, el círculo
      // que se llena pasa a ser la pantalla principal.
      setVista(actual !== null ? 'formando' : 'inicio');
    }
    return resultado;
  }

  async function responderSolicitud(respuesta: RespuestaASolicitud) {
    if (solicitud === null) {
      return;
    }
    await recuperacion.responderSolicitud(solicitud.id, respuesta);
    setSolicitud(null);
    setVista('inicio');
  }

  function cambiarPestana(nueva: Pestana) {
    setPestana(nueva);
    setVista('inicio');
  }

  const abrirLista = () => setVista('circulos');

  return (
    <View style={estilos.pantalla}>
      <ConMargenInferior activo={enPasoAparte} testID="margen-inferior">
        {paso === 'crear' && (
          <NuevoCirculoScreen onCrear={confirmarCreacion} onVolver={() => setVista('inicio')} />
        )}

        {paso === 'circulos' && (
          <CirculosScreen
            activos={activos}
            actualId={actual?.circulo.id ?? null}
            enFormacion={llenandose}
            onElegir={elegirCirculo}
            onVerFormacion={(id) => {
              setFormandoId(id);
              setVista('formando');
            }}
            onCrear={() => setVista('crear')}
            onVolver={() => setVista('inicio')}
          />
        )}

        {paso === 'formando' && viendoFormacion !== null && (
          <FormandoScreen
            key={viendoFormacion.id}
            circulo={viendoFormacion}
            obtener={() => circulos.obtenerEnFormacion(viendoFormacion.id)}
            onActualizado={actualizarFormacion}
            onCompartir={(mensaje) => compartir.compartir(mensaje)}
            obtenerArranque={() => circulos.obtenerArranque(viendoFormacion.id)}
            onVerCirculo={pasarAMiCirculo}
            onVolver={() => setVista('inicio')}
          />
        )}

        {paso === 'solicitud' && solicitud !== null && (
          <ConfirmarIdentidadScreen solicitud={solicitud} onResponder={responderSolicitud} />
        )}

        {paso === 'aportar' && actual !== null && (
          <AportarScreen
            miCirculo={actual}
            onConfirmar={confirmarAporte}
            onVolver={() => setVista('inicio')}
          />
        )}

        {paso === 'retirar' && actual !== null && (
          <RetirarScreen
            miCirculo={actual}
            onConfirmar={confirmarRetiro}
            onVolver={() => setVista('inicio')}
          />
        )}

        {necesitaCirculo && !enPasoAparte && carga === 'cargando' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <ActivityIndicator color={colors.cobalto} />
            <Text style={estilos.mensaje}>Cargando tu círculo…</Text>
          </SafeAreaView>
        )}

        {necesitaCirculo && !enPasoAparte && carga === 'error' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <Text style={estilos.mensaje} accessibilityRole="alert">
              {MENSAJE_ERROR}
            </Text>
            <Pressable onPress={cargar} accessibilityRole="button" style={estilos.reintentar}>
              <Text style={estilos.reintentarTexto}>Reintentar</Text>
            </Pressable>
          </SafeAreaView>
        )}

        {necesitaCirculo && !enPasoAparte && sinCirculo && formacionPrincipal === null && (
          <SinCirculoScreen onCrear={() => setVista('crear')} />
        )}

        {necesitaCirculo && !enPasoAparte && formacionPrincipal !== null && (
          <FormandoScreen
            key={formacionPrincipal.id}
            circulo={formacionPrincipal}
            obtener={() => circulos.obtenerEnFormacion(formacionPrincipal.id)}
            onActualizado={actualizarFormacion}
            onCompartir={(mensaje) => compartir.compartir(mensaje)}
            obtenerArranque={() => circulos.obtenerArranque(formacionPrincipal.id)}
            onVerCirculo={pasarAMiCirculo}
            onAbrirLista={hayVarios ? abrirLista : undefined}
          />
        )}

        {pestana === 'circulo' && !enPasoAparte && actual !== null && (
          <InicioScreen
            miCirculo={actual}
            onAportar={() => setVista('aportar')}
            onRetirar={() => setVista('retirar')}
            solicitud={solicitud}
            onVerSolicitud={() => setVista('solicitud')}
            avisosMostrados={avisosMostrados}
            onAvisosMostrados={(ids) =>
              setAvisosMostrados((antes) => [...antes, ...ids.filter((id) => !antes.includes(id))])
            }
            enFormacion={llenandose}
            onVerFormacion={(id) => {
              setFormandoId(id);
              setVista('formando');
            }}
            onAbrirLista={hayVarios ? abrirLista : undefined}
          />
        )}

        {pestana === 'grupo' && !enPasoAparte && actual !== null && (
          <GrupoScreen
            miCirculo={actual}
            onCrearOtro={() => setVista('crear')}
            onAbrirLista={hayVarios ? abrirLista : undefined}
          />
        )}

        {pestana === 'perfil' && <PerfilScreen historiales={historiales} />}
      </ConMargenInferior>

      {!enPasoAparte && <BarraPestanas activa={pestana} onCambiar={cambiarPestana} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  mensaje: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textoSecundario,
  },
  reintentar: {
    padding: 8,
  },
  reintentarTexto: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.cobalto,
  },
});
