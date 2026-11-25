import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Progreso } from '../components/Progreso';
import {
  DIAS_SIN_RESPUESTA,
  detalleDeConfirmacion,
  etiquetaDeConfirmacion,
  iniciales,
  resumenDeConfirmaciones,
  textoDeFaltantes,
} from '../domain';
import type { EstadoDeConfirmacion } from '../domain';
import type { EstadoDeLaConfirmacion } from '../servicios/recuperacion';
import { colors } from '../theme';

type Props = {
  /** Consulta quién del grupo ya confirmó. Si lanza un error se vuelve a intentar. */
  obtener: () => Promise<EstadoDeLaConfirmacion>;
  /** Manda otro aviso a quienes no han respondido. */
  onAvisar: () => Promise<void>;
  /** Ya confirmaron las personas necesarias. Se llama una sola vez. */
  onConfirmado: () => void;
  /** Cada cuántos milisegundos se vuelve a consultar. */
  intervaloMs?: number;
};

const INTERVALO_POR_DEFECTO = 5000;

const COLORES: Record<EstadoDeConfirmacion, { fondo: object; texto: object }> = {
  confirmo: { fondo: { backgroundColor: colors.alDiaSuave }, texto: { color: colors.alDia } },
  esperando: { fondo: { backgroundColor: colors.cobaltoSuave }, texto: { color: colors.cobalto } },
  rechazo: { fondo: { backgroundColor: colors.atrasadoSuave }, texto: { color: colors.atrasado } },
};

/**
 * Tercera parte de la recuperación: el grupo confirma. La espera se muestra con
 * nombres y no con una rueda girando, y siempre hay una salida si nadie responde.
 * Consulta sola cada pocos segundos y avanza en cuanto hay las confirmaciones.
 */
export function GrupoConfirmaScreen({
  obtener,
  onAvisar,
  onConfirmado,
  intervaloMs = INTERVALO_POR_DEFECTO,
}: Props) {
  const [estado, setEstado] = useState<EstadoDeLaConfirmacion | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [avisando, setAvisando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const yaAvanzo = useRef(false);

  // Las funciones de las props pueden cambiar en cada render; se guardan para que
  // la consulta periódica siempre use la última sin reiniciar el temporizador.
  const ultimas = useRef({ obtener, onConfirmado });
  ultimas.current = { obtener, onConfirmado };

  useEffect(() => {
    let activo = true;

    async function consultar() {
      try {
        const nuevo = await ultimas.current.obtener();
        if (!activo) {
          return;
        }
        setEstado(nuevo);
        setSinConexion(false);
        if (resumenDeConfirmaciones(nuevo.personas).completo && !yaAvanzo.current) {
          yaAvanzo.current = true;
          ultimas.current.onConfirmado();
        }
      } catch {
        if (activo) {
          setSinConexion(true);
        }
      }
    }

    void consultar();
    const id = setInterval(() => void consultar(), intervaloMs);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [intervaloMs]);

  async function avisar() {
    if (avisando) {
      return;
    }
    setAvisando(true);
    setAviso(null);
    try {
      await onAvisar();
      setAviso('Les mandamos otro aviso.');
    } catch {
      setAviso('No pudimos mandar el aviso. Inténtalo de nuevo.');
    } finally {
      setAvisando(false);
    }
  }

  const resumen = estado === null ? null : resumenDeConfirmaciones(estado.personas);

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.encabezado}>
          <Text style={estilos.paso}>Paso 3 de 3</Text>
          <Text style={estilos.titulo} accessibilityRole="header">
            Tu grupo confirma
          </Text>
          <Text style={estilos.subtitulo}>
            {estado === null
              ? 'Revisando quién ya confirmó…'
              : `Les preguntamos a ${estado.personas.length} personas de ${estado.circuloNombre}`}
          </Text>
        </View>

        <Progreso actual={3} total={3} />

        {estado !== null && (
          <View style={estilos.tarjeta}>
            {estado.personas.map((persona, i) => (
              <View
                key={persona.id}
                style={[estilos.fila, i > 0 && estilos.filaConLinea]}
                accessible
                accessibilityLabel={`${persona.nombre}, ${detalleDeConfirmacion(persona)}, ${etiquetaDeConfirmacion(persona.estado)}`}
              >
                <View
                  style={[estilos.avatar, COLORES[persona.estado].fondo]}
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden
                >
                  <Text style={[estilos.iniciales, COLORES[persona.estado].texto]}>
                    {iniciales(persona.nombre)}
                  </Text>
                </View>
                <View style={estilos.textos}>
                  <Text style={estilos.nombre}>{persona.nombre}</Text>
                  <Text style={estilos.detalle}>{detalleDeConfirmacion(persona)}</Text>
                </View>
                <View style={[estilos.etiqueta, COLORES[persona.estado].fondo]}>
                  <Text style={[estilos.etiquetaTexto, COLORES[persona.estado].texto]}>
                    {etiquetaDeConfirmacion(persona.estado)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {resumen !== null && !resumen.completo && (
          <View style={estilos.aviso}>
            <Text style={estilos.avisoTexto}>
              <Text style={estilos.negrita}>{textoDeFaltantes(resumen.faltan)}</Text> Puedes
              escribirles por WhatsApp para apurarlos.
            </Text>
          </View>
        )}

        {sinConexion && (
          <Text style={estilos.sinConexion} accessibilityRole="alert">
            No pudimos revisar las confirmaciones. Seguimos intentando.
          </Text>
        )}
      </ScrollView>

      <View style={estilos.pie}>
        {aviso !== null && <Text style={estilos.nota}>{aviso}</Text>}
        <Pressable
          onPress={() => void avisar()}
          disabled={avisando}
          accessibilityRole="button"
          accessibilityState={{ disabled: avisando, busy: avisando }}
          style={({ pressed }) => [
            estilos.boton,
            avisando && estilos.botonInactivo,
            pressed && estilos.botonPresionado,
          ]}
        >
          <Text style={estilos.botonTexto}>{avisando ? 'Avisando…' : 'Avisarles por WhatsApp'}</Text>
        </Pressable>
        <Text style={estilos.nota}>
          Si nadie responde, recuperas el acceso solo en {DIAS_SIN_RESPUESTA} días.
        </Text>
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
    paddingTop: 24,
    paddingBottom: 16,
    gap: 20,
  },
  encabezado: {
    gap: 4,
  },
  paso: {
    fontSize: 15,
    color: colors.textoSecundario,
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
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: {
    fontSize: 14,
    fontWeight: '600',
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
  detalle: {
    fontSize: 13,
    color: colors.textoSecundario,
  },
  etiqueta: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  etiquetaTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  aviso: {
    borderRadius: 12,
    backgroundColor: colors.cobaltoSuave,
    padding: 16,
  },
  avisoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.tinta,
  },
  negrita: {
    fontWeight: '700',
  },
  sinConexion: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  boton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.linea,
  },
  botonInactivo: {
    opacity: 0.5,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.tinta,
  },
  nota: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
});
