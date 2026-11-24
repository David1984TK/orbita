import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

type Props = {
  texto: string;
  /** Si se da, muestra un botón para regresar. */
  onVolver?: () => void;
};

/**
 * Marcador de lugar para una pantalla que todavía no existe. Cada uso es una
 * pantalla pendiente: cuando se construye, se cambia este componente por ella.
 */
export function PantallaProvisional({ texto, onVolver }: Props) {
  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.centro}>
        <Text style={estilos.texto}>{texto}</Text>
        {onVolver !== undefined && (
          <Pressable onPress={onVolver} accessibilityRole="button" style={estilos.enlace}>
            <Text style={estilos.enlaceTexto}>Volver</Text>
          </Pressable>
        )}
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
    gap: 16,
    padding: 24,
  },
  texto: {
    fontSize: 17,
    textAlign: 'center',
    color: colors.tinta,
  },
  enlace: {
    padding: 8,
  },
  enlaceTexto: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.cobalto,
  },
});
