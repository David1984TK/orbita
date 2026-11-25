import { fireEvent, render, screen } from '@testing-library/react-native';
import { RecuperarScreen } from './RecuperarScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const ETIQUETA_CAMPO = 'Número de teléfono celular, 10 dígitos';

async function abrir() {
  const onContinuar = jest.fn();
  const onCancelar = jest.fn();
  await render(<RecuperarScreen onContinuar={onContinuar} onCancelar={onCancelar} />);
  return { onContinuar, onCancelar };
}

const boton = () => screen.getByRole('button', { name: 'Continuar' });

describe('RecuperarScreen', () => {
  it('dice qué va a pasar y cuánto tarda, antes de pedir nada', async () => {
    await abrir();

    expect(screen.getByText('Recuperar mi acceso')).toBeTruthy();
    expect(
      screen.getByText('Tu llave vivía en el teléfono anterior. Vamos a crear una nueva.'),
    ).toBeTruthy();
    expect(screen.getByText('Confirmar tu número')).toBeTruthy();
    expect(screen.getByText('Un minuto')).toBeTruthy();
    expect(screen.getByText('Una selfie')).toBeTruthy();
    expect(screen.getByText('La comparamos con tu registro')).toBeTruthy();
    expect(screen.getByText('Tu grupo confirma')).toBeTruthy();
    expect(screen.getByText('Unas horas, normalmente')).toBeTruthy();
  });

  it('avisa que si el número es el mismo de antes se escribe igual', async () => {
    await abrir();

    expect(screen.getByText('Si tu número es el mismo de antes, escríbelo igual.')).toBeTruthy();
  });

  it('arranca con el botón desactivado y se activa con los 10 dígitos', async () => {
    await abrir();
    expect(boton().props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByLabelText(ETIQUETA_CAMPO), '55987');
    expect(boton().props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByLabelText(ETIQUETA_CAMPO), '5598765432');
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('muestra el número con el formato del diseño', async () => {
    await abrir();

    await fireEvent.changeText(screen.getByLabelText(ETIQUETA_CAMPO), '5598765432');

    expect(screen.getByLabelText(ETIQUETA_CAMPO).props.value).toBe('55 9876 5432');
  });

  it('entrega los 10 dígitos limpios, aunque se pegue con la lada', async () => {
    const { onContinuar } = await abrir();

    await fireEvent.changeText(screen.getByLabelText(ETIQUETA_CAMPO), '+52 55 9876 5432');
    await fireEvent.press(boton());

    expect(onContinuar).toHaveBeenCalledTimes(1);
    expect(onContinuar).toHaveBeenCalledWith('5598765432');
  });

  it('con el número incompleto no continúa', async () => {
    const { onContinuar } = await abrir();

    await fireEvent.changeText(screen.getByLabelText(ETIQUETA_CAMPO), '55987');
    await fireEvent.press(boton());

    expect(onContinuar).not.toHaveBeenCalled();
  });

  it('"Volver" regresa a la pantalla de inicio', async () => {
    const { onCancelar } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });
});
