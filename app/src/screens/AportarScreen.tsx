import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconoBiometria } from '../components/IconoBiometria';
import {
  desgloseDeAporte,
  formatearMonto,
  PORCENTAJE_DE_COMISION,
  resumenDeMiTurno,
} from '../domain';
import type { MiCirculo } from '../domain';
import { plataformaActual } from '../plataforma';
import type { Plataforma } from '../plataforma';
import type { ResultadoDeAporte } from '../servicios/aportes';
import { colors } from '../theme';

type Props = {
  miCirculo: MiCirculo;
  /**
   * Confirma el aporte (pide Face ID o huella y lo manda). Devuelve el
   * resultado para lo esperado; si lanza un error se trata como un fallo.
   */
  onConfirmar: (total: number) => Promise<ResultadoDeAporte>;
  /** Regresa a "Mi círculo" sin aportar. */
  onVolver: () => void;
  /** Solo para pruebas: por defecto sale de la plataforma real. */
  plataforma?: Plataforma;
};

const BOTON: Record<Plataforma, { texto: string; icono: 'rostro' | 'huella' }> = {
  ios: { texto: 'Confirmar con Face ID', icono: 'rostro' },
  android: { texto: 'Confirmar con mi huella', icono: 'huella' },
};

const MENSAJE_ERROR = 'No pudimos completar tu aporte. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Segunda pantalla de uso diario: aportar la cuota de la semana.
 *
 * La comisión se ve antes de pagar, desglosada, nunca después como sorpresa.
 */
export function AportarScreen({
  miCirculo,
  onConfirmar,
  onVolver,
  plataforma = plataformaActual(),
}: Props) {
  const { circulo, yoId } = miCirculo;
  const total = circulo.integrantes.length;
  const desglose = desgloseDeAporte(circulo.cuotaSemanal);
  const miTurno = resumenDeMiTurno(circulo, yoId);
  const boton = BOTON[plataforma];

  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dinero = (monto: number) => formatearMonto(monto, circulo.moneda, { centavos: true });

  // El dinero lo guarda el contrato y se libera en el orden pactado. Si te toca
  // más adelante se dice cuándo; si no, solo se dice lo que siempre es cierto.
  const garantia =
    miTurno.tipo === 'faltan'
      ? `Tu aporte queda guardado en el círculo hasta la semana ${miTurno.semana}, cuando te toque cobrar. Nadie puede sacarlo antes.`
      : 'Tu aporte queda guardado en el círculo y se libera en el orden pactado. Nadie puede sacarlo antes.';

  async function confirmar() {
    if (confirmando) {
      return;
    }
    setConfirmando(true);
    setError(null);
    try {
      const resultado = await onConfirmar(desglose.total);
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

        <View style={estilos.encabezado}>
          <Text style={estilos.semana}>
            Semana {circulo.semanaActual} de {total}
          </Text>
          <Text style={estilos.titulo} accessibilityRole="header">
            Aportar
          </Text>
        </View>

        <View style={estilos.total}>
          <Text style={estilos.totalMonto} accessibilityLabel={`Total ${formatearMonto(desglose.total, circulo.moneda)}`}>
            {formatearMonto(desglose.total, circulo.moneda)}
          </Text>
          <Text style={estilos.totalNota}>Se descuenta de tu cuenta</Text>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.fila}>
            <Text style={estilos.filaTitulo}>Va a tu círculo</Text>
            <Text style={estilos.filaMonto}>{dinero(desglose.aCirculo)}</Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <View style={estilos.textos}>
              <Text style={estilos.filaTitulo}>Comisión de depósito</Text>
              <Text style={estilos.filaDetalle}>{PORCENTAJE_DE_COMISION}%</Text>
            </View>
            <Text style={estilos.filaMontoTenue}>{dinero(desglose.comision)}</Text>
          </View>
          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.filaTotal}>Total</Text>
            <Text style={estilos.filaTotal}>{dinero(desglose.total)}</Text>
          </View>
        </View>

        <View style={estilos.aviso}>
          <Text style={estilos.avisoTexto}>{garantia}</Text>
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
          {!confirmando && <IconoBiometria tipo={boton.icono} tamano={22} color="#FFFFFF" />}
          <Text style={estilos.botonTexto}>{confirmando ? 'Confirmando…' : boton.texto}</Text>
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
  encabezado: {
    gap: 2,
  },
  semana: {
    fontSize: 15,
    color: colors.textoSecundario,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.tinta,
  },
  total: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  totalMonto: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.tinta,
  },
  totalNota: {
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
    backgroundColor: colors.tarjeta,
    padding: 16,
  },
  avisoTexto: {
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
  boton: {
    minHeight: 52,
    flexDirection: 'row',
    gap: 8,
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
