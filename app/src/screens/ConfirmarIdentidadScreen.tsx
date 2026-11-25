import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Marca } from '../components/Marca';
import { formatearHaceMeses, iniciales } from '../domain';
import type { RespuestaASolicitud, SolicitudDeRecuperacion } from '../servicios/recuperacion';
import { colors } from '../theme';

type Props = {
  solicitud: SolicitudDeRecuperacion;
  /** Manda la respuesta. Si lanza un error se avisa y se puede reintentar. */
  onResponder: (respuesta: RespuestaASolicitud) => Promise<void>;
};

const MENSAJE_ERROR = 'No pudimos mandar tu respuesta. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Lo que ve el grupo: la otra cara de la recuperación. Alguien del círculo perdió
 * su teléfono y le toca a otra persona decir si de verdad es quien dice ser.
 *
 * Sin una foto de por medio no hay decisión posible, y decir "no" tiene que ser
 * tan fácil como decir "sí": los dos botones están igual de a la mano, y se dice
 * que otra persona del círculo también puede responder.
 */
export function ConfirmarIdentidadScreen({ solicitud, onResponder }: Props) {
  const [respondiendo, setRespondiendo] = useState<RespuestaASolicitud | null>(null);
  const [error, setError] = useState<string | null>(null);
  const primerNombre = solicitud.nombre.trim().split(/\s+/)[0] ?? solicitud.nombre;

  async function responder(respuesta: RespuestaASolicitud) {
    if (respondiendo !== null) {
      return;
    }
    setRespondiendo(respuesta);
    setError(null);
    try {
      await onResponder(respuesta);
    } catch {
      setError(MENSAJE_ERROR);
    } finally {
      setRespondiendo(null);
    }
  }

  const ocupado = respondiendo !== null;

  return (
    <SafeAreaView style={estilos.pantalla}>
      <StatusBar style="light" />
      <ScrollView
        style={estilos.cuerpo}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.notificacion}>
          <View style={estilos.notificacionEncabezado}>
            <Marca tamano={22} />
            <Text style={estilos.notificacionApp}>Órbita</Text>
            <Text style={estilos.notificacionHora}>ahora</Text>
          </View>
          <Text style={estilos.notificacionTexto} accessibilityRole="header">
            {primerNombre} perdió su teléfono y quiere volver a entrar a {solicitud.circuloNombre}. ¿Es
            realmente {primerNombre}?
          </Text>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.persona}>
            <View
              style={estilos.avatar}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              <Text style={estilos.iniciales}>{iniciales(solicitud.nombre)}</Text>
            </View>
            <View style={estilos.textos}>
              <Text style={estilos.nombre}>{solicitud.nombre}</Text>
              <Text style={estilos.detalle}>
                Turno {solicitud.turno} · lleva {solicitud.cuotasPagadas}{' '}
                {solicitud.cuotasPagadas === 1 ? 'cuota pagada' : 'cuotas pagadas'}
              </Text>
            </View>
          </View>
          <View style={estilos.registro}>
            <Text style={estilos.registroTitulo}>Se registró</Text>
            <Text style={estilos.registroValor}>{formatearHaceMeses(solicitud.registradoHaceMeses)}</Text>
          </View>
        </View>

        <View style={estilos.ayuda}>
          <Text style={estilos.ayudaTexto}>
            Si tienes dudas, di que no. Otra persona del círculo puede responder.
          </Text>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        {error !== null && (
          <Text style={estilos.error} accessibilityRole="alert">
            {error}
          </Text>
        )}
        <Pressable
          onPress={() => void responder('confirmo')}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityState={{ disabled: ocupado, busy: respondiendo === 'confirmo' }}
          style={({ pressed }) => [
            estilos.boton,
            ocupado && estilos.botonInactivo,
            pressed && estilos.botonPresionado,
          ]}
        >
          <Text style={estilos.botonTexto}>
            {respondiendo === 'confirmo' ? 'Confirmando…' : `Sí, es ${primerNombre}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void responder('no-lo-reconozco')}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityState={{ disabled: ocupado, busy: respondiendo === 'no-lo-reconozco' }}
          style={({ pressed }) => [estilos.enlace, pressed && estilos.botonPresionado]}
        >
          <Text style={[estilos.enlaceTexto, ocupado && estilos.botonInactivo]}>
            {respondiendo === 'no-lo-reconozco' ? 'Avisando…' : `No reconozco a ${primerNombre}`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.noche,
  },
  cuerpo: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  notificacion: {
    borderRadius: 16,
    backgroundColor: colors.tarjeta,
    padding: 14,
    gap: 8,
  },
  notificacionEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificacionApp: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.tinta,
  },
  notificacionHora: {
    fontSize: 13,
    color: colors.textoInactivo,
  },
  notificacionTexto: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.tinta,
  },
  tarjeta: {
    borderRadius: 16,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  persona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cobalto,
  },
  iniciales: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.tinta,
  },
  detalle: {
    fontSize: 14,
    color: colors.textoSecundario,
  },
  registro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  registroTitulo: {
    fontSize: 16,
    color: colors.tinta,
  },
  registroValor: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  ayuda: {
    borderRadius: 12,
    backgroundColor: colors.nocheTarjeta,
    padding: 14,
  },
  ayudaTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.nocheTexto,
  },
  pie: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.nocheRechazo,
    marginBottom: 6,
  },
  boton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.cobalto,
  },
  botonInactivo: {
    opacity: 0.4,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enlace: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enlaceTexto: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.nocheRechazo,
  },
});
