import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarraPestanas } from '../components/BarraPestanas';
import type { Pestana } from '../components/BarraPestanas';
import { PantallaProvisional } from '../components/PantallaProvisional';
import type { MiCirculo } from '../domain';
import type { Circulos } from '../servicios/circulos';
import { colors } from '../theme';
import { InicioScreen } from './InicioScreen';

type Props = {
  circulos: Circulos;
};

type Carga =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; miCirculo: MiCirculo }
  | { tipo: 'error' };

const MENSAJE_ERROR = 'No pudimos cargar tu círculo. Revisa tu conexión e inténtalo de nuevo.';

/**
 * La app una vez dentro: la barra de pestañas y la pantalla de cada una.
 *
 * Hoy solo existe "Círculo". "Grupo" y "Perfil" son marcadores de lugar, igual
 * que "Aportar".
 */
export function PrincipalScreen({ circulos }: Props) {
  const [pestana, setPestana] = useState<Pestana>('circulo');
  const [aportando, setAportando] = useState(false);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });

  const cargar = useCallback(() => {
    let cancelado = false;
    setCarga({ tipo: 'cargando' });
    circulos
      .obtenerMiCirculo()
      .then((miCirculo) => {
        if (!cancelado) {
          setCarga({ tipo: 'listo', miCirculo });
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

  function cambiarPestana(nueva: Pestana) {
    setPestana(nueva);
    setAportando(false);
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.contenido}>
        {pestana === 'circulo' && aportando && (
          <PantallaProvisional
            texto="Aquí va «Aportar». Todavía no existe."
            onVolver={() => setAportando(false)}
          />
        )}

        {pestana === 'circulo' && !aportando && carga.tipo === 'cargando' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <ActivityIndicator color={colors.cobalto} />
            <Text style={estilos.mensaje}>Cargando tu círculo…</Text>
          </SafeAreaView>
        )}

        {pestana === 'circulo' && !aportando && carga.tipo === 'error' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <Text style={estilos.mensaje} accessibilityRole="alert">
              {MENSAJE_ERROR}
            </Text>
            <Pressable onPress={cargar} accessibilityRole="button" style={estilos.reintentar}>
              <Text style={estilos.reintentarTexto}>Reintentar</Text>
            </Pressable>
          </SafeAreaView>
        )}

        {pestana === 'circulo' && !aportando && carga.tipo === 'listo' && (
          <InicioScreen miCirculo={carga.miCirculo} onAportar={() => setAportando(true)} />
        )}

        {pestana === 'grupo' && (
          <PantallaProvisional texto="Aquí va «El grupo». Todavía no existe." />
        )}

        {pestana === 'perfil' && (
          <PantallaProvisional texto="Aquí va «Mi historial». Todavía no existe." />
        )}
      </View>

      <BarraPestanas activa={pestana} onCambiar={cambiarPestana} />
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
