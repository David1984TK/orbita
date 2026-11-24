import { StyleSheet, Text, View } from 'react-native';
import { Marca } from '../components/Marca';
import { colors } from '../theme';

/**
 * Pantalla provisional. Solo confirma que la app arranca y que el logo se ve
 * bien. Se reemplaza por las pantallas de entrada y de uso diario del diseño.
 */
export function InicioScreen() {
  return (
    <View style={estilos.contenedor}>
      <Marca tamano={96} />
      <Text style={estilos.nombre}>Órbita</Text>
      <Text style={estilos.lema}>
        Tu ahorro en grupo, sin que nadie tenga que guardarlo.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
    backgroundColor: colors.fondo,
  },
  nombre: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.tinta,
  },
  lema: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.textoSecundario,
  },
});
