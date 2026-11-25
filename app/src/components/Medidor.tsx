import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import { trazoDeArco } from './ruedaGeometria';

type Props = {
  /** Qué parte del medidor se llena, de 0 a 1. */
  fraccion: number;
  /** El número grande del centro. */
  valor: string;
  /** La palabra bajo el número, en cobalto. */
  etiqueta: string;
  /** Lo que lee un lector de pantalla en lugar de los textos sueltos. */
  descripcion: string;
};

const LADO = 200;
const GROSOR = 12;
const RADIO = LADO / 2 - GROSOR;
// Un arco de tres cuartos de vuelta, abierto por abajo: empieza abajo a la
// izquierda (225°) y termina abajo a la derecha (495° = 135°).
const INICIO = 225;
const BARRIDO = 270;

/**
 * Medidor de tres cuartos de vuelta. El tramo lleno va en cobalto y el resto en
 * gris; el número y su etiqueta van al centro.
 */
export function Medidor({ fraccion, valor, etiqueta, descripcion }: Props) {
  const centro = LADO / 2;
  const llenado = Math.min(1, Math.max(0, fraccion)) * BARRIDO;

  return (
    <View style={estilos.contenedor} accessible accessibilityLabel={descripcion}>
      <Svg width={LADO} height={LADO} viewBox={`0 0 ${LADO} ${LADO}`}>
        <Path
          d={trazoDeArco(centro, centro, RADIO, INICIO, INICIO + BARRIDO)}
          fill="none"
          stroke={colors.linea}
          strokeWidth={GROSOR}
          strokeLinecap="round"
        />
        {llenado > 0 && (
          <Path
            d={trazoDeArco(centro, centro, RADIO, INICIO, INICIO + llenado)}
            fill="none"
            stroke={colors.cobalto}
            strokeWidth={GROSOR}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View style={estilos.centro} pointerEvents="none">
        <Text style={estilos.valor}>{valor}</Text>
        <Text style={estilos.etiqueta}>{etiqueta}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: LADO,
    height: LADO,
    alignSelf: 'center',
  },
  centro: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.tinta,
  },
  etiqueta: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.cobalto,
  },
});
