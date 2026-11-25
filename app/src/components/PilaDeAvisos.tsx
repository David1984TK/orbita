import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type Aviso = {
  id: string;
  /** Lo que lee un lector de pantalla para esta tarjeta. */
  etiqueta: string;
  /** El texto de la tarjeta se arma como `antes` + `negrita` + `despues`. */
  antes?: string;
  negrita: string;
  despues: string;
  /** La persona tocó esta tarjeta. */
  onPress: () => void;
};

type Props = {
  avisos: Aviso[];
  /** Cuánto dura la pila a la vista antes de quitarse sola, en milisegundos. */
  duracionMs?: number;
  /**
   * Los avisos que ya tuvieron su tiempo a la vista. Esos no vuelven a salir
   * solos (aunque la pantalla se cierre y se abra); solo queda el distintivo.
   */
  mostrados?: string[];
  /** La pila terminó su tiempo (o la persona tocó un aviso): estos ya se mostraron. */
  onMostrados?: (ids: string[]) => void;
};

// Seis segundos a la vista.
const DURACION_POR_DEFECTO = 6000;

// Cuánto se asoma cada tarjeta que va detrás, y cuánto se encoge a cada lado.
const ASOMO = 10;
const ENCOGE = 12;
// Se ven como mucho tres tarjetas: la de enfrente y dos detrás.
const MAX_CAPAS = 3;
// Las tarjetas son opacas porque flotan sobre el contenido. Las de atrás van un
// poco más oscuras para que se note la profundidad.
const COLOR_DE_CAPA = [colors.avisoSolido, '#C9CEEC', '#B9BFE3'];

function Tarjeta({ aviso }: { aviso: Aviso }) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.texto}>
        {aviso.antes}
        <Text style={estilos.negrita}>{aviso.negrita}</Text>
        {aviso.despues}
      </Text>
      <Text style={estilos.flecha}>›</Text>
    </View>
  );
}

/**
 * Los avisos de la persona, en pila como las notificaciones de iOS: la tarjeta de
 * enfrente y, detrás, el borde de las demás. Flota sobre el contenido (se
 * posiciona encima, sin empujarlo hacia abajo), así que puede tapar lo que hay
 * debajo, como el nombre del círculo.
 *
 * Con un solo aviso es una tarjeta que se toca y ya. Con varios, tocar la pila la
 * abre para ver todas las tarjetas; tocar una la abre, y tocar afuera o "Mostrar
 * menos" la vuelve a cerrar.
 *
 * Los avisos duran 6 segundos a la vista y se quitan solos. Como son pendientes
 * reales (alguien espera una respuesta), cuando se quitan queda un distintivo
 * ("2 avisos") que los vuelve a sacar por otros 6 segundos. Mientras la pila está
 * abierta no se quita, para no quitársela a quien la está leyendo. Si llega un
 * aviso nuevo, la pila vuelve a salir.
 *
 * Hay que ponerla dentro de un contenedor con `position: relative` (cualquier
 * vista, el contenido de un ScrollView o una pantalla): se pega a su borde de
 * arriba.
 */
export function PilaDeAvisos({
  avisos,
  duracionMs = DURACION_POR_DEFECTO,
  mostrados = [],
  onMostrados,
}: Props) {
  const [abierta, setAbierta] = useState(false);
  const ids = avisos.map((aviso) => aviso.id);
  // Los avisos se reconocen por su identificador: que cambie el texto de uno (por
  // ejemplo, "Faltan 7" por "Faltan 6") no cuenta como un aviso nuevo.
  const firma = ids.join('|');
  const hayNuevos = avisos.some((aviso) => !mostrados.includes(aviso.id));
  const [visible, setVisible] = useState(hayNuevos);
  const desplegada = abierta && avisos.length >= 2;

  // Se guarda la última función para que el temporizador no se reinicie si el
  // padre pasa una nueva en cada dibujo.
  const alMostrar = useRef(onMostrados);
  alMostrar.current = onMostrados;

  // Si llega un aviso que todavía no se había mostrado, la pila vuelve a salir.
  useEffect(() => {
    if (hayNuevos) {
      setVisible(true);
    }
  }, [hayNuevos, firma]);

  // La pila se quita sola. Mientras está abierta, no.
  useEffect(() => {
    if (!visible || desplegada || avisos.length === 0) {
      return undefined;
    }
    const id = setTimeout(() => {
      setVisible(false);
      alMostrar.current?.(ids);
    }, duracionMs);
    return () => clearTimeout(id);
    // `ids` cambia de identidad en cada dibujo; `firma` es lo que importa.
  }, [visible, desplegada, firma, duracionMs]);

  if (avisos.length === 0) {
    return null;
  }

  // Ya tuvo su tiempo: queda solo el distintivo, para volver a verlos.
  if (!visible) {
    const cuantos = avisos.length === 1 ? '1 aviso' : `${avisos.length} avisos`;
    return (
      <View style={estilos.distintivoRaiz} pointerEvents="box-none">
        <Pressable
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Ver ${cuantos}`}
          hitSlop={8}
          style={estilos.distintivo}
        >
          <Text style={estilos.distintivoTexto}>{cuantos}</Text>
        </Pressable>
      </View>
    );
  }

  if (avisos.length === 1) {
    const [unico] = avisos;
    return (
      <View style={estilos.raiz} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            onMostrados?.(ids);
            unico.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={unico.etiqueta}
          style={({ pressed }) => pressed && estilos.presionada}
        >
          <Tarjeta aviso={unico} />
        </Pressable>
      </View>
    );
  }

  const capas = Math.min(avisos.length, MAX_CAPAS);

  if (!desplegada) {
    return (
      <View style={estilos.raiz} pointerEvents="box-none">
        <Pressable
          onPress={() => setAbierta(true)}
          accessibilityRole="button"
          accessibilityLabel={`${avisos.length} avisos. Toca para ver todos.`}
          // Deja sitio abajo para los bordes de las tarjetas que van detrás.
          style={{ paddingBottom: (capas - 1) * ASOMO }}
        >
          {Array.from({ length: capas - 1 }, (_, k) => capas - 1 - k).map((i) => (
            // De la más lejana a la más cercana, para que cada una tape a la de atrás.
            <View
              key={i}
              pointerEvents="none"
              style={[
                estilos.capa,
                {
                  top: i * ASOMO,
                  bottom: (capas - 1 - i) * ASOMO,
                  left: i * ENCOGE,
                  right: i * ENCOGE,
                  backgroundColor: COLOR_DE_CAPA[i],
                  zIndex: MAX_CAPAS - i,
                },
              ]}
            />
          ))}
          <View style={estilos.frente}>
            <Tarjeta aviso={avisos[0]} />
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      {/* Tocar afuera cierra la pila. */}
      <Pressable
        onPress={() => setAbierta(false)}
        accessibilityRole="button"
        accessibilityLabel="Cerrar los avisos"
        style={estilos.fondo}
      />
      <View style={estilos.raiz} pointerEvents="box-none">
        <View style={estilos.lista}>
          <Pressable
            onPress={() => setAbierta(false)}
            accessibilityRole="button"
            hitSlop={8}
            style={estilos.menos}
          >
            <Text style={estilos.menosTexto}>Mostrar menos</Text>
          </Pressable>
          {avisos.map((aviso) => (
            <Pressable
              key={aviso.id}
              onPress={() => {
                setAbierta(false);
                onMostrados?.(ids);
                aviso.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={aviso.etiqueta}
              style={({ pressed }) => pressed && estilos.presionada}
            >
              <Tarjeta aviso={aviso} />
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}

const SOMBRA = {
  shadowColor: '#000000',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
} as const;

const estilos = StyleSheet.create({
  // Pegada al borde de arriba de su contenedor y por encima de todo lo demás.
  raiz: {
    position: 'absolute',
    top: 8,
    left: 20,
    right: 20,
    zIndex: 20,
    elevation: 20,
  },
  // El distintivo se pega arriba a la derecha, donde no estorba al título.
  distintivoRaiz: {
    position: 'absolute',
    top: 8,
    right: 20,
    zIndex: 20,
    elevation: 20,
  },
  distintivo: {
    borderRadius: 12,
    backgroundColor: colors.avisoSolido,
    paddingVertical: 4,
    paddingHorizontal: 12,
    ...SOMBRA,
  },
  distintivoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.cobalto,
  },
  fondo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 19,
    elevation: 19,
    backgroundColor: 'rgba(21, 23, 30, 0.18)',
  },
  capa: {
    position: 'absolute',
    borderRadius: 14,
    ...SOMBRA,
  },
  frente: {
    zIndex: MAX_CAPAS + 1,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.avisoSolido,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...SOMBRA,
  },
  presionada: {
    opacity: 0.85,
  },
  texto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.tinta,
  },
  negrita: {
    fontWeight: '700',
  },
  flecha: {
    fontSize: 24,
    color: colors.cobalto,
  },
  lista: {
    gap: 8,
  },
  menos: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.avisoSolido,
  },
  menosTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.cobalto,
  },
});
