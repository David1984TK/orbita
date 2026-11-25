import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ajustarIntegrantes,
  cuotaDeTexto,
  esBorradorValido,
  fechaDeHoy,
  formatearFecha,
  formatearMonto,
  MAX_INTEGRANTES,
  MAX_NOMBRE,
  MIN_INTEGRANTES,
  MONEDAS_DISPONIBLES,
  normalizarCuota,
  resumenDelBorrador,
} from '../domain';
import type { BorradorDeCirculo, Moneda } from '../domain';
import type { ResultadoDeCreacion } from '../servicios/circulos';
import { colors } from '../theme';

type Props = {
  /**
   * Crea el círculo. Devuelve el resultado para lo esperado (cancelar, fallar);
   * si lanza un error se trata como un fallo.
   */
  onCrear: (borrador: BorradorDeCirculo) => Promise<ResultadoDeCreacion>;
  /** Regresa sin crear nada. */
  onVolver: () => void;
  /** Solo para pruebas: por defecto es la fecha de hoy. */
  hoy?: string;
};

const MENSAJE_ERROR = 'No pudimos crear tu círculo. Revisa tu conexión e inténtalo de nuevo.';

const MONEDAS: { moneda: Moneda; texto: string }[] = [
  { moneda: 'pesos', texto: 'Pesos' },
  { moneda: 'dolares', texto: 'Dólares' },
];

/**
 * Sexta pantalla de uso diario: crear un círculo. Es la pantalla de quien
 * organiza. Cada ajuste recalcula el resumen de abajo, para que nadie arranque
 * sin entender los números.
 */
export function NuevoCirculoScreen({ onCrear, onVolver, hoy = fechaDeHoy() }: Props) {
  const [nombre, setNombre] = useState('');
  const [integrantes, setIntegrantes] = useState(10);
  const [cuotaTexto, setCuotaTexto] = useState('');
  const [moneda, setMoneda] = useState<Moneda>('pesos');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borrador: BorradorDeCirculo = {
    nombre: nombre.trim(),
    integrantes,
    cuota: cuotaDeTexto(cuotaTexto),
    moneda,
  };
  const valido = esBorradorValido(borrador);
  const puedeCrear = valido && !creando;
  const resumen = valido ? resumenDelBorrador(borrador, hoy) : null;

  async function crear() {
    if (!puedeCrear) {
      return;
    }
    setCreando(true);
    setError(null);
    try {
      const resultado = await onCrear(borrador);
      if (!resultado.ok && resultado.motivo === 'error') {
        setError(MENSAJE_ERROR);
      }
      // 'cancelada': la persona cerró el cuadro del sistema a propósito. No hay
      // nada que reprocharle, así que no se muestra ningún aviso.
    } catch {
      setError(MENSAJE_ERROR);
    } finally {
      setCreando(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={estilos.pantalla}>
      <KeyboardAvoidingView
        style={estilos.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
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
            Nuevo círculo
          </Text>

          <View style={estilos.tarjeta}>
            <View style={estilos.fila}>
              <Text style={estilos.filaTitulo}>Nombre</Text>
              <TextInput
                style={estilos.campo}
                value={nombre}
                onChangeText={(texto) => {
                  setNombre(texto.slice(0, MAX_NOMBRE));
                  setError(null);
                }}
                placeholder="Los del mercado"
                placeholderTextColor={colors.textoTenue}
                maxLength={MAX_NOMBRE}
                autoCapitalize="sentences"
                returnKeyType="done"
                editable={!creando}
                accessibilityLabel="Nombre del círculo"
              />
            </View>

            <View style={[estilos.fila, estilos.filaConLinea]}>
              <Text style={estilos.filaTitulo}>Integrantes</Text>
              <View style={estilos.contador}>
                <Pressable
                  onPress={() => setIntegrantes((n) => ajustarIntegrantes(n, -1))}
                  disabled={integrantes <= MIN_INTEGRANTES}
                  accessibilityRole="button"
                  accessibilityLabel="Menos integrantes"
                  accessibilityState={{ disabled: integrantes <= MIN_INTEGRANTES }}
                  style={[estilos.paso, integrantes <= MIN_INTEGRANTES && estilos.pasoInactivo]}
                >
                  <Text style={estilos.pasoTexto}>−</Text>
                </Pressable>
                <Text
                  style={estilos.contadorTexto}
                  accessibilityLabel={`${integrantes} integrantes`}
                >
                  {integrantes}
                </Text>
                <Pressable
                  onPress={() => setIntegrantes((n) => ajustarIntegrantes(n, 1))}
                  disabled={integrantes >= MAX_INTEGRANTES}
                  accessibilityRole="button"
                  accessibilityLabel="Más integrantes"
                  accessibilityState={{ disabled: integrantes >= MAX_INTEGRANTES }}
                  style={[estilos.paso, integrantes >= MAX_INTEGRANTES && estilos.pasoInactivo]}
                >
                  <Text style={estilos.pasoTexto}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={[estilos.fila, estilos.filaConLinea]}>
              <Text style={estilos.filaTitulo}>Cuota</Text>
              <TextInput
                style={estilos.campo}
                // El "$" va dentro del campo para que quede pegado al número; al
                // escribir se descarta, porque solo se guardan los dígitos.
                value={cuotaTexto === '' ? '' : `$${cuotaTexto}`}
                onChangeText={(texto) => {
                  setCuotaTexto(normalizarCuota(texto));
                  setError(null);
                }}
                placeholder="$600"
                placeholderTextColor={colors.textoTenue}
                keyboardType="number-pad"
                editable={!creando}
                accessibilityLabel="Cuota semanal"
              />
            </View>

            <View style={[estilos.fila, estilos.filaConLinea]}>
              <Text style={estilos.filaTitulo}>Cada</Text>
              <Text style={estilos.fijo}>Semana</Text>
            </View>
          </View>

          <View style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>EN QUÉ SE AHORRA</Text>
            <View style={estilos.segmentos} accessibilityRole="radiogroup">
              {MONEDAS.map((opcion) => {
                const disponible = MONEDAS_DISPONIBLES.includes(opcion.moneda);
                const elegida = opcion.moneda === moneda;
                return (
                  <Pressable
                    key={opcion.moneda}
                    onPress={() => setMoneda(opcion.moneda)}
                    disabled={!disponible}
                    accessibilityRole="radio"
                    accessibilityLabel={disponible ? opcion.texto : `${opcion.texto}, próximamente`}
                    accessibilityState={{ selected: elegida, disabled: !disponible }}
                    style={[
                      estilos.segmento,
                      elegida && estilos.segmentoElegido,
                      !disponible && estilos.segmentoInactivo,
                    ]}
                  >
                    <Text style={[estilos.segmentoTexto, elegida && estilos.segmentoTextoElegido]}>
                      {opcion.texto}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={estilos.ayuda}>
              Los círculos en dólares estarán disponibles pronto: ahí el monto sube y baja con el
              tipo de cambio.
            </Text>
          </View>

          <View style={estilos.aviso}>
            {resumen !== null ? (
              <Text style={estilos.avisoTexto}>
                Cada integrante aporta{' '}
                <Text style={estilos.negrita}>
                  {formatearMonto(resumen.cuota, moneda)} durante {resumen.semanas} semanas
                </Text>{' '}
                y recibe <Text style={estilos.negrita}>{formatearMonto(resumen.bote, moneda)}</Text> en
                su turno. Si arranca hoy, el círculo termina el {formatearFecha(resumen.termina)}.
              </Text>
            ) : (
              <Text style={estilos.avisoTexto}>
                Ponle nombre y escribe la cuota para ver cómo queda tu círculo.
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={estilos.pie}>
          {error !== null && (
            <Text style={estilos.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
          <Pressable
            onPress={() => void crear()}
            disabled={!puedeCrear}
            accessibilityRole="button"
            accessibilityState={{ disabled: !puedeCrear, busy: creando }}
            style={({ pressed }) => [
              estilos.boton,
              !puedeCrear && estilos.botonInactivo,
              pressed && estilos.botonPresionado,
            ]}
          >
            <Text style={estilos.botonTexto}>{creando ? 'Creando…' : 'Crear e invitar'}</Text>
          </Pressable>
          <Text style={estilos.nota}>Se comparte por WhatsApp con un enlace</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  teclado: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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
  tarjeta: {
    borderRadius: 12,
    backgroundColor: colors.tarjeta,
    paddingHorizontal: 16,
  },
  fila: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filaConLinea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separador,
  },
  filaTitulo: {
    fontSize: 16,
    color: colors.tinta,
  },
  campo: {
    flex: 1,
    paddingVertical: 12,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '600',
    color: colors.tinta,
  },
  fijo: {
    fontSize: 16,
    color: colors.textoSecundario,
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.fondo,
  },
  paso: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoInactivo: {
    opacity: 0.3,
  },
  pasoTexto: {
    fontSize: 20,
    color: colors.tinta,
  },
  contadorTexto: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
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
  segmentos: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    backgroundColor: colors.linea,
  },
  segmento: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentoElegido: {
    backgroundColor: colors.tarjeta,
  },
  segmentoInactivo: {
    opacity: 0.4,
  },
  segmentoTexto: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textoSecundario,
  },
  segmentoTextoElegido: {
    color: colors.tinta,
    fontWeight: '600',
  },
  ayuda: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textoSecundario,
    paddingHorizontal: 4,
  },
  aviso: {
    borderRadius: 12,
    backgroundColor: colors.cobaltoSuave,
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
