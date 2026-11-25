import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  boteDelCirculo,
  desgloseDeAporte,
  desgloseDeRetiro,
  formatearMonto,
  PORCENTAJE_COMISION_ORBITA,
} from '../domain';
import type { MiCirculo } from '../domain';
import type { ResultadoDeRetiro } from '../servicios/retiros';
import { colors } from '../theme';

type Props = {
  miCirculo: MiCirculo;
  /**
   * Confirma el retiro (pide Face ID o huella y lo manda). Devuelve el
   * resultado para lo esperado; si lanza un error se trata como un fallo.
   */
  onConfirmar: (recibes: number) => Promise<ResultadoDeRetiro>;
  /** Regresa a "Mi círculo" sin retirar. */
  onVolver: () => void;
};

const MENSAJE_ERROR = 'No pudimos completar tu retiro. Revisa tu conexión e inténtalo de nuevo.';

/** Flecha que baja hacia una bandeja: el dinero que llega. */
function IconoRetiro() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4v10m0 0-4-4m4 4 4-4M5 19h14"
        stroke={colors.cobalto}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Cuarta pantalla de uso diario: tu turno. El momento que la persona esperó
 * meses. Se celebra sin gritar, y el descuento de las comisiones queda a la
 * vista antes de confirmar.
 */
export function RetirarScreen({ miCirculo, onConfirmar, onVolver }: Props) {
  const { circulo, yoId } = miCirculo;
  const moneda = circulo.moneda;
  const turno = circulo.integrantes.find((i) => i.id === yoId)?.turno ?? circulo.semanaActual;
  const desglose = desgloseDeRetiro(boteDelCirculo(circulo), moneda);
  const cuotaConComision = desgloseDeAporte(circulo.cuotaSemanal).total;
  const semanasPorAportar = circulo.integrantes.length - circulo.semanaActual;

  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dinero = (monto: number) => formatearMonto(monto, moneda, { centavos: true });

  async function confirmar() {
    if (confirmando) {
      return;
    }
    setConfirmando(true);
    setError(null);
    try {
      const resultado = await onConfirmar(desglose.recibes);
      if (!resultado.ok && resultado.motivo === 'error') {
        setError(MENSAJE_ERROR);
      }
      // 'cancelada': la persona cerró el cuadro del sistema a propósito. No hay
      // nada que reprocharle, así que no se muestra ningún aviso.
    } catch {
      setError(MENSAJE_ERROR);
    } finally {
      setConfirmando(false);
    }
  }

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

        <View style={estilos.celebracion}>
          <View
            style={estilos.circulo}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <IconoRetiro />
          </View>
          <Text style={estilos.turno} accessibilityRole="header">
            Es tu turno, semana {turno}
          </Text>
          <Text style={estilos.monto}>{formatearMonto(desglose.recibes, moneda)}</Text>
          <Text style={estilos.listos}>Listos para retirar</Text>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.fila}>
            <Text style={estilos.filaTitulo}>Bote del círculo</Text>
            <Text style={estilos.filaMonto}>{dinero(desglose.bote)}</Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <View style={estilos.textos}>
              <Text style={estilos.filaTitulo}>Comisión Órbita</Text>
              <Text style={estilos.filaDetalle}>{PORCENTAJE_COMISION_ORBITA}% sobre lo que recibes</Text>
            </View>
            <Text style={estilos.filaMontoTenue}>{dinero(-desglose.comisionOrbita)}</Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.filaTitulo}>Comisión de retiro</Text>
            <Text style={estilos.filaMontoTenue}>{dinero(-desglose.comisionDeRetiro)}</Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.filaTotal}>Recibes</Text>
            <Text style={estilos.filaTotal}>{dinero(desglose.recibes)}</Text>
          </View>
        </View>

        <View style={estilos.aviso}>
          <Text style={estilos.avisoTexto}>
            {semanasPorAportar > 0 ? (
              <>
                Sigues aportando{' '}
                <Text style={estilos.avisoNegrita}>{formatearMonto(cuotaConComision, moneda)}</Text>{' '}
                por semana hasta que termine el círculo, en la semana {circulo.integrantes.length}.
              </>
            ) : (
              'Esta es la última semana del círculo.'
            )}
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
          onPress={() => void confirmar()}
          disabled={confirmando}
          accessibilityRole="button"
          accessibilityState={{ disabled: confirmando, busy: confirmando }}
          style={({ pressed }) => [
            estilos.boton,
            confirmando && estilos.botonInactivo,
            pressed && estilos.botonPresionado,
          ]}
        >
          <Text style={estilos.botonTexto}>{confirmando ? 'Retirando…' : 'Retirar mi dinero'}</Text>
        </Pressable>
        <Text style={estilos.nota}>Llega en minutos a tu cuenta o en efectivo</Text>
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
    paddingBottom: 16,
    gap: 24,
  },
  volver: {
    alignSelf: 'flex-start',
  },
  volverTexto: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.cobalto,
  },
  celebracion: {
    alignItems: 'center',
    gap: 6,
  },
  circulo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cobaltoSuave,
    marginBottom: 10,
  },
  turno: {
    fontSize: 15,
    color: colors.textoSecundario,
  },
  monto: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.cobalto,
  },
  listos: {
    fontSize: 15,
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
    color: colors.tinta,
  },
  filaDetalle: {
    fontSize: 13,
    color: colors.textoSecundario,
  },
  filaMonto: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  filaMontoTenue: {
    fontSize: 16,
    color: colors.textoSecundario,
  },
  filaTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.tinta,
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
  avisoNegrita: {
    fontWeight: '700',
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
  nota: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSecundario,
  },
});
