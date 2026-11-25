import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RespuestaASolicitud } from '../servicios/recuperacion';
import { solicitudDeEjemplo } from '../servicios/recuperacion';
import { ConfirmarIdentidadScreen } from './ConfirmarIdentidadScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrir(onResponder?: (respuesta: RespuestaASolicitud) => Promise<void>) {
  const responder = jest.fn(onResponder ?? (async () => {}));
  await render(<ConfirmarIdentidadScreen solicitud={solicitudDeEjemplo()} onResponder={responder} />);
  return { responder };
}

const si = () => screen.getByRole('button', { name: /Sí, es Julio|Confirmando/ });
const no = () => screen.getByRole('button', { name: /No reconozco a Julio|Avisando/ });

describe('ConfirmarIdentidadScreen', () => {
  it('cuenta quién perdió su teléfono y pregunta si de verdad es esa persona', async () => {
    await abrir();

    expect(
      screen.getByText(
        /Julio perdió su teléfono y quiere volver a entrar a Los del mercado\. ¿Es\s+realmente Julio\?/,
      ),
    ).toBeTruthy();
  });

  it('muestra lo que ayuda a decidir: turno, cuotas pagadas y cuándo se registró', async () => {
    await abrir();

    expect(screen.getByText('Julio Lara')).toBeTruthy();
    expect(screen.getByText('Turno 7 · lleva 6 cuotas pagadas')).toBeTruthy();
    expect(screen.getByText('Se registró')).toBeTruthy();
    expect(screen.getByText('Hace 4 meses')).toBeTruthy();
    expect(screen.getByText('JL', { includeHiddenElements: true })).toBeTruthy();
  });

  it('decir "no" es tan fácil como decir "sí", y se recuerda que otra persona puede responder', async () => {
    await abrir();

    expect(si()).toBeTruthy();
    expect(no()).toBeTruthy();
    expect(
      screen.getByText('Si tienes dudas, di que no. Otra persona del círculo puede responder.'),
    ).toBeTruthy();
  });

  it('no usa pronombres: ni "él" ni "lo" para hablar de la persona', async () => {
    await abrir();

    expect(screen.queryByText(/\b(él|lo reconozco)\b/)).toBeNull();
  });

  it('"Sí, es Julio" manda la confirmación', async () => {
    const { responder } = await abrir();

    await fireEvent.press(si());

    expect(responder).toHaveBeenCalledTimes(1);
    expect(responder).toHaveBeenCalledWith('confirmo');
  });

  it('"No reconozco a Julio" manda el rechazo', async () => {
    const { responder } = await abrir();

    await fireEvent.press(no());

    expect(responder).toHaveBeenCalledTimes(1);
    expect(responder).toHaveBeenCalledWith('no-lo-reconozco');
  });

  it('si no se pudo mandar la respuesta avisa y deja reintentar', async () => {
    await abrir(async () => {
      throw new Error('sin conexión');
    });

    await fireEvent.press(si());

    expect(
      await screen.findByText(
        'No pudimos mandar tu respuesta. Revisa tu conexión e inténtalo de nuevo.',
      ),
    ).toBeTruthy();
    expect(si().props.accessibilityState.disabled).toBe(false);
    expect(no().props.accessibilityState.disabled).toBe(false);
  });

  it('mientras responde no deja responder dos veces, ni "sí" ni "no"', async () => {
    let terminar: () => void = () => {};
    const { responder } = await abrir(() => new Promise<void>((r) => (terminar = r)));

    await fireEvent.press(si());
    expect(screen.getByText('Confirmando…')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Confirmando/ }));
    await fireEvent.press(no());

    expect(responder).toHaveBeenCalledTimes(1);
    await act(async () => terminar());
  });
});
