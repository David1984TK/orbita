import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConMargenInferior } from './ConMargenInferior';

// Un teléfono con barra de gestos: el sistema se queda 34 puntos de abajo.
const CON_BARRA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 54, left: 0, right: 0, bottom: 34 },
};

function margenDeAbajo() {
  const contenedor = screen.getByTestId('contenido').parent;
  return StyleSheet.flatten(contenedor?.props.style).paddingBottom;
}

describe('ConMargenInferior', () => {
  it('deja libre el espacio de abajo que el sistema se queda', async () => {
    await render(
      <SafeAreaProvider initialMetrics={CON_BARRA}>
        <ConMargenInferior activo>
          <Text testID="contenido">Hola</Text>
        </ConMargenInferior>
      </SafeAreaProvider>,
    );

    expect(margenDeAbajo()).toBe(34);
  });

  it('si no está activo no deja margen: ahí ya lo deja la barra de pestañas', async () => {
    await render(
      <SafeAreaProvider initialMetrics={CON_BARRA}>
        <ConMargenInferior activo={false}>
          <Text testID="contenido">Hola</Text>
        </ConMargenInferior>
      </SafeAreaProvider>,
    );

    expect(margenDeAbajo()).toBe(0);
  });

  it('en un teléfono sin barra de abajo no suma nada', async () => {
    await render(
      <SafeAreaProvider initialMetrics={{ ...CON_BARRA, insets: { ...CON_BARRA.insets, bottom: 0 } }}>
        <ConMargenInferior activo>
          <Text testID="contenido">Hola</Text>
        </ConMargenInferior>
      </SafeAreaProvider>,
    );

    expect(margenDeAbajo()).toBe(0);
  });

  it('sin información del sistema (pruebas, web) tampoco falla', async () => {
    await render(
      <ConMargenInferior activo>
        <Text testID="contenido">Hola</Text>
      </ConMargenInferior>,
    );

    expect(margenDeAbajo()).toBe(0);
  });

  it('muestra lo que lleva dentro', async () => {
    await render(
      <ConMargenInferior activo>
        <Text>Hola</Text>
      </ConMargenInferior>,
    );

    expect(screen.getByText('Hola')).toBeTruthy();
  });
});
