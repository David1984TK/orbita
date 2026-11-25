import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Marca } from '../components/Marca';
import {
  esTelefonoValido,
  formatearTelefono,
  normalizarTelefono,
} from '../domain';
import { colors } from '../theme';

type Props = {
  /**
   * Se llama al tocar "Continuar" con el teléfono ya limpio: los 10 dígitos,
   * sin espacios ni lada del país. Ejemplo: "5512345678".
   */
  onContinuar: (telefono: string) => void;
  /** La persona perdió su teléfono y quiere recuperar el acceso. */
  onRecuperar: () => void;
};

/**
 * Primera pantalla de entrada: el teléfono.
 *
 * No hay correo ni contraseña: el número es la identidad, como en WhatsApp. El
 * siguiente paso (el código por WhatsApp) todavía no existe; esta pantalla solo
 * entrega el número limpio a quien la use.
 */
export function LoginScreen({ onContinuar, onRecuperar }: Props) {
  // Se guardan solo los dígitos. Lo que se ve en el campo ("55 1234 5678") se
  // calcula a partir de ellos, así el texto nunca puede quedar mal formado.
  const [digitos, setDigitos] = useState('');
  const valido = esTelefonoValido(digitos);

  function continuar() {
    if (valido) {
      onContinuar(digitos);
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView
        style={estilos.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.centro}>
          <View style={estilos.marca}>
            <Marca tamano={72} />
            <Text style={estilos.nombre}>Órbita</Text>
            <Text style={estilos.lema}>
              Tu ahorro en grupo, sin que nadie tenga que guardarlo.
            </Text>
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.bandera}>🇲🇽</Text>
            <Text style={estilos.lada}>+52</Text>
            <View style={estilos.divisor} />
            <TextInput
              style={estilos.numero}
              value={formatearTelefono(digitos)}
              onChangeText={(texto) => setDigitos(normalizarTelefono(texto))}
              placeholder="55 1234 5678"
              placeholderTextColor={colors.textoTenue}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="done"
              onSubmitEditing={continuar}
              accessibilityLabel="Número de teléfono celular, 10 dígitos"
            />
          </View>
        </View>

        <View style={estilos.pie}>
          <Pressable
            onPress={continuar}
            disabled={!valido}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valido }}
            style={({ pressed }) => [
              estilos.boton,
              !valido && estilos.botonInactivo,
              pressed && estilos.botonPresionado,
            ]}
          >
            <Text style={estilos.botonTexto}>Continuar</Text>
          </Pressable>

          {/* Texto plano a propósito. Cuando existan el Aviso de Privacidad y
              los Términos, estas dos frases se vuelven enlaces. Un enlace que
              no lleva a ningún lado es peor que no tener enlace. */}
          <Text style={estilos.legal}>
            Al continuar aceptas los Términos y el Aviso de Privacidad.
          </Text>

          <Pressable onPress={onRecuperar} accessibilityRole="button" hitSlop={8}>
            <Text style={estilos.recuperar}>Perdí mi teléfono</Text>
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
  centro: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  marca: {
    alignItems: 'center',
    gap: 12,
  },
  nombre: {
    fontSize: 29,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.tinta,
  },
  lema: {
    maxWidth: 240,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.textoSecundario,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
  },
  bandera: {
    fontSize: 18,
  },
  lada: {
    fontSize: 17,
    color: colors.tinta,
  },
  divisor: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 10,
    backgroundColor: colors.separador,
  },
  numero: {
    flex: 1,
    fontSize: 17,
    color: colors.tinta,
    paddingVertical: 14,
  },
  pie: {
    paddingBottom: 8,
    gap: 10,
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
  recuperar: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    color: colors.cobalto,
    paddingVertical: 4,
  },
  legal: {
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.textoSecundario,
  },
});
