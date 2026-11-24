import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

export type Pestana = 'circulo' | 'grupo' | 'perfil';

type Props = {
  activa: Pestana;
  onCambiar: (pestana: Pestana) => void;
};

const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: 'circulo', texto: 'Círculo' },
  { id: 'grupo', texto: 'Grupo' },
  { id: 'perfil', texto: 'Perfil' },
];

// Íconos de 24 x 24, solo trazos redondeados.
function Icono({ pestana, color }: { pestana: Pestana; color: string }) {
  const trazo = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {pestana === 'circulo' && (
        <>
          <Circle cx={12} cy={13.5} r={7} {...trazo} />
          <Circle cx={17} cy={4.5} r={1.6} fill={color} />
        </>
      )}
      {pestana === 'grupo' && (
        <>
          <Circle cx={9} cy={8.5} r={3} {...trazo} />
          <Path d="M3.5 19c0-3.1 2.4-5 5.5-5s5.5 1.9 5.5 5" {...trazo} />
          <Path d="M15.5 5.7a2.8 2.8 0 0 1 0 5.6" {...trazo} />
          <Path d="M17 14.3c2 .5 3.5 2 3.5 4.7" {...trazo} />
        </>
      )}
      {pestana === 'perfil' && (
        <>
          <Circle cx={12} cy={8} r={3.5} {...trazo} />
          <Path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" {...trazo} />
        </>
      )}
    </Svg>
  );
}

/**
 * Barra inferior con las tres secciones de la app. La pestaña actual va en
 * cobalto; las demás, en gris.
 */
export function BarraPestanas({ activa, onCambiar }: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={estilos.barra}>
      <View style={estilos.fila} accessibilityRole="tablist">
        {PESTANAS.map(({ id, texto }) => {
          const seleccionada = id === activa;
          const color = seleccionada ? colors.cobalto : colors.textoInactivo;
          return (
            <Pressable
              key={id}
              style={estilos.pestana}
              onPress={() => onCambiar(id)}
              accessibilityRole="tab"
              accessibilityLabel={texto}
              accessibilityState={{ selected: seleccionada }}
            >
              <Icono pestana={id} color={color} />
              <Text style={[estilos.texto, { color }]}>{texto}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  barra: {
    backgroundColor: colors.tarjeta,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  fila: {
    flexDirection: 'row',
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingTop: 8,
    paddingBottom: 6,
  },
  texto: {
    fontSize: 11,
    fontWeight: '500',
  },
});
