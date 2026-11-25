import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarraPestanas } from '../components/BarraPestanas';
import type { Pestana } from '../components/BarraPestanas';
import { PantallaProvisional } from '../components/PantallaProvisional';
import { registrarAporte, registrarRetiro } from '../domain';
import type { BorradorDeCirculo, MiCirculo } from '../domain';
import type { Aportes } from '../servicios/aportes';
import type { Circulos } from '../servicios/circulos';
import type { Historiales } from '../servicios/historial';
import type { Retiros } from '../servicios/retiros';
import { colors } from '../theme';
import { AportarScreen } from './AportarScreen';
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
};

/**
 * La pantalla de la pestaña o uno de los pasos cortos que se abren encima:
 * aportar y retirar (desde "Círculo") y crear un círculo (desde la pantalla
 * vacía o desde "Grupo"). "invitar" es el paso que sigue a crear: todavía no
 * existe.
 */
type Vista = 'inicio' | 'aportar' | 'retirar' | 'crear' | 'invitar';

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
export function PrincipalScreen({ circulos, aportes, retiros, historiales }: Props) {
  const [pestana, setPestana] = useState<Pestana>('circulo');
  const [vista, setVista] = useState<Vista>('inicio');
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [creado, setCreado] = useState('');

  const cargar = useCallback(() => {
    let cancelado = false;
    setCarga({ tipo: 'cargando' });
    circulos
      .obtenerMiCirculo()
      .then((miCirculo) => {
        if (!cancelado) {
          setCarga(miCirculo === null ? { tipo: 'sinCirculo' } : { tipo: 'listo', miCirculo });
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
  }, [circulos]);

  useEffect(() => cargar(), [cargar]);

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

  // Crear e invitar se pueden abrir desde "Círculo" o "Grupo". Aportar y retirar
  // solo desde "Círculo" y con el círculo ya cargado.
  const paso: Vista =
    vista === 'crear' || vista === 'invitar'
      ? vista
      : (vista === 'aportar' || vista === 'retirar') &&
          pestana === 'circulo' &&
          carga.tipo === 'listo'
        ? vista
        : 'inicio';
  const enPasoAparte = paso !== 'inicio';

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
      setCreado(borrador.nombre);
      setVista('invitar');
    }
    return resultado;
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

        {paso === 'invitar' && (
          // Provisional: invitar por WhatsApp necesita el servidor (Etapa 3), y un
          // círculo recién creado todavía no tiene dónde mostrarse (falta el
          // estado "formando el círculo").
          <PantallaProvisional
            texto={`Tu círculo «${creado}» se creó (simulado). Aquí va la invitación por WhatsApp. Todavía no existe.`}
            onVolver={() => setVista('inicio')}
          />
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

        {necesitaCirculo && !enPasoAparte && carga.tipo === 'sinCirculo' && (
          <SinCirculoScreen onCrear={() => setVista('crear')} />
        )}

        {pestana === 'circulo' && !enPasoAparte && carga.tipo === 'listo' && (
          <InicioScreen
            miCirculo={carga.miCirculo}
            onAportar={() => setVista('aportar')}
            onRetirar={() => setVista('retirar')}
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
