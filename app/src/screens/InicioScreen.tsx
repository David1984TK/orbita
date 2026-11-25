import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PilaDeAvisos } from '../components/PilaDeAvisos';
import type { Aviso } from '../components/PilaDeAvisos';
import { Rueda } from '../components/Rueda';
import {
  boteDelCirculo,
  fechaDeSemana,
  fechaLocalDe,
  formatearFecha,
  formatearFechaConDia,
  formatearMonto,
  puedeRetirar,
  resumenDeAportes,
  resumenDeMiTurno,
  retiroEnEspera,
  segmentosDeLaRueda,
  textoDeFaltantesDelCirculo,
} from '../domain';
import type { CirculoEnFormacion, MiCirculo, ResumenDeMiTurno } from '../domain';
import type { SolicitudDeRecuperacion } from '../servicios/recuperacion';
import { colors } from '../theme';

type Props = {
  miCirculo: MiCirculo;
  /** La persona quiere aportar su cuota de esta semana. */
  onAportar: () => void;
  /** La persona quiere retirar el bote de su turno. */
  onRetirar: () => void;
  /** Solo para pruebas: por defecto es el momento actual. */
  ahora?: Date;
  /** Alguien del círculo perdió su teléfono y espera que la persona lo confirme. */
  solicitud?: SolicitudDeRecuperacion | null;
  /** La persona quiere ver la solicitud para responderla. */
  onVerSolicitud?: () => void;
  /** Círculos que la persona creó y todavía se están llenando. */
  enFormacion?: CirculoEnFormacion[];
  /** La persona quiere ver cómo va uno de esos círculos. */
  onVerFormacion?: (id: string) => void;
};

function textoDeMiTurno(resumen: ResumenDeMiTurno, total: number) {
  switch (resumen.tipo) {
    case 'faltan': {
      const semanas =
        resumen.semanasRestantes === 1 ? 'Falta 1 semana' : `Faltan ${resumen.semanasRestantes} semanas`;
      return {
        titulo: `Te toca en la semana ${resumen.semana}`,
        detalle: `${semanas} · ${formatearFecha(resumen.fecha)}`,
      };
    }
    case 'estaSemana':
      return {
        titulo: 'Te toca esta semana',
        detalle: `Cobras el ${formatearFechaConDia(resumen.fecha)}`,
      };
    case 'yaCobraste':
      return {
        titulo: `Ya cobraste en la semana ${resumen.semana}`,
        detalle: `Sigues aportando hasta la semana ${total}`,
      };
  }
}

/**
 * Pantalla principal: "Mi círculo". Es la que se abre cien veces al día, así
 * que contesta de un vistazo en qué semana vamos y cuándo me toca.
 */
export function InicioScreen({
  miCirculo,
  onAportar,
  onRetirar,
  ahora = new Date(),
  solicitud = null,
  onVerSolicitud,
  enFormacion = [],
  onVerFormacion,
}: Props) {
  const { circulo, yoId } = miCirculo;
  const total = circulo.integrantes.length;
  const miTurno = textoDeMiTurno(resumenDeMiTurno(circulo, yoId), total);
  const aportes = resumenDeAportes(circulo, yoId);
  const hayOtraSemana = circulo.semanaActual < total;
  const retirar = puedeRetirar(circulo, yoId, ahora);
  const espera = retiroEnEspera(circulo, yoId, ahora);
  const siguiente = hayOtraSemana
    ? `La siguiente vence el ${formatearFechaConDia(fechaDeSemana(circulo, circulo.semanaActual + 1))}`
    : 'Fue la última cuota del círculo';

  // Primero lo que no puede esperar (alguien que perdió su teléfono) y luego los
  // círculos que se están llenando.
  const avisos: Aviso[] = [
    ...(solicitud === null
      ? []
      : [
          {
            id: 'solicitud',
            etiqueta: `${solicitud.nombre} perdió su teléfono y pide volver a entrar. Toca para responder.`,
            negrita: solicitud.nombre,
            despues: ' perdió su teléfono y pide volver a entrar. Toca para responder.',
            onPress: () => onVerSolicitud?.(),
          },
        ]),
    ...enFormacion.map((formando) => ({
      id: `formando-${formando.id}`,
      etiqueta: `Estás formando ${formando.nombre}. ${textoDeFaltantesDelCirculo(formando)}.`,
      antes: 'Estás formando ',
      negrita: `«${formando.nombre}»`,
      despues: ` · ${textoDeFaltantesDelCirculo(formando)}`,
      onPress: () => onVerFormacion?.(formando.id),
    })),
  ];

  return (
    <SafeAreaView edges={['top']} style={estilos.pantalla}>
      <View style={estilos.raiz}>
        <ScrollView contentContainerStyle={estilos.contenido}>
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} accessibilityRole="header">
              {circulo.nombre}
            </Text>
            <Text style={estilos.subtitulo}>
              {total} personas · {formatearMonto(circulo.cuotaSemanal, circulo.moneda)} cada semana
            </Text>
          </View>

          <Rueda
            segmentos={segmentosDeLaRueda(circulo, yoId)}
            semanaActual={circulo.semanaActual}
          />

          <View style={estilos.tarjeta}>
            <View style={estilos.fila}>
              <View style={estilos.textos}>
                <Text style={estilos.filaTitulo}>{miTurno.titulo}</Text>
                <Text style={estilos.filaDetalle}>{miTurno.detalle}</Text>
              </View>
              <Text style={estilos.monto}>{formatearMonto(boteDelCirculo(circulo), circulo.moneda)}</Text>
            </View>
            <View style={[estilos.fila, estilos.filaConLinea]}>
              <View style={estilos.textos}>
                <Text style={estilos.filaTitulo}>Llevas aportado</Text>
                <Text style={estilos.filaDetalle}>
                  {aportes.cuotas} de {aportes.totalDeCuotas} cuotas,{' '}
                  {aportes.atrasada ? 'con un pago atrasado' : 'todas a tiempo'}
                </Text>
              </View>
              <Text style={estilos.monto}>{formatearMonto(aportes.monto, circulo.moneda)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={estilos.pie}>
          {retirar || espera !== null ? (
            // Es tu turno: retirar es lo principal. Si aún falta la cuota de esta
            // semana, aportar queda a la mano como acción secundaria. Si estás en
            // la espera de seguridad de después de recuperar el acceso, el botón
            // se apaga y se dice hasta cuándo.
            <>
              {espera !== null ? (
                <View
                  style={[estilos.boton, estilos.botonInactivo]}
                  accessible
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                  accessibilityLabel="Retirar mi dinero"
                >
                  <Text style={estilos.botonTexto}>Retirar mi dinero</Text>
                </View>
              ) : (
                <Pressable
                  onPress={onRetirar}
                  accessibilityRole="button"
                  style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
                >
                  <Text style={estilos.botonTexto}>Retirar mi dinero</Text>
                </Pressable>
              )}
              {!aportes.alDia && (
                <Pressable
                  onPress={onAportar}
                  accessibilityRole="button"
                  style={({ pressed }) => [estilos.botonSecundario, pressed && estilos.botonPresionado]}
                >
                  <Text style={estilos.botonSecundarioTexto}>Aportar mi cuota</Text>
                </Pressable>
              )}
              {espera !== null && (
                <Text style={estilos.nota}>
                  Por seguridad podrás retirar a partir del {formatearFechaConDia(fechaLocalDe(espera))}
                </Text>
              )}
              <Text style={[estilos.nota, aportes.atrasada && estilos.notaAtrasada]}>
                {aportes.alDia
                  ? `Ya aportaste esta semana · ${siguiente}`
                  : `${aportes.atrasada ? 'Venció' : 'Vence'} el ${formatearFechaConDia(aportes.vence)}`}
              </Text>
            </>
          ) : aportes.alDia ? (
            <>
              <View
                style={[estilos.boton, estilos.botonInactivo]}
                accessible
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                accessibilityLabel="Ya aportaste esta semana"
              >
                <Text style={estilos.botonTexto}>Ya aportaste esta semana</Text>
              </View>
              <Text style={estilos.nota}>{siguiente}</Text>
            </>
          ) : (
            <>
              <Pressable
                onPress={onAportar}
                accessibilityRole="button"
                style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
              >
                <Text style={estilos.botonTexto}>Aportar mi cuota</Text>
              </Pressable>
              <Text style={[estilos.nota, aportes.atrasada && estilos.notaAtrasada]}>
                {aportes.atrasada ? 'Venció' : 'Vence'} el {formatearFechaConDia(aportes.vence)}
              </Text>
            </>
          )}
        </View>
        {/* Los avisos flotan encima de toda la pantalla, en pila, sin empujar nada hacia
            abajo: pueden tapar el nombre del círculo. Si la notificación se pasó, aquí
            siguen. Van al final para quedar por encima de todo. */}
        <PilaDeAvisos avisos={avisos} />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  // Contenedor de toda la pantalla: la pila de avisos se posiciona contra él.
  raiz: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
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
  textos: {
    flex: 1,
    gap: 2,
  },
  filaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  filaDetalle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
  monto: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
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
    backgroundColor: colors.cobalto,
  },
  botonInactivo: {
    opacity: 0.4,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonSecundario: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.cobalto,
  },
  botonSecundarioTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.cobalto,
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
  notaAtrasada: {
    color: colors.atrasado,
    fontWeight: '500',
  },
});
