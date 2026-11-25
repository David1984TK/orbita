import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarraPestanas } from '../components/BarraPestanas';
import type { Pestana } from '../components/BarraPestanas';
import { ponerEsperaDeRetiro, registrarAporte, registrarRetiro } from '../domain';
import type { BorradorDeCirculo, CirculoEnFormacion, MiCirculo } from '../domain';
import type { Aportes } from '../servicios/aportes';
import type { Circulos } from '../servicios/circulos';
import type { Compartir } from '../servicios/compartir';
import type { Historiales } from '../servicios/historial';
import type { Recuperacion, RespuestaASolicitud, SolicitudDeRecuperacion } from '../servicios/recuperacion';
import type { Retiros } from '../servicios/retiros';
import { colors } from '../theme';
import { AportarScreen } from './AportarScreen';
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
   * dinero (fecha y hora ISO). Se aplica al círculo al cargarlo, mientras el
   * servidor no lo entregue ya con la espera.
   */
  retiroCongeladoHasta?: string;
};

/**
 * La pantalla de la pestaña o uno de los pasos cortos que se abren encima:
 * aportar, retirar y responder a una solicitud de recuperación (desde "Círculo")
 * y crear un círculo (desde la pantalla vacía o desde "Grupo"). "formando" es el
 * círculo recién creado, que todavía se está llenando.
 */
type Vista = 'inicio' | 'aportar' | 'retirar' | 'crear' | 'formando' | 'solicitud';

type Carga =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; miCirculo: MiCirculo }
  | { tipo: 'sinCirculo' }
  | { tipo: 'error' };

const MENSAJE_ERROR = 'No pudimos cargar tu círculo. Revisa tu conexión e inténtalo de nuevo.';

/**
 * La app una vez dentro: la barra de pestañas y la pantalla de cada una.
 *
 * Existen "Círculo" (con "Aportar" y "Tu turno" dentro), "Grupo" y "Perfil" (mi
 * historial). "Círculo" y "Grupo" leen el mismo círculo, así que comparten la
 * carga y sus avisos; "Perfil" pide su propio historial. Mientras se aporta, se
 * retira o se crea un círculo no se ve la barra de pestañas: son pasos cortos
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
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [solicitud, setSolicitud] = useState<SolicitudDeRecuperacion | null>(null);
  // Los círculos que la persona creó y todavía se están llenando, y cuál está
  // viendo en este momento.
  const [enFormacion, setEnFormacion] = useState<CirculoEnFormacion[]>([]);
  const [formandoId, setFormandoId] = useState<string | null>(null);
  // Los avisos que ya tuvieron sus segundos a la vista en "Mi círculo". Se guardan
  // aquí y no en esa pantalla porque se desmonta al cambiar de pestaña, y los
  // avisos no deben volver a salir cada vez que la persona regresa.
  const [avisosMostrados, setAvisosMostrados] = useState<string[]>([]);

  const cargar = useCallback(() => {
    let cancelado = false;
    setCarga({ tipo: 'cargando' });
    circulos
      .obtenerMiCirculo()
      .then((miCirculo) => {
        if (!cancelado) {
          if (miCirculo === null) {
            setCarga({ tipo: 'sinCirculo' });
          } else if (retiroCongeladoHasta !== undefined) {
            const { circulo, yoId } = miCirculo;
            setCarga({
              tipo: 'listo',
              miCirculo: { circulo: ponerEsperaDeRetiro(circulo, yoId, retiroCongeladoHasta), yoId },
            });
          } else {
            setCarga({ tipo: 'listo', miCirculo });
          }
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCarga({ tipo: 'error' });
        }
      });
    return () => {
      cancelado = true;
    };
  }, [circulos, retiroCongeladoHasta]);

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

  // El círculo en formación que se está viendo, si existe.
  const viendoFormacion = enFormacion.find((c) => c.id === formandoId) ?? null;
  // Sin un círculo en curso, la pantalla de "Círculo" y "Grupo" es el círculo que
  // se está llenando (el más reciente), si hay alguno.
  const formacionPrincipal =
    carga.tipo === 'sinCirculo' && enFormacion.length > 0 ? enFormacion[enFormacion.length - 1] : null;

  // Crear se puede abrir desde "Círculo" o "Grupo". Ver cómo va un círculo que se
  // llena, también. Aportar, retirar y responder una solicitud, solo desde
  // "Círculo" y con el círculo ya cargado.
  const paso: Vista =
    vista === 'crear' || (vista === 'formando' && viendoFormacion !== null)
      ? vista
      : (vista === 'aportar' || vista === 'retirar' || vista === 'solicitud') &&
          pestana === 'circulo' &&
          carga.tipo === 'listo'
        ? vista
        : 'inicio';
  const enPasoAparte = paso !== 'inicio';

  function actualizarFormacion(actualizado: CirculoEnFormacion) {
    setEnFormacion((lista) => lista.map((c) => (c.id === actualizado.id ? actualizado : c)));
  }

  async function confirmarAporte(total: number) {
    if (carga.tipo !== 'listo') {
      return { ok: false, motivo: 'error' } as const;
    }
    const { circulo, yoId } = carga.miCirculo;
    const resultado = await aportes.aportar(circulo.id, total);
    if (resultado.ok) {
      setCarga({ tipo: 'listo', miCirculo: { circulo: registrarAporte(circulo, yoId), yoId } });
      setVista('inicio');
    }
    return resultado;
  }

  async function confirmarRetiro(recibes: number) {
    if (carga.tipo !== 'listo') {
      return { ok: false, motivo: 'error' } as const;
    }
    const { circulo, yoId } = carga.miCirculo;
    const resultado = await retiros.retirar(circulo.id, recibes);
    if (resultado.ok) {
      setCarga({ tipo: 'listo', miCirculo: { circulo: registrarRetiro(circulo, yoId), yoId } });
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
      setVista(carga.tipo === 'listo' ? 'formando' : 'inicio');
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

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.contenido}>
        {paso === 'crear' && (
          <NuevoCirculoScreen onCrear={confirmarCreacion} onVolver={() => setVista('inicio')} />
        )}

        {paso === 'formando' && viendoFormacion !== null && (
          <FormandoScreen
            key={viendoFormacion.id}
            circulo={viendoFormacion}
            obtener={() => circulos.obtenerEnFormacion(viendoFormacion.id)}
            onActualizado={actualizarFormacion}
            onCompartir={(mensaje) => compartir.compartir(mensaje)}
            onVolver={() => setVista('inicio')}
          />
        )}

        {paso === 'solicitud' && solicitud !== null && (
          <ConfirmarIdentidadScreen solicitud={solicitud} onResponder={responderSolicitud} />
        )}

        {paso === 'aportar' && carga.tipo === 'listo' && (
          <AportarScreen
            miCirculo={carga.miCirculo}
            onConfirmar={confirmarAporte}
            onVolver={() => setVista('inicio')}
          />
        )}

        {paso === 'retirar' && carga.tipo === 'listo' && (
          <RetirarScreen
            miCirculo={carga.miCirculo}
            onConfirmar={confirmarRetiro}
            onVolver={() => setVista('inicio')}
          />
        )}

        {necesitaCirculo && !enPasoAparte && carga.tipo === 'cargando' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <ActivityIndicator color={colors.cobalto} />
            <Text style={estilos.mensaje}>Cargando tu círculo…</Text>
          </SafeAreaView>
        )}

        {necesitaCirculo && !enPasoAparte && carga.tipo === 'error' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <Text style={estilos.mensaje} accessibilityRole="alert">
              {MENSAJE_ERROR}
            </Text>
            <Pressable onPress={cargar} accessibilityRole="button" style={estilos.reintentar}>
              <Text style={estilos.reintentarTexto}>Reintentar</Text>
            </Pressable>
          </SafeAreaView>
        )}

        {necesitaCirculo && !enPasoAparte && carga.tipo === 'sinCirculo' && formacionPrincipal === null && (
          <SinCirculoScreen onCrear={() => setVista('crear')} />
        )}

        {necesitaCirculo && !enPasoAparte && formacionPrincipal !== null && (
          <FormandoScreen
            key={formacionPrincipal.id}
            circulo={formacionPrincipal}
            obtener={() => circulos.obtenerEnFormacion(formacionPrincipal.id)}
            onActualizado={actualizarFormacion}
            onCompartir={(mensaje) => compartir.compartir(mensaje)}
          />
        )}

        {pestana === 'circulo' && !enPasoAparte && carga.tipo === 'listo' && (
          <InicioScreen
            miCirculo={carga.miCirculo}
            onAportar={() => setVista('aportar')}
            onRetirar={() => setVista('retirar')}
            solicitud={solicitud}
            onVerSolicitud={() => setVista('solicitud')}
            avisosMostrados={avisosMostrados}
            onAvisosMostrados={(ids) =>
              setAvisosMostrados((antes) => [...antes, ...ids.filter((id) => !antes.includes(id))])
            }
            enFormacion={enFormacion}
            onVerFormacion={(id) => {
              setFormandoId(id);
              setVista('formando');
            }}
          />
        )}

        {pestana === 'grupo' && !enPasoAparte && carga.tipo === 'listo' && (
          <GrupoScreen miCirculo={carga.miCirculo} onCrearOtro={() => setVista('crear')} />
        )}

        {pestana === 'perfil' && <PerfilScreen historiales={historiales} />}
      </View>

      {!enPasoAparte && <BarraPestanas activa={pestana} onCambiar={cambiarPestana} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    flex: 1,
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
