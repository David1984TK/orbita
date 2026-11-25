import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type PropsTitulo = {
  nombre: string;
  /** Si se da, el título es un botón que abre la lista de círculos. */
  onAbrirLista?: () => void;
};

/**
 * El nombre del círculo como título de la pantalla. Cuando hay más de un círculo
 * es también la forma de cambiar de círculo: lleva una flechita y, al tocarlo,
 * abre "Mis círculos".
 */
export function TituloDeCirculo({ nombre, onAbrirLista }: PropsTitulo) {
  if (onAbrirLista === undefined) {
    return (
      <Text style={estilos.titulo} accessibilityRole="header">
        {nombre}
      </Text>
    );
  }
  return (
    <Pressable
      onPress={onAbrirLista}
      accessibilityRole="button"
      accessibilityLabel={`${nombre}. Cambiar de círculo.`}
      hitSlop={6}
      style={({ pressed }) => [estilos.filaTitulo, pressed && estilos.presionado]}
    >
      <Text style={estilos.titulo} accessibilityRole="header" numberOfLines={2}>
        {nombre}
      </Text>
      <Text style={estilos.flecha}>⌄</Text>
    </Pressable>
  );
}

type PropsPastilla = {
  nombre: string;
  onAbrirLista: () => void;
};

/**
 * Una pastilla pequeña con el nombre del círculo y una flechita, para las
 * pantallas cuyo título no es el nombre del círculo (por ejemplo "El grupo").
 */
export function PastillaDeCirculo({ nombre, onAbrirLista }: PropsPastilla) {
  return (
    <View style={estilos.contenedorPastilla}>
      <Pressable
        onPress={onAbrirLista}
        accessibilityRole="button"
        accessibilityLabel={`${nombre}. Cambiar de círculo.`}
        hitSlop={8}
        style={({ pressed }) => [estilos.pastilla, pressed && estilos.presionado]}
      >
        <Text style={estilos.pastillaTexto} numberOfLines={1}>
          {nombre}
        </Text>
        <Text style={estilos.pastillaFlecha}>⌄</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    flexShrink: 1,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flecha: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.cobalto,
    // La flecha "⌄" queda alta por su forma: se baja para alinearla con el texto.
    marginTop: -6,
  },
  presionado: {
    opacity: 0.6,
  },
  contenedorPastilla: {
    flexDirection: 'row',
  },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    borderRadius: 14,
    backgroundColor: colors.cobaltoSuave,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  pastillaTexto: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.cobalto,
  },
  pastillaFlecha: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cobalto,
    marginTop: -4,
  },
});
