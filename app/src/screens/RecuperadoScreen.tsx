import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { IconoBiometria } from '../components/IconoBiometria';
import { HORAS_SIN_RETIRAR } from '../domain';
import { plataformaActual } from '../plataforma';
import type { Plataforma } from '../plataforma';
import type { ResumenDeRecuperacion } from '../servicios/recuperacion';
import { colors } from '../theme';

type Props = {
  resumen: ResumenDeRecuperacion;
  /** Entra a la app, al círculo de siempre. */
  onEntrar: () => void;
  /** Solo para pruebas: por defecto sale de la plataforma real. */
  plataforma?: Plataforma;
};

function Palomita() {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
      <Path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke={colors.alDia}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Última pantalla de la recuperación: ya entraste. La espera de 72 horas se
 * explica como una protección, no como un castigo, y se dice que el grupo fue
 * avisado.
 */
export function RecuperadoScreen({ resumen, onEntrar, plataforma = plataformaActual() }: Props) {
  const cuotas =
    resumen.cuotasPagadas === 1 ? '1 cuota pagada' : `${resumen.cuotasPagadas} cuotas pagadas`;

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.celebracion}>
          <View
            style={estilos.circulo}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Palomita />
          </View>
          <Text style={estilos.titulo} accessibilityRole="header">
            Recuperaste tu acceso
          </Text>
          <Text style={estilos.subtitulo}>
            Tu llave nueva ya está en este teléfono. La anterior quedó anulada.
          </Text>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.fila}>
            <Text style={estilos.filaTitulo}>Tu círculo sigue igual</Text>
            <Text style={estilos.filaDetalle}>
              {cuotas} · cobras en la semana {resumen.cobraEnSemana}
            </Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.filaTitulo}>Tu historial</Text>
            <Text style={estilos.filaDetalle}>Intacto, {resumen.puntaje} puntos</Text>
          </View>
        </View>

        <View style={estilos.aviso}>
          <Text style={estilos.avisoTexto}>
            <Text style={estilos.negrita}>
              Por seguridad no puedes retirar dinero durante {HORAS_SIN_RETIRAR} horas.
            </Text>{' '}
            Avisamos a todo tu círculo por si no fuiste tú quien hizo esto.
          </Text>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Pressable
          onPress={onEntrar}
          accessibilityRole="button"
          style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
        >
          <IconoBiometria
            tipo={plataforma === 'ios' ? 'rostro' : 'huella'}
            tamano={22}
            color="#FFFFFF"
          />
          <Text style={estilos.botonTexto}>Entrar a mi círculo</Text>
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
    paddingTop: 48,
    paddingBottom: 16,
    gap: 24,
  },
  celebracion: {
    alignItems: 'center',
    gap: 8,
  },
  circulo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alDiaSuave,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
    color: colors.tinta,
  },
  subtitulo: {
    maxWidth: 280,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textoSecundario,
  },
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    paddingVertical: 14,
    gap: 2,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  filaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  filaDetalle: {
    fontSize: 14,
    color: colors.textoSecundario,
  },
  aviso: {
    borderRadius: 12,
    backgroundColor: colors.precaucionSuave,
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
  pie: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  boton: {
    minHeight: 52,
    flexDirection: 'row',
    gap: 8,
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
