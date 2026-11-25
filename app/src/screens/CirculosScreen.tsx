import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  estaLleno,
  etiquetaDeEstado,
  formatearMonto,
  miIntegrante,
  textoDeFaltantesDelCirculo,
} from '../domain';
import type { CirculoEnFormacion, MiCirculo, TonoDeEstado } from '../domain';
import { colors } from '../theme';

type Props = {
  /** Los círculos en curso de la persona. */
  activos: MiCirculo[];
  /** El que se está viendo ahora, para marcarlo. */
  actualId: string | null;
  /** Los que todavía se están llenando. */
  enFormacion: CirculoEnFormacion[];
  /** La persona eligió uno de sus círculos en curso para verlo. */
  onElegir: (id: string) => void;
  /** La persona quiere ver cómo va uno de los que se están llenando. */
  onVerFormacion: (id: string) => void;
  /** La persona quiere crear otro círculo. */
  onCrear: () => void;
  /** Regresa sin elegir nada. */
  onVolver: () => void;
};

type TonoDeChip = TonoDeEstado | 'formando' | 'arranco';

const COLORES: Record<TonoDeChip, { fondo: object; texto: object }> = {
  alDia: { fondo: { backgroundColor: colors.alDiaSuave }, texto: { color: colors.alDia } },
  pendiente: { fondo: { backgroundColor: colors.fondo }, texto: { color: colors.textoSecundario } },
  atrasado: { fondo: { backgroundColor: colors.atrasadoSuave }, texto: { color: colors.atrasado } },
  formando: { fondo: { backgroundColor: colors.cobaltoSuave }, texto: { color: colors.cobalto } },
  arranco: { fondo: { backgroundColor: colors.alDiaSuave }, texto: { color: colors.alDia } },
};

function Chip({ texto, tono }: { texto: string; tono: TonoDeChip }) {
  return (
    <View style={[estilos.chip, COLORES[tono].fondo]}>
      <Text style={[estilos.chipTexto, COLORES[tono].texto]}>{texto}</Text>
    </View>
  );
}

/**
 * "Mis círculos": todos los círculos de la persona. Se puede estar en varios a la
 * vez; aquí se elige cuál ver en "Mi círculo", "Grupo", "Aportar" y "Tu turno", se
 * ve cómo van los que se están llenando y se crea otro.
 */
export function CirculosScreen({
  activos,
  actualId,
  enFormacion,
  onElegir,
  onVerFormacion,
  onCrear,
  onVolver,
}: Props) {
  return (
    <SafeAreaView edges={['top']} style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Pressable
          onPress={onVolver}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={12}
          style={estilos.volver}
        >
          <Text style={estilos.volverTexto}>‹ Volver</Text>
        </Pressable>

        <Text style={estilos.titulo} accessibilityRole="header">
          Mis círculos
        </Text>

        {activos.length > 0 && (
          <View style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>EN CURSO</Text>
            <View style={estilos.tarjeta}>
              {activos.map(({ circulo, yoId }, i) => {
                const actual = circulo.id === actualId;
                const etiqueta = etiquetaDeEstado(miIntegrante(circulo, yoId));
                const detalle = `Semana ${circulo.semanaActual} de ${circulo.integrantes.length} · ${formatearMonto(circulo.cuotaSemanal, circulo.moneda)} cada semana`;
                return (
                  <Pressable
                    key={circulo.id}
                    onPress={() => onElegir(circulo.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: actual }}
                    accessibilityLabel={`${circulo.nombre}. ${detalle}. ${etiqueta.texto}.${actual ? ' Es el que estás viendo.' : ''}`}
                    style={({ pressed }) => [
                      estilos.fila,
                      i > 0 && estilos.filaConLinea,
                      pressed && estilos.filaPresionada,
                    ]}
                  >
                    <View style={estilos.textos}>
                      <Text style={[estilos.nombre, actual && estilos.nombreActual]}>{circulo.nombre}</Text>
                      <Text style={estilos.detalle}>{detalle}</Text>
                    </View>
                    <Chip texto={etiqueta.texto} tono={etiqueta.tono} />
                    <Text style={[estilos.marca, !actual && estilos.marcaOculta]}>✓</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {enFormacion.length > 0 && (
          <View style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>SE ESTÁN LLENANDO</Text>
            <View style={estilos.tarjeta}>
              {enFormacion.map((formando, i) => {
                const lleno = estaLleno(formando);
                const detalle = `${textoDeFaltantesDelCirculo(formando)} · ${formatearMonto(formando.cuotaSemanal, formando.moneda)} cada semana`;
                return (
                  <Pressable
                    key={formando.id}
                    onPress={() => onVerFormacion(formando.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${formando.nombre}. ${detalle}. ${lleno ? 'Ya arrancó' : 'En formación'}.`}
                    style={({ pressed }) => [
                      estilos.fila,
                      i > 0 && estilos.filaConLinea,
                      pressed && estilos.filaPresionada,
                    ]}
                  >
                    <View style={estilos.textos}>
                      <Text style={estilos.nombre}>{formando.nombre}</Text>
                      <Text style={estilos.detalle}>{detalle}</Text>
                    </View>
                    <Chip texto={lleno ? 'Ya arrancó' : 'En formación'} tono={lleno ? 'arranco' : 'formando'} />
                    <Text style={estilos.flecha}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {activos.length === 0 && enFormacion.length === 0 && (
          <Text style={estilos.vacio}>Todavía no estás en ningún círculo.</Text>
        )}
      </ScrollView>

      <View style={estilos.pie}>
        <Pressable
          onPress={onCrear}
          accessibilityRole="button"
          style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
        >
          <Text style={estilos.botonTexto}>Crear un círculo</Text>
        </Pressable>
      </View>
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
    paddingTop: 12,
    paddingBottom: 20,
    gap: 20,
  },
  volver: {
    alignSelf: 'flex-start',
  },
  volverTexto: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.cobalto,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
  },
  seccion: {
    gap: 8,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: colors.textoSecundario,
    paddingHorizontal: 4,
  },
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  nombre: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.tinta,
  },
  nombreActual: {
    fontWeight: '700',
  },
  detalle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textoSecundario,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  marca: {
    width: 18,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.cobalto,
  },
  // Ocupa su lugar aunque no se vea, para que las filas queden alineadas.
  marcaOculta: {
    opacity: 0,
  },
  flecha: {
    width: 18,
    fontSize: 22,
    textAlign: 'center',
    color: colors.textoInactivo,
  },
  vacio: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.textoSecundario,
    paddingVertical: 24,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  boton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.cobalto,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
