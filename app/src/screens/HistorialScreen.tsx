import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Medidor } from '../components/Medidor';
import { formatearMonto, fraccionDelPuntaje } from '../domain';
import type { Historial } from '../domain';
import { colors } from '../theme';

type Props = {
  historial: Historial;
  /** La persona quiere compartir su historial (por ejemplo, para pedir un crédito). */
  onCompartir: () => void;
};

/**
 * Quinta pantalla de uso diario: mi historial. El puntaje no se llama así: se
 * explica por lo que desbloquea (desde qué turno puedes cobrar), no por el número.
 */
export function HistorialScreen({ historial, onCompartir }: Props) {
  const { nivel, siguienteNivel } = historial;
  const todoATiempo = historial.pagosATiempo === historial.pagosTotales;

  return (
    <SafeAreaView edges={['top']} style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.titulo} accessibilityRole="header">
          Mi historial
        </Text>

        <Medidor
          fraccion={fraccionDelPuntaje(historial.puntaje, historial.puntajeMaximo)}
          valor={String(historial.puntaje)}
          etiqueta={nivel.nombre}
          descripcion={`Nivel ${nivel.nombre}, ${historial.puntaje} de ${historial.puntajeMaximo} puntos`}
        />

        <View style={estilos.aviso}>
          <Text style={estilos.avisoTexto}>
            Con tu historial actual puedes cobrar desde el{' '}
            <Text style={estilos.negrita}>turno {nivel.cobraDesdeTurno}</Text>.{' '}
            {siguienteNivel !== undefined ? (
              <>
                Completa este círculo y subes a{' '}
                <Text style={estilos.negrita}>{siguienteNivel.nombre}</Text>, que te deja cobrar desde
                el turno {siguienteNivel.cobraDesdeTurno}.
              </>
            ) : (
              'Estás en el nivel más alto.'
            )}
          </Text>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.fila}>
            <Text style={estilos.filaTitulo}>Pagos a tiempo</Text>
            <Text style={[estilos.filaValor, todoATiempo && estilos.filaValorVerde]}>
              {historial.pagosATiempo} de {historial.pagosTotales}
            </Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.filaTitulo}>Círculos completados</Text>
            <Text style={estilos.filaValor}>{historial.circulosCompletados}</Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.filaTitulo}>Ahorrado con Órbita</Text>
            <Text style={estilos.filaValor}>{formatearMonto(historial.ahorrado, historial.moneda)}</Text>
          </View>
          <Pressable
            onPress={onCompartir}
            accessibilityRole="button"
            accessibilityLabel="Compartir mi historial, para pedir un crédito en otro lado"
            style={({ pressed }) => [
              estilos.fila,
              estilos.filaConLinea,
              pressed && estilos.filaPresionada,
            ]}
          >
            <View style={estilos.textos}>
              <Text style={estilos.filaTitulo}>Compartir mi historial</Text>
              <Text style={estilos.filaDetalle}>Para pedir un crédito en otro lado</Text>
            </View>
            <Text style={estilos.flecha}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
  },
  aviso: {
    borderRadius: 12,
    backgroundColor: colors.cobaltoSuave,
    padding: 16,
  },
  avisoTexto: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.tinta,
  },
  negrita: {
    fontWeight: '700',
  },
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  filaPresionada: {
    opacity: 0.6,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  filaTitulo: {
    fontSize: 16,
    color: colors.tinta,
  },
  filaDetalle: {
    fontSize: 13,
    color: colors.textoSecundario,
  },
  filaValor: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  filaValorVerde: {
    color: colors.alDia,
  },
  flecha: {
    fontSize: 24,
    color: colors.textoInactivo,
  },
});
