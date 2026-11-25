import { useState } from 'react';
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
};

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
 * Hay que ponerla dentro de un contenedor con `position: relative` (cualquier
 * vista, el contenido de un ScrollView o una pantalla): se pega a su borde de
 * arriba.
 */
export function PilaDeAvisos({ avisos }: Props) {
  const [abierta, setAbierta] = useState(false);

  if (avisos.length === 0) {
    return null;
  }

  if (avisos.length === 1) {
    const [unico] = avisos;
    return (
      <View style={estilos.raiz} pointerEvents="box-none">
        <Pressable
          onPress={unico.onPress}
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

  if (!abierta) {
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
