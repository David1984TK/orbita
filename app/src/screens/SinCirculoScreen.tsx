import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAX_INTEGRANTES, MIN_INTEGRANTES } from '../domain';
import { colors } from '../theme';

type Props = {
  /** La persona quiere crear su primer círculo. */
  onCrear: () => void;
};

/** Lo que ve quien todavía no está en ningún círculo. */
export function SinCirculoScreen({ onCrear }: Props) {
  return (
    <SafeAreaView edges={['top']} style={estilos.pantalla}>
      <View style={estilos.centro}>
        <Text style={estilos.titulo} accessibilityRole="header">
          Aún no tienes un círculo
        </Text>
        <Text style={estilos.texto}>
          Crea uno e invita a las personas que ya conoces: de {MIN_INTEGRANTES} a {MAX_INTEGRANTES}{' '}
          integrantes que aportan la misma cuota cada semana.
        </Text>
      </View>
      <View style={estilos.pie}>
        <Pressable
          onPress={onCrear}
          accessibilityRole="button"
          style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
        >
          <Text style={estilos.botonTexto}>Crear un círculo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    gap: 12,
    paddingHorizontal: 32,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
    color: colors.tinta,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
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
  botonPresionado: {
    opacity: 0.85,
  },
  botonTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
