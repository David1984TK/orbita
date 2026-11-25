import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Progreso } from '../components/Progreso';
import type { ResultadoDeSelfie } from '../servicios/recuperacion';
import { colors } from '../theme';

type Props = {
  /**
   * Toma la selfie y la compara con la del registro. Devuelve el resultado para
   * lo esperado; si lanza un error se trata como un fallo.
   */
  onEmpezar: () => Promise<ResultadoDeSelfie>;
};

const MENSAJE_NO_COINCIDE =
  'No pudimos confirmar que eres tú. Busca un lugar con más luz e inténtalo de nuevo.';
const MENSAJE_ERROR = 'No pudimos revisar tu selfie. Revisa tu conexión e inténtalo de nuevo.';

/** Silueta de una persona dentro del círculo donde irá la cámara. */
function Silueta() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.5} r={3.6} stroke={colors.textoInactivo} strokeWidth={1.4} />
      <Path
        d="M4.5 20c0-4 3.3-6.5 7.5-6.5s7.5 2.5 7.5 6.5"
        stroke={colors.textoInactivo}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Segunda parte de la recuperación: la selfie. Detecta que hay una persona real y
 * no una foto, y la compara con la del registro: no se pide la INE otra vez.
 *
 * Todavía no abre la cámara: el círculo es un marcador y el botón le pide el
 * resultado directo al servicio.
 */
export function SelfieScreen({ onEmpezar }: Props) {
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function empezar() {
    if (verificando) {
      return;
    }
    setVerificando(true);
    setError(null);
    try {
      const resultado = await onEmpezar();
      if (!resultado.ok) {
        if (resultado.motivo === 'no-coincide') {
          setError(MENSAJE_NO_COINCIDE);
        } else if (resultado.motivo === 'error') {
          setError(MENSAJE_ERROR);
        }
        // 'cancelada': la persona cerró la cámara a propósito, sin aviso.
      }
    } catch {
      setError(MENSAJE_ERROR);
    } finally {
      setVerificando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.encabezado}>
          <Text style={estilos.paso}>Paso 2 de 3</Text>
          <Text style={estilos.titulo} accessibilityRole="header">
            Mírate a la cámara
          </Text>
        </View>

        <Progreso actual={2} total={3} />

        <View style={estilos.camara}>
          <View
            style={estilos.circulo}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Silueta />
          </View>
          <Text style={estilos.indicacion}>
            Mueve la cabeza despacio hacia un lado y después al otro.
          </Text>
        </View>

        <View style={estilos.aviso}>
          <Text style={estilos.avisoTexto}>
            La comparamos con la foto que tomaste cuando te registraste. No necesitas tu INE de nuevo.
          </Text>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        {error !== null && (
          <Text style={estilos.error} accessibilityRole="alert">
            {error}
          </Text>
        )}
        <Pressable
          onPress={() => void empezar()}
          disabled={verificando}
          accessibilityRole="button"
          accessibilityState={{ disabled: verificando, busy: verificando }}
          style={({ pressed }) => [
            estilos.boton,
            verificando && estilos.botonInactivo,
            pressed && estilos.botonPresionado,
          ]}
        >
          <Text style={estilos.botonTexto}>{verificando ? 'Revisando…' : 'Empezar'}</Text>
        </Pressable>
        <Text style={estilos.nota}>Busca un lugar con luz</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 20,
  },
  encabezado: {
    gap: 2,
  },
  paso: {
    fontSize: 15,
    color: colors.textoSecundario,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
  },
  camara: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  circulo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: colors.cobalto,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.linea,
  },
  indicacion: {
    maxWidth: 260,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textoSecundario,
  },
  aviso: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    padding: 16,
  },
  avisoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.atrasado,
  },
  boton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.cobalto,
  },
  botonInactivo: {
    opacity: 0.4,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nota: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
});
