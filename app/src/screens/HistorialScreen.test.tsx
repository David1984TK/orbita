import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { Historial } from '../domain';
import { historialDeEjemplo } from '../servicios/historial';
import { HistorialScreen } from './HistorialScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrir(cambios: Partial<Historial> = {}) {
  const onCompartir = jest.fn();
  await render(<HistorialScreen historial={{ ...historialDeEjemplo(), ...cambios }} onCompartir={onCompartir} />);
  return { onCompartir };
}

describe('HistorialScreen', () => {
  it('muestra el puntaje y el nivel en el medidor', async () => {
    await abrir();

    expect(screen.getByText('Mi historial')).toBeTruthy();
    expect(screen.getByText('340')).toBeTruthy();
    expect(screen.getByText('Básico')).toBeTruthy();
    expect(screen.getByLabelText('Nivel Básico, 340 de 1000 puntos')).toBeTruthy();
  });

  it('explica lo que desbloquea: desde qué turno puedes cobrar y cómo subir', async () => {
    await abrir();

    expect(
      screen.getByText(
        /Con tu historial actual puedes cobrar desde el turno 5\. Completa este círculo y subes a Sólido, que te deja cobrar desde el turno 3\./,
      ),
    ).toBeTruthy();
  });

  it('en el nivel más alto no promete un nivel que no existe', async () => {
    await abrir({
      nivel: { nombre: 'Experto', cobraDesdeTurno: 1 },
      siguienteNivel: undefined,
    });

    expect(
      screen.getByText(/puedes cobrar desde el turno 1\. Estás en el nivel más alto\./),
    ).toBeTruthy();
    expect(screen.queryByText(/Completa este círculo/)).toBeNull();
  });

  it('muestra pagos a tiempo, círculos completados y lo ahorrado', async () => {
    await abrir();

    expect(screen.getByText('Pagos a tiempo')).toBeTruthy();
    expect(screen.getByText('20 de 20')).toBeTruthy();
    expect(screen.getByText('Círculos completados')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Ahorrado con Órbita')).toBeTruthy();
    expect(screen.getByText('$12,000')).toBeTruthy();
  });

  it('los pagos a tiempo van en verde solo si todos fueron a tiempo', async () => {
    await abrir();
    expect(StyleSheet.flatten(screen.getByText('20 de 20').props.style).color).toBe('#248A3D');
  });

  it('con pagos tardíos las cifras no van en verde', async () => {
    await abrir({ pagosATiempo: 18, pagosTotales: 20 });

    expect(StyleSheet.flatten(screen.getByText('18 de 20').props.style).color).not.toBe('#248A3D');
  });

  it('"Compartir mi historial" avisa al tocarlo', async () => {
    const { onCompartir } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: /Compartir mi historial/ }));

    expect(onCompartir).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Para pedir un crédito en otro lado')).toBeTruthy();
  });

  it('no llama "score" al puntaje en ninguna parte de la pantalla', async () => {
    await abrir();

    expect(screen.queryByText(/score/i)).toBeNull();
  });
});
