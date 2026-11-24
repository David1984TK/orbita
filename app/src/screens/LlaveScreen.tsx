import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconoBiometria } from '../components/IconoBiometria';
import type { ResultadoLlave } from '../servicios/llave';
import { colors } from '../theme';

type Plataforma = 'ios' | 'android';

type Props = {
  /**
   * Crea la llave. Devuelve el resultado para lo esperado (cancelar, no tener
   * biometría). Si lanza un error se trata como un fallo cualquiera.
   */
  onCrear: () => Promise<ResultadoLlave>;
  /** Solo para pruebas: por defecto sale de la plataforma real. */
  plataforma?: Plataforma;
};

// Lo único que cambia entre iOS y Android es cómo se llama el gesto. La
// estructura, los colores y el resto de los textos son los mismos.
const TEXTOS: Record<
  Plataforma,
  { subtitulo: string; boton: string; sinBiometria: string; icono: 'rostro' | 'huella' }
> = {
  ios: {
    subtitulo: 'Tu rostro abre Órbita. No hay contraseña que recordar ni frase que anotar.',
    boton: 'Activar Face ID',
    sinBiometria:
      'Tu teléfono no tiene Face ID activado. Actívalo en los ajustes del teléfono e inténtalo de nuevo.',
    icono: 'rostro',
  },
  android: {
    subtitulo: 'Tu huella abre Órbita. No hay contraseña que recordar ni frase que anotar.',
    boton: 'Activar mi huella',
    sinBiometria:
      'Tu teléfono no tiene una huella guardada. Agrégala en los ajustes del teléfono e inténtalo de nuevo.',
    icono: 'huella',
  },
};

const MENSAJE_ERROR = 'No pudimos crear tu llave. Inténtalo de nuevo.';

const GARANTIAS = [
  { titulo: 'Solo funciona en este teléfono', detalle: 'La llave no sale de aquí' },
  { titulo: 'Nadie más puede entrar', detalle: 'Ni nosotros' },
];

/**
 * Tercera pantalla de entrada: crear la llave (passkey).
 *
 * Se explica por lo que significa para la persona, nunca por cómo funciona: no
 * aparecen las palabras "passkey", "wallet" ni "frase semilla".
 */
export function LlaveScreen({
  onCrear,
  plataforma = Platform.OS === 'ios' ? 'ios' : 'android',
}: Props) {
  const textos = TEXTOS[plataforma];
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear() {
    if (creando) {
      return;
    }
    setCreando(true);
    setError(null);
    try {
      const resultado = await onCrear();
      if (!resultado.ok) {
        if (resultado.motivo === 'sin-biometria') {
          setError(textos.sinBiometria);
        } else if (resultado.motivo === 'error') {
          setError(MENSAJE_ERROR);
        }
        // 'cancelada': la persona cerró el cuadro del sistema a propósito. No
        // hay nada que reprocharle, así que no se muestra ningún aviso.
      }
    } catch {
      setError(MENSAJE_ERROR);
    } finally {
      setCreando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.contenedor}>
        <View style={estilos.contenido}>
          <View
            style={estilos.circulo}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <IconoBiometria tipo={textos.icono} tamano={30} />
          </View>

          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              Crea tu llave
            </Text>
            <Text style={estilos.subtitulo}>{textos.subtitulo}</Text>
          </View>

          <View style={estilos.tarjeta}>
            {GARANTIAS.map((garantia, i) => (
              <View key={garantia.titulo} style={[estilos.fila, i > 0 && estilos.filaConLinea]}>
                <Text style={estilos.filaTitulo}>{garantia.titulo}</Text>
                <Text style={estilos.filaDetalle}>{garantia.detalle}</Text>
              </View>
            ))}
          </View>

          {error !== null && (
            <Text style={estilos.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
        </View>

        <View style={estilos.pie}>
          <Pressable
            onPress={() => void crear()}
            disabled={creando}
            accessibilityRole="button"
            accessibilityState={{ disabled: creando, busy: creando }}
            style={({ pressed }) => [
              estilos.boton,
              creando && estilos.botonInactivo,
              pressed && estilos.botonPresionado,
            ]}
          >
            {!creando && <IconoBiometria tipo={textos.icono} tamano={22} color="#FFFFFF" />}
            <Text style={estilos.botonTexto}>
              {creando ? 'Creando tu llave…' : textos.boton}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenedor: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contenido: {
    flex: 1,
    paddingTop: 48,
    gap: 28,
  },
  circulo: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cobaltoSuave,
  },
  encabezado: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textoSecundario,
    textAlign: 'center',
  },
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    paddingVertical: 14,
    gap: 2,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  filaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  filaDetalle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.atrasado,
  },
  pie: {
    paddingBottom: 8,
  },
  boton: {
    minHeight: 52,
    flexDirection: 'row',
    gap: 8,
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
});
