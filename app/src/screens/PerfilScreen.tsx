import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PantallaProvisional } from '../components/PantallaProvisional';
import type { Historial } from '../domain';
import type { Historiales } from '../servicios/historial';
import { colors } from '../theme';
import { HistorialScreen } from './HistorialScreen';

type Props = {
  historiales: Historiales;
};

type Carga =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; historial: Historial }
  | { tipo: 'error' };

const MENSAJE_ERROR = 'No pudimos cargar tu historial. Revisa tu conexión e inténtalo de nuevo.';

/**
 * La pestaña "Perfil": mi historial. Lo pide al abrirse, con su propio estado de
 * carga y de error. "Compartir mi historial" es un marcador de lugar.
 */
export function PerfilScreen({ historiales }: Props) {
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [compartiendo, setCompartiendo] = useState(false);

  const cargar = useCallback(() => {
    let cancelado = false;
    setCarga({ tipo: 'cargando' });
    historiales
      .obtenerMiHistorial()
      .then((historial) => {
        if (!cancelado) {
          setCarga({ tipo: 'listo', historial });
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
  }, [historiales]);

  useEffect(() => cargar(), [cargar]);

  if (compartiendo) {
    return (
      <PantallaProvisional
        texto="Aquí va «Compartir mi historial». Todavía no existe."
        onVolver={() => setCompartiendo(false)}
      />
    );
  }

  if (carga.tipo === 'cargando') {
    return (
      <SafeAreaView edges={['top']} style={estilos.centro}>
        <ActivityIndicator color={colors.cobalto} />
        <Text style={estilos.mensaje}>Cargando tu historial…</Text>
      </SafeAreaView>
    );
  }

  if (carga.tipo === 'error') {
    return (
      <SafeAreaView edges={['top']} style={estilos.centro}>
        <Text style={estilos.mensaje} accessibilityRole="alert">
          {MENSAJE_ERROR}
        </Text>
        <Pressable onPress={cargar} accessibilityRole="button" style={estilos.reintentar}>
          <Text style={estilos.reintentarTexto}>Reintentar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return <HistorialScreen historial={carga.historial} onCompartir={() => setCompartiendo(true)} />;
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.fondo,
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
