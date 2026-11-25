import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  boteDelCirculo,
  estaLleno,
  formatearMonto,
  iniciales,
  lugaresDelCirculo,
  mensajeDeInvitacion,
  resumenDeMiTurno,
  textoDeFaltantesDelCirculo,
} from '../domain';
import type { CirculoEnFormacion, MiCirculo } from '../domain';
import type { ResultadoDeCompartir } from '../servicios/compartir';
import { colors } from '../theme';

type Props = {
  /** El círculo tal como está al abrir la pantalla. */
  circulo: CirculoEnFormacion;
  /** Consulta cómo va el círculo. Si lanza un error se vuelve a intentar. */
  obtener: () => Promise<CirculoEnFormacion>;
  /** El círculo cambió (entró alguien): para que el resto de la app lo sepa. */
  onActualizado: (circulo: CirculoEnFormacion) => void;
  /** Abre el cuadro de compartir con el mensaje de invitación. */
  onCompartir: (mensaje: string) => Promise<ResultadoDeCompartir>;
  /**
   * Cuando el círculo se llena, pregunta si ya arrancó: devuelve el círculo en
   * curso, o `null` si todavía no. Si lanza un error se vuelve a intentar.
   */
  obtenerArranque: () => Promise<MiCirculo | null>;
  /**
   * `true` si la app puede mostrar el círculo que arrancó como "Mi círculo". Hoy
   * solo muestra uno: si la persona ya está en otro, todavía no.
   */
  puedeVerlo: boolean;
  /** La persona quiere ver su círculo ya en marcha. */
  onVerCirculo: (circulo: MiCirculo) => void;
  /** Si se da, muestra "‹ Volver" para regresar a donde estaba la persona. */
  onVolver?: () => void;
  /** Cada cuántos milisegundos se vuelve a consultar. */
  intervaloMs?: number;
};

const INTERVALO_POR_DEFECTO = 5000;
const MENSAJE_ERROR_AL_COMPARTIR = 'No pudimos abrir el cuadro de compartir. Inténtalo de nuevo.';

/**
 * Un círculo que se está llenando: ya se creó, falta que entren las demás
 * personas. Se invita mandando el enlace por WhatsApp, y la pantalla se
 * actualiza sola conforme van entrando. Cuando entran todas, el círculo arranca:
 * la pantalla lo anuncia, dice cuál es el turno de la persona y deja pasar a "Mi
 * círculo".
 */
export function FormandoScreen({
  circulo: inicial,
  obtener,
  onActualizado,
  onCompartir,
  obtenerArranque,
  puedeVerlo,
  onVerCirculo,
  onVolver,
  intervaloMs = INTERVALO_POR_DEFECTO,
}: Props) {
  const [circulo, setCirculo] = useState(inicial);
  const [arranque, setArranque] = useState<MiCirculo | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Se guardan las últimas funciones para que la consulta periódica use siempre
  // las vigentes sin reiniciar el temporizador.
  const ultimas = useRef({ obtener, onActualizado, obtenerArranque });
  ultimas.current = { obtener, onActualizado, obtenerArranque };

  const lleno = estaLleno(circulo);

  // Ya entraron todas: se pregunta si el círculo arrancó (el contrato asigna los
  // turnos), de inmediato y luego cada pocos segundos hasta que sí.
  useEffect(() => {
    if (!lleno || arranque !== null) {
      return undefined;
    }
    let activo = true;

    async function consultar() {
      try {
        const arrancado = await ultimas.current.obtenerArranque();
        if (!activo) {
          return;
        }
        setSinConexion(false);
        if (arrancado !== null) {
          setArranque(arrancado);
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
  }, [lleno, arranque, intervaloMs]);

  useEffect(() => {
    if (lleno) {
      return undefined;
    }
    let activo = true;

    async function consultar() {
      try {
        const nuevo = await ultimas.current.obtener();
        if (!activo) {
          return;
        }
        setSinConexion(false);
        setCirculo(nuevo);
        ultimas.current.onActualizado(nuevo);
      } catch {
        if (activo) {
          setSinConexion(true);
        }
      }
    }

    const id = setInterval(() => void consultar(), intervaloMs);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [lleno, intervaloMs]);

  async function compartir() {
    if (compartiendo) {
      return;
    }
    setCompartiendo(true);
    setAviso(null);
    setError(null);
    try {
      const resultado = await onCompartir(mensajeDeInvitacion(circulo));
      if (resultado === 'compartido') {
        setAviso('Mandaste el enlace.');
      }
      // 'cancelado': la persona cerró el cuadro a propósito, sin aviso.
    } catch {
      setError(MENSAJE_ERROR_AL_COMPARTIR);
    } finally {
      setCompartiendo(false);
    }
  }

  const lugares = lugaresDelCirculo(circulo);
  const dinero = (monto: number) => formatearMonto(monto, circulo.moneda);
  // Con el círculo ya en marcha: cuál es el turno de la persona.
  const turno = arranque === null ? null : resumenDeMiTurno(arranque.circulo, arranque.yoId);

  return (
    <SafeAreaView edges={['top']} style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        {onVolver !== undefined && (
          <Pressable
            onPress={onVolver}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            style={estilos.volver}
          >
            <Text style={estilos.volverTexto}>‹ Volver</Text>
          </Pressable>
        )}

        <View style={estilos.encabezado}>
          <Text style={estilos.etiqueta}>{arranque === null ? 'EN FORMACIÓN' : 'YA ARRANCÓ'}</Text>
          <Text style={estilos.titulo} accessibilityRole="header">
            {circulo.nombre}
          </Text>
          <Text style={estilos.subtitulo}>
            {circulo.integrantes} personas · {dinero(circulo.cuotaSemanal)} cada semana
          </Text>
        </View>

        <View style={estilos.estado}>
          <Text style={estilos.faltan}>
            {arranque === null ? textoDeFaltantesDelCirculo(circulo) : '¡Tu círculo arrancó!'}
          </Text>
          <Text style={estilos.faltanDetalle}>
            {arranque !== null
              ? 'Ya cada integrante tiene su turno.'
              : lleno
                ? 'Tu círculo está arrancando…'
                : 'Cuando entren todas, el círculo arranca.'}
          </Text>
        </View>

        {arranque !== null && turno !== null && (
          <View style={estilos.tarjeta}>
            <View style={estilos.invitar}>
              <Text style={estilos.invitarTitulo}>Tu turno: semana {turno.semana}</Text>
              <Text style={estilos.invitarTexto}>
                Recibes {dinero(boteDelCirculo(arranque.circulo))} cuando te toque. La primera cuota
                es de {dinero(arranque.circulo.cuotaSemanal)}.
              </Text>
            </View>
          </View>
        )}

        <View
          style={estilos.lugares}
          accessible
          accessibilityLabel={`${circulo.participantes.length} de ${circulo.integrantes} ya entraron`}
        >
          {lugares.map((lugar, i) =>
            lugar.tipo === 'entro' ? (
              <View
                key={lugar.participante.id}
                style={[
                  estilos.lugar,
                  lugar.participante.id === circulo.organizadorId
                    ? estilos.lugarYo
                    : estilos.lugarOcupado,
                ]}
              >
                <Text
                  style={[
                    estilos.lugarTexto,
                    lugar.participante.id === circulo.organizadorId && estilos.lugarTextoYo,
                  ]}
                >
                  {iniciales(lugar.participante.nombre)}
                </Text>
              </View>
            ) : (
              <View key={`libre-${i}`} style={[estilos.lugar, estilos.lugarLibre]} />
            ),
          )}
        </View>

        {!lleno && (
          <View style={estilos.tarjeta}>
            <View style={estilos.invitar}>
              <Text style={estilos.invitarTitulo}>Invita por WhatsApp</Text>
              <Text style={estilos.invitarTexto}>
                Manda el enlace a las personas que ya conoces. Quien lo abra puede entrar al
                círculo.
              </Text>
              <Text style={estilos.enlace} selectable accessibilityLabel={`Enlace: ${circulo.enlace}`}>
                {circulo.enlace}
              </Text>
            </View>
          </View>
        )}

        <View style={estilos.tarjeta}>
          <Text style={estilos.seccion}>YA ENTRARON</Text>
          {circulo.participantes.map((participante, i) => {
            const soyYo = participante.id === circulo.organizadorId;
            return (
              <View
                key={participante.id}
                style={[estilos.fila, i > 0 && estilos.filaConLinea]}
                accessible
                accessibilityLabel={`${soyYo ? 'Tú' : participante.nombre}, ${
                  soyYo ? 'creaste el círculo' : 'entró'
                }`}
              >
                <View style={[estilos.avatar, soyYo && estilos.lugarYo]}>
                  <Text style={[estilos.lugarTexto, soyYo && estilos.lugarTextoYo]}>
                    {iniciales(participante.nombre)}
                  </Text>
                </View>
                <View style={estilos.textos}>
                  <Text style={estilos.nombre}>{soyYo ? 'Tú' : participante.nombre}</Text>
                  <Text style={estilos.detalle}>{soyYo ? 'Creaste el círculo' : 'Entró'}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={estilos.resumen}>
          <Text style={estilos.resumenTexto}>
            Cada integrante aporta{' '}
            <Text style={estilos.negrita}>
              {dinero(circulo.cuotaSemanal)} durante {circulo.integrantes} semanas
            </Text>{' '}
            y recibe{' '}
            <Text style={estilos.negrita}>{dinero(circulo.cuotaSemanal * circulo.integrantes)}</Text>{' '}
            en su turno.
          </Text>
        </View>

        {sinConexion && (
          <Text style={estilos.sinConexion} accessibilityRole="alert">
            {lleno
              ? 'No pudimos revisar si ya arrancó. Seguimos intentando.'
              : 'No pudimos revisar quién entró. Seguimos intentando.'}
          </Text>
        )}
      </ScrollView>

      {!lleno && (
        <View style={estilos.pie}>
          {error !== null && (
            <Text style={estilos.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
          {aviso !== null && <Text style={estilos.nota}>{aviso}</Text>}
          <Pressable
            onPress={() => void compartir()}
            disabled={compartiendo}
            accessibilityRole="button"
            accessibilityState={{ disabled: compartiendo, busy: compartiendo }}
            style={({ pressed }) => [
              estilos.boton,
              compartiendo && estilos.botonInactivo,
              pressed && estilos.botonPresionado,
            ]}
          >
            <Text style={estilos.botonTexto}>
              {compartiendo ? 'Abriendo…' : 'Compartir por WhatsApp'}
            </Text>
          </Pressable>
        </View>
      )}

      {arranque !== null && (
        <View style={estilos.pie}>
          {puedeVerlo ? (
            <Pressable
              onPress={() => onVerCirculo(arranque)}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
            >
              <Text style={estilos.botonTexto}>Ver mi círculo</Text>
            </Pressable>
          ) : (
            // La app todavía muestra un solo círculo: si la persona ya está en otro,
            // este no se puede ver aquí hasta que haya una lista de círculos.
            <>
              <Text style={estilos.nota}>
                Ya estás en otro círculo. Cuando puedas ver varios, este aparecerá en «Mi círculo».
              </Text>
              <Pressable
                onPress={onVolver}
                accessibilityRole="button"
                style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
              >
                <Text style={estilos.botonTexto}>Entendido</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const TAMANO_LUGAR = 40;

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  encabezado: {
    gap: 4,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.cobalto,
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
  estado: {
    gap: 4,
  },
  faltan: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.tinta,
  },
  faltanDetalle: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textoSecundario,
  },
  lugares: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lugar: {
    width: TAMANO_LUGAR,
    height: TAMANO_LUGAR,
    borderRadius: TAMANO_LUGAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lugarYo: {
    backgroundColor: colors.cobalto,
  },
  lugarOcupado: {
    backgroundColor: colors.tarjeta,
  },
  lugarLibre: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.textoInactivo,
  },
  lugarTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textoSecundario,
  },
  lugarTextoYo: {
    color: '#FFFFFF',
  },
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  invitar: {
    paddingVertical: 16,
    gap: 6,
  },
  invitarTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  invitarTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  enlace: {
    marginTop: 4,
    fontSize: 13,
    color: colors.cobalto,
  },
  seccion: {
    paddingTop: 14,
    paddingBottom: 4,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: colors.textoSecundario,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  textos: {
    flex: 1,
    gap: 1,
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
  resumen: {
    borderRadius: 12,
    backgroundColor: colors.cobaltoSuave,
    padding: 16,
  },
  resumenTexto: {
    fontSize: 14,
    lineHeight: 21,
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
  error: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.atrasado,
  },
  nota: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
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
});
