import { useState } from 'react';
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
import { esTelefonoValido, formatearTelefono, normalizarTelefono } from '../domain';
import { colors } from '../theme';

type Props = {
  /** Con los 10 dígitos del teléfono, para mandar el código de WhatsApp. */
  onContinuar: (telefono: string) => void;
  /** Regresa a la pantalla de inicio. */
  onCancelar: () => void;
};

const PASOS = [
  { titulo: 'Confirmar tu número', detalle: 'Un minuto' },
  { titulo: 'Una selfie', detalle: 'La comparamos con tu registro' },
  { titulo: 'Tu grupo confirma', detalle: 'Unas horas, normalmente' },
];

/**
 * Primera pantalla de la recuperación: "Perdí mi teléfono". Dice qué va a pasar
 * y cuánto tarda antes de pedir nada.
 */
export function RecuperarScreen({ onContinuar, onCancelar }: Props) {
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
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={onCancelar}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            style={estilos.volver}
          >
            <Text style={estilos.volverTexto}>‹ Volver</Text>
          </Pressable>

          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              Recuperar mi acceso
            </Text>
            <Text style={estilos.subtitulo}>
              Tu llave vivía en el teléfono anterior. Vamos a crear una nueva.
            </Text>
          </View>

          <View style={estilos.tarjeta}>
            {PASOS.map((paso, i) => (
              <View key={paso.titulo} style={[estilos.fila, i > 0 && estilos.filaConLinea]}>
                <View
                  style={[estilos.numero, i === 0 && estilos.numeroActivo]}
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden
                >
                  <Text style={[estilos.numeroTexto, i === 0 && estilos.numeroTextoActivo]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={estilos.textos}>
                  <Text style={[estilos.filaTitulo, i > 0 && estilos.filaTituloPendiente]}>
                    {paso.titulo}
                  </Text>
                  <Text style={estilos.filaDetalle}>{paso.detalle}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.bandera}>🇲🇽</Text>
            <Text style={estilos.lada}>+52</Text>
            <View style={estilos.divisor} />
            <TextInput
              style={estilos.numeroCampo}
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

          <View style={estilos.aviso}>
            <Text style={estilos.avisoTexto}>Si tu número es el mismo de antes, escríbelo igual.</Text>
          </View>
        </ScrollView>

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
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 20,
  },
  volver: {
    alignSelf: 'flex-start',
  },
  volverTexto: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.cobalto,
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
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  numeroActivo: {
    backgroundColor: colors.cobalto,
  },
  numeroTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textoSecundario,
  },
  numeroTextoActivo: {
    color: '#FFFFFF',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  filaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  filaTituloPendiente: {
    fontWeight: '400',
  },
  filaDetalle: {
    fontSize: 14,
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
  numeroCampo: {
    flex: 1,
    fontSize: 17,
    color: colors.tinta,
    paddingVertical: 14,
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
    paddingBottom: 12,
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
