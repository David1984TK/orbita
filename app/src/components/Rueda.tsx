import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { EstadoSegmento } from '../domain';
import { colors } from '../theme';
import { trazoDeSegmento } from './ruedaGeometria';

type Props = {
  /** Un estado por semana, en orden. */
  segmentos: EstadoSegmento[];
  semanaActual: number;
};

const LADO = 240;
const GROSOR = 11;
const RADIO = LADO / 2 - GROSOR;
const HUECO = 5;

const COLOR_DEL_SEGMENTO: Record<EstadoSegmento, string> = {
  cobraron: colors.cobalto,
  tuTurno: colors.ambar,
  faltan: colors.linea,
};

const LEYENDA: { estado: EstadoSegmento; texto: string }[] = [
  { estado: 'cobraron', texto: 'Ya cobraron' },
  { estado: 'tuTurno', texto: 'Tu turno' },
  { estado: 'faltan', texto: 'Faltan' },
];

/**
 * La rueda: un anillo con un segmento por semana.
 *
 * Cobalto es el grupo (las semanas que ya pasaron) y ámbar es lo tuyo (tu
 * turno). Contesta de un vistazo en qué semana vamos y cuándo me toca.
 */
export function Rueda({ segmentos, semanaActual }: Props) {
  const total = segmentos.length;

  return (
    <View style={estilos.contenedor}>
      <View
        style={estilos.rueda}
        accessible
        accessibilityLabel={`Semana ${semanaActual} de ${total}`}
      >
        <Svg width={LADO} height={LADO} viewBox={`0 0 ${LADO} ${LADO}`}>
          {segmentos.map((estado, i) => (
            <Path
              // Las semanas son siempre las mismas y en el mismo orden.
              key={i}
              d={trazoDeSegmento(i, total, LADO / 2, LADO / 2, RADIO, HUECO)}
              fill="none"
              stroke={COLOR_DEL_SEGMENTO[estado]}
              strokeWidth={GROSOR}
            />
          ))}
        </Svg>
        <View style={estilos.centro} pointerEvents="none">
          <Text style={estilos.semana}>{semanaActual}</Text>
          <Text style={estilos.deTotal}>de {total} semanas</Text>
        </View>
      </View>

      <View style={estilos.leyenda}>
        {LEYENDA.map(({ estado, texto }) => (
          <View key={estado} style={estilos.leyendaItem}>
            <View style={[estilos.punto, { backgroundColor: COLOR_DEL_SEGMENTO[estado] }]} />
            <Text style={estilos.leyendaTexto}>{texto}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: 14,
  },
  rueda: {
    width: LADO,
    height: LADO,
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
  semana: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.tinta,
  },
  deTotal: {
    fontSize: 14,
    color: colors.textoSecundario,
  },
  leyenda: {
    flexDirection: 'row',
    gap: 16,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leyendaTexto: {
    fontSize: 12,
    color: colors.textoSecundario,
  },
});
