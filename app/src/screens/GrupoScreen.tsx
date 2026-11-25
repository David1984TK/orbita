import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  etiquetaDeEstado,
  iniciales,
  integrantesOrdenados,
  quienCobra,
  resumenDelGrupo,
  textoDelResumen,
} from '../domain';
import type { Integrante, MiCirculo, TonoDeEstado } from '../domain';
import { colors } from '../theme';

type Props = {
  miCirculo: MiCirculo;
  /** La persona quiere crear otro círculo, además de este. */
  onCrearOtro: () => void;
};

type TonoDeAvatar = 'yo' | 'cobra' | 'normal';

function Avatar({ letras, tono }: { letras: string; tono: TonoDeAvatar }) {
  return (
    <View
      style={[estilos.avatar, AVATAR[tono].fondo]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Text style={[estilos.iniciales, AVATAR[tono].texto]}>{letras}</Text>
    </View>
  );
}

function Etiqueta({ texto, tono }: { texto: string; tono: TonoDeEstado | 'cobrando' }) {
  return (
    <View style={[estilos.etiqueta, ETIQUETA[tono].fondo]}>
      <Text style={[estilos.etiquetaTexto, ETIQUETA[tono].texto]}>{texto}</Text>
    </View>
  );
}

function Fila({
  nombre,
  letras,
  detalle,
  avatar,
  etiqueta,
  conLinea,
}: {
  /** Lo que se lee en la fila: "Tú" para la persona, el nombre para las demás. */
  nombre: string;
  /** Las iniciales del nombre real, aunque en la fila diga "Tú". */
  letras: string;
  detalle: string;
  avatar: TonoDeAvatar;
  etiqueta: { texto: string; tono: TonoDeEstado | 'cobrando' };
  conLinea: boolean;
}) {
  return (
    <View
      style={[estilos.fila, conLinea && estilos.filaConLinea]}
      accessible
      accessibilityLabel={`${nombre}, ${detalle}, ${etiqueta.texto}`}
    >
      <Avatar letras={letras} tono={avatar} />
      <View style={estilos.textos}>
        <Text style={estilos.nombre}>{nombre}</Text>
        <Text style={estilos.detalle}>{detalle}</Text>
      </View>
      <Etiqueta texto={etiqueta.texto} tono={etiqueta.tono} />
    </View>
  );
}

/**
 * Tercera pantalla de uso diario: el grupo. Quién pagó y quién no, sin
 * ambigüedad: es la vigilancia mutua que el cuaderno de la tanda tiene
 * desordenada.
 */
export function GrupoScreen({ miCirculo, onCrearOtro }: Props) {
  const { circulo, yoId } = miCirculo;
  const total = circulo.integrantes.length;
  const cobra = quienCobra(circulo);
  const lista = integrantesOrdenados(circulo, yoId);
  const resumen = textoDelResumen(resumenDelGrupo(circulo));

  const detalleDeTurno = (integrante: Integrante) => `Turno ${integrante.turno}`;

  return (
    <SafeAreaView edges={['top']} style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo} accessibilityRole="header">
            El grupo
          </Text>
          <Text style={estilos.subtitulo}>
            Semana {circulo.semanaActual} · {resumen}
          </Text>
        </View>

        {cobra !== undefined && (
          <View style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>COBRA ESTA SEMANA</Text>
            <View style={estilos.tarjeta}>
              <Fila
                nombre={cobra.id === yoId ? 'Tú' : cobra.nombre}
                letras={iniciales(cobra.nombre)}
                detalle={`Turno ${cobra.turno} de ${total}`}
                avatar={cobra.id === yoId ? 'yo' : 'cobra'}
                etiqueta={{ texto: 'Cobrando', tono: 'cobrando' }}
                conLinea={false}
              />
            </View>
          </View>
        )}

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>{`LOS ${total} INTEGRANTES`}</Text>
          <View style={estilos.tarjeta}>
            {lista.map((integrante, i) => {
              const soyYo = integrante.id === yoId;
              return (
                <Fila
                  key={integrante.id}
                  nombre={soyYo ? 'Tú' : integrante.nombre}
                  letras={iniciales(integrante.nombre)}
                  detalle={detalleDeTurno(integrante)}
                  avatar={soyYo ? 'yo' : 'normal'}
                  etiqueta={etiquetaDeEstado(integrante)}
                  conLinea={i > 0}
                />
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={onCrearOtro}
          accessibilityRole="button"
          style={({ pressed }) => [estilos.botonSecundario, pressed && estilos.botonPresionado]}
        >
          <Text style={estilos.botonSecundarioTexto}>Crear otro círculo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR: Record<TonoDeAvatar, { fondo: object; texto: object }> = {
  yo: { fondo: { backgroundColor: colors.cobalto }, texto: { color: '#FFFFFF' } },
  cobra: { fondo: { backgroundColor: colors.alDiaSuave }, texto: { color: colors.alDia } },
  normal: { fondo: { backgroundColor: colors.fondo }, texto: { color: colors.textoSecundario } },
};

const ETIQUETA: Record<TonoDeEstado | 'cobrando', { fondo: object; texto: object }> = {
  cobrando: { fondo: { backgroundColor: colors.alDiaSuave }, texto: { color: colors.alDia } },
  alDia: { fondo: { backgroundColor: colors.alDiaSuave }, texto: { color: colors.alDia } },
  pendiente: { fondo: { backgroundColor: colors.fondo }, texto: { color: colors.textoSecundario } },
  atrasado: { fondo: { backgroundColor: colors.atrasadoSuave }, texto: { color: colors.atrasado } },
};

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
  botonSecundario: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.cobalto,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonSecundarioTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.cobalto,
  },
  etiquetaTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
});
