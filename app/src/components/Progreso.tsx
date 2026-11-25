import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** El paso en que va, empezando en 1. */
  actual: number;
  total: number;
};

/** Rayitas de progreso: las del paso actual y las anteriores van en cobalto. */
export function Progreso({ actual, total }: Props) {
  return (
    <View style={estilos.fila} accessible accessibilityLabel={`Paso ${actual} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[estilos.segmento, i < actual && estilos.segmentoActivo]} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
  },
  segmento: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.linea,
  },
  segmentoActivo: {
    backgroundColor: colors.cobalto,
  },
});
