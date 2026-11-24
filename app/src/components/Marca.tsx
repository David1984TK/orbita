import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  /** Lado del cuadrado en píxeles. El símbolo aguanta desde 16. */
  tamano?: number;
  /** Color del anillo (el grupo). */
  colorAnillo?: string;
  /** Color del punto (el turno). */
  colorPunto?: string;
};

/**
 * El símbolo de Órbita: una Ó cuyo acento es el turno.
 *
 * Las medidas salen del sistema de diseño y no se tocan:
 *   - lienzo de 100 x 100
 *   - anillo: centro (50, 62), radio 27, trazo 15
 *   - punto:  centro (66, 15), radio 9.5
 *
 * El punto va corrido a la derecha, nunca centrado arriba: centrado se lee como
 * el botón de apagado.
 */
export function Marca({
  tamano = 96,
  colorAnillo = colors.cobalto,
  colorPunto = colors.ambar,
}: Props) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 100 100">
      <Circle
        cx={50}
        cy={62}
        r={27}
        fill="none"
        stroke={colorAnillo}
        strokeWidth={15}
      />
      <Circle cx={66} cy={15} r={9.5} fill={colorPunto} />
    </Svg>
  );
}
