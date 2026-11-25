import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

type Props = {
  /**
   * Si hay que dejar el margen de abajo. Las pantallas con la barra de pestañas ya
   * lo dejan (la barra se apoya en él); las que van sin barra lo necesitan para que
   * sus botones no queden debajo de la barra de gestos del teléfono ni de sus
   * botones de navegación.
   */
  activo: boolean;
  testID?: string;
  children: ReactNode;
};

/**
 * Deja libre el espacio de abajo que el sistema se queda (la barra de gestos del
 * iPhone, los botones o la barra de navegación de Android). Siempre es el mismo
 * contenedor, con o sin margen, para que cambiar de pantalla no reinicie las que
 * ya están abiertas.
 */
export function ConMargenInferior({ activo, testID, children }: Props) {
  return (
    <SafeAreaInsetsContext.Consumer>
      {(margenes) => (
        <View
          testID={testID}
          style={[estilos.contenedor, { paddingBottom: activo ? (margenes?.bottom ?? 0) : 0 }]}
        >
          {children}
        </View>
      )}
    </SafeAreaInsetsContext.Consumer>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
});
