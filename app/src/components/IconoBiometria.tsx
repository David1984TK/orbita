import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  /** `rostro` es el glifo de Face ID (iOS); `huella` es el de Android. */
  tipo: 'rostro' | 'huella';
  /** Lado del cuadrado en píxeles. */
  tamano?: number;
  color?: string;
};

// Lienzo de 24 x 24, solo trazos redondeados.
const ROSTRO = [
  // Las cuatro esquinas del marco
  'M4 8V6a2 2 0 0 1 2-2h2',
  'M16 4h2a2 2 0 0 1 2 2v2',
  'M20 16v2a2 2 0 0 1-2 2h-2',
  'M8 20H6a2 2 0 0 1-2-2v-2',
  // Ojos, nariz y sonrisa
  'M9 9.5v1.2',
  'M15 9.5v1.2',
  'M12 9.5v3.5h-1',
  'M9 15.5c.9 1 1.9 1.5 3 1.5s2.1-.5 3-1.5',
];

const HUELLA = [
  'M5 11a7 7 0 0 1 14 0',
  'M8 11a4 4 0 0 1 8 0v1.5',
  'M12 11v3.5c0 2.2-.5 4-1.5 5.5',
  'M15.5 14.5c0 2.6-.4 4.4-1.2 6',
  'M8.5 12.5c0 2.8-.4 5-1.6 6.8',
  'M19 11v2c0 2-.2 3.6-.7 5',
  'M5 11v2c0 1.2-.1 2.3-.4 3.2',
];

/** Ícono decorativo: va siempre acompañado de un texto que dice lo mismo. */
export function IconoBiometria({ tipo, tamano = 28, color = colors.cobalto }: Props) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      {(tipo === 'rostro' ? ROSTRO : HUELLA).map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
