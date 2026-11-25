import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  esCodigoCompleto,
  formatearCuentaAtras,
  formatearTelefono,
  LARGO_CODIGO,
  normalizarCodigo,
} from '../domain';
import { colors } from '../theme';

type Props = {
  /** Los 10 dígitos del teléfono al que se mandó el código. */
  telefono: string;
  /**
   * Comprueba el código con el servidor. Devuelve `true` si es correcto y
   * `false` si no lo es. Si no se pudo preguntar (sin internet, servidor caído)
   * debe lanzar un error: eso no es lo mismo que un código equivocado.
   */
  onVerificar: (codigo: string) => Promise<boolean>;
  /** Pide que se mande otro código al mismo teléfono. */
  onReenviar: () => void;
  /** Regresa a la pantalla del teléfono. */
  onCambiarNumero: () => void;
  /** Segundos de espera antes de poder pedir otro código. */
  segundosParaReenviar?: number;
};

const ESPERA_PARA_REENVIAR = 60;

const MENSAJE_INCORRECTO = 'Ese código no es correcto. Revísalo e inténtalo de nuevo.';
const MENSAJE_SIN_CONEXION =
  'No pudimos verificar el código. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Segunda pantalla de entrada: el código de 6 dígitos que llega por WhatsApp.
 *
 * Un solo campo de texto captura los dígitos y las seis casillas solo los
 * muestran. Así funciona pegar el código completo y el autorrelleno del
 * teclado. El campo va transparente encima de las casillas, de modo que tocar
 * una casilla es tocar el campo.
 */
export function CodigoScreen({
  telefono,
  onVerificar,
  onReenviar,
  onCambiarNumero,
  segundosParaReenviar = ESPERA_PARA_REENVIAR,
}: Props) {
  const [codigo, setCodigo] = useState('');
  const [enfocado, setEnfocado] = useState(true);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venceEn, setVenceEn] = useState(() => Date.now() + segundosParaReenviar * 1000);
  const [restantes, setRestantes] = useState(segundosParaReenviar);

  // La cuenta atrás se calcula contra una hora de vencimiento, no restando de
  // uno en uno: si la app pasa un rato en segundo plano, al volver muestra el
  // tiempo real que falta.
  useEffect(() => {
    const calcular = () => Math.max(0, Math.ceil((venceEn - Date.now()) / 1000));
    setRestantes(calcular());
    const id = setInterval(() => {
      const faltan = calcular();
      setRestantes(faltan);
      if (faltan === 0) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [venceEn]);

  const completo = esCodigoCompleto(codigo);
  const puedeContinuar = completo && !verificando;
  const puedeReenviar = restantes === 0;

  function cambiarCodigo(texto: string) {
    setCodigo(normalizarCodigo(texto));
    setError(null);
  }

  async function continuar() {
    if (!puedeContinuar) {
      return;
    }
    setVerificando(true);
    setError(null);
    try {
      const correcto = await onVerificar(codigo);
      if (!correcto) {
        setCodigo('');
        setError(MENSAJE_INCORRECTO);
      }
    } catch {
      // No se borra lo escrito: el código pudo estar bien.
      setError(MENSAJE_SIN_CONEXION);
    } finally {
      setVerificando(false);
    }
  }

  function reenviar() {
    if (!puedeReenviar) {
      return;
    }
    onReenviar();
    setCodigo('');
    setError(null);
    setVenceEn(Date.now() + segundosParaReenviar * 1000);
  }

  // Casilla con el borde azul: la siguiente por llenar, o la última si ya están
  // todas llenas.
  const casillaActiva = Math.min(codigo.length, LARGO_CODIGO - 1);

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView
        style={estilos.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={estilos.cuerpo}
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              Tu código
            </Text>
            <Text style={estilos.subtitulo}>
              Te lo mandamos por WhatsApp al {formatearTelefono(telefono)}
            </Text>
          </View>

          <View style={estilos.casillas}>
            {Array.from({ length: LARGO_CODIGO }, (_, i) => (
              <View
                key={i}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
                style={[
                  estilos.casilla,
                  enfocado && i === casillaActiva && estilos.casillaActiva,
                  error !== null && estilos.casillaError,
                ]}
              >
                <Text style={estilos.digito}>{codigo[i] ?? ''}</Text>
              </View>
            ))}
            <TextInput
              style={estilos.campoOculto}
              value={codigo}
              onChangeText={cambiarCodigo}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              onSubmitEditing={() => void continuar()}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              returnKeyType="done"
              autoFocus
              caretHidden
              editable={!verificando}
              accessibilityLabel={`Código de ${LARGO_CODIGO} dígitos`}
            />
          </View>

          {error !== null && (
            <Text style={estilos.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          <Text style={estilos.ayuda}>
            {puedeReenviar ? (
              <Text style={estilos.enlace} accessibilityRole="button" onPress={reenviar}>
                Reenviar código
              </Text>
            ) : (
              `Reenviar en ${formatearCuentaAtras(restantes)}`
            )}
            {' · '}
            <Text style={estilos.enlace} accessibilityRole="button" onPress={onCambiarNumero}>
              Cambiar número
            </Text>
          </Text>
        </ScrollView>

        <View style={estilos.pie}>
          <Pressable
            onPress={() => void continuar()}
            disabled={!puedeContinuar}
            accessibilityRole="button"
            accessibilityState={{ disabled: !puedeContinuar, busy: verificando }}
            style={({ pressed }) => [
              estilos.boton,
              !puedeContinuar && estilos.botonInactivo,
              pressed && estilos.botonPresionado,
            ]}
          >
            <Text style={estilos.botonTexto}>{verificando ? 'Verificando…' : 'Continuar'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  teclado: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cuerpo: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    paddingTop: 24,
    gap: 28,
  },
  encabezado: {
    gap: 6,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textoSecundario,
  },
  casillas: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  casilla: {
    flex: 1,
    maxWidth: 48,
    aspectRatio: 0.78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.tarjeta,
  },
  casillaActiva: {
    borderColor: colors.cobalto,
  },
  casillaError: {
    borderColor: colors.atrasado,
  },
  digito: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.tinta,
  },
  // Cubre todas las casillas; transparente, pero recibe los toques y el foco.
  campoOculto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.atrasado,
  },
  ayuda: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  enlace: {
    color: colors.cobalto,
    fontWeight: '500',
  },
  pie: {
    paddingBottom: 8,
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
});
