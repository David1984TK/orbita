import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

type Props = {
  /** La persona está lista para empezar con la foto de su INE. */
  onTomarFoto: () => void;
};

// Los tres pasos de la verificación. Esta pantalla solo los presenta y deja
// listo el primero; cada paso tendrá su propia pantalla de captura.
const PASOS = [
  { titulo: 'Foto de tu INE', detalle: 'Por delante y por detrás' },
  { titulo: 'Una selfie', detalle: 'Para confirmar que eres tú' },
  { titulo: 'Tu domicilio', detalle: 'Solo el que aparece en tu INE' },
];

const PASO_ACTUAL = 0;

/**
 * Cuarta pantalla de entrada: presenta la verificación de identidad.
 *
 * La verificación es obligatoria por ley y se dice así, sin rodeos. También se
 * aclara que es una sola vez y que los documentos no los ve nadie del grupo.
 */
export function IdentidadScreen({ onTomarFoto }: Props) {
  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.contenedor}>
        <View style={estilos.contenido}>
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              Tu identidad
            </Text>
            <Text style={estilos.subtitulo}>
              La ley lo pide para mover dinero. Se hace una sola vez.
            </Text>
          </View>

          <View
            style={estilos.progreso}
            accessible
            accessibilityLabel={`Paso ${PASO_ACTUAL + 1} de ${PASOS.length}`}
          >
            {PASOS.map((paso, i) => (
              <View
                key={paso.titulo}
                style={[estilos.segmento, i <= PASO_ACTUAL && estilos.segmentoActivo]}
              />
            ))}
          </View>

          <View style={estilos.tarjeta}>
            {PASOS.map((paso, i) => {
              const activo = i === PASO_ACTUAL;
              return (
                <View key={paso.titulo} style={[estilos.fila, i > 0 && estilos.filaConLinea]}>
                  <View
                    style={[estilos.numero, activo && estilos.numeroActivo]}
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                  >
                    <Text style={[estilos.numeroTexto, activo && estilos.numeroTextoActivo]}>
                      {i + 1}
                    </Text>
                  </View>
                  <View style={estilos.textos}>
                    <Text style={[estilos.filaTitulo, !activo && estilos.filaTituloPendiente]}>
                      {paso.titulo}
                    </Text>
                    <Text style={estilos.filaDetalle}>{paso.detalle}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={estilos.aviso}>
            <Text style={estilos.avisoTexto}>
              Tus documentos se usan solo para verificarte. No se comparten con los demás
              integrantes de tu círculo.
            </Text>
          </View>
        </View>

        <View style={estilos.pie}>
          <Pressable
            onPress={onTomarFoto}
            accessibilityRole="button"
            style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
          >
            <Text style={estilos.botonTexto}>Tomar foto de mi INE</Text>
          </Pressable>
          <Text style={estilos.nota}>Toma menos de dos minutos</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenedor: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contenido: {
    flex: 1,
    paddingTop: 24,
    gap: 20,
  },
  encabezado: {
    gap: 6,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textoSecundario,
  },
  progreso: {
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
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  numeroActivo: {
    backgroundColor: colors.cobalto,
  },
  numeroTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textoSecundario,
  },
  numeroTextoActivo: {
    color: '#FFFFFF',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  filaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  // Los pasos que todavía no tocan pesan menos: el ojo va al primero.
  filaTituloPendiente: {
    fontWeight: '400',
  },
  filaDetalle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  aviso: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    padding: 16,
  },
  avisoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  pie: {
    gap: 12,
    paddingBottom: 8,
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
  nota: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
});
