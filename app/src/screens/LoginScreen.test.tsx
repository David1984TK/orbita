import { fireEvent, render, screen } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';

// Los márgenes seguros dependen de la pantalla real del teléfono; en las
// pruebas se usa la versión simulada que trae la propia librería.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const ETIQUETA_CAMPO = 'Número de teléfono celular, 10 dígitos';

async function abrirPantalla() {
  const onContinuar = jest.fn();
  await render(<LoginScreen onContinuar={onContinuar} />);
  return {
    onContinuar,
    campo: screen.getByLabelText(ETIQUETA_CAMPO),
    boton: screen.getByRole('button', { name: 'Continuar' }),
  };
}

describe('LoginScreen', () => {
  it('arranca con el campo vacío y el botón desactivado', async () => {
    const { campo, boton } = await abrirPantalla();

    expect(campo.props.value).toBe('');
    expect(boton.props.accessibilityState.disabled).toBe(true);
  });

  it('muestra el número con el formato del diseño mientras se escribe', async () => {
    const { campo } = await abrirPantalla();

    await fireEvent.changeText(campo, '5512345');

    expect(screen.getByLabelText(ETIQUETA_CAMPO).props.value).toBe('55 1234 5');
  });

  it('con el número incompleto el botón sigue desactivado', async () => {
    const { campo, boton, onContinuar } = await abrirPantalla();

    await fireEvent.changeText(campo, '551234567'); // 9 dígitos
    await fireEvent.press(boton);

    expect(onContinuar).not.toHaveBeenCalled();
  });

  it('con los 10 dígitos entrega el número limpio', async () => {
    const { campo, onContinuar } = await abrirPantalla();

    await fireEvent.changeText(campo, '55 1234 5678');
    const boton = screen.getByRole('button', { name: 'Continuar' });
    expect(boton.props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(boton);

    expect(onContinuar).toHaveBeenCalledTimes(1);
    expect(onContinuar).toHaveBeenCalledWith('5512345678');
  });

  it('acepta un número pegado con la lada del país', async () => {
    const { campo, onContinuar } = await abrirPantalla();

    await fireEvent.changeText(campo, '+52 55 1234 5678');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(onContinuar).toHaveBeenCalledWith('5512345678');
  });

  it('el botón del teclado también continúa cuando el número está completo', async () => {
    const { campo, onContinuar } = await abrirPantalla();

    await fireEvent.changeText(campo, '5512345678');
    await fireEvent(campo, 'submitEditing');

    expect(onContinuar).toHaveBeenCalledWith('5512345678');
  });

  it('el botón del teclado no hace nada con el número incompleto', async () => {
    const { campo, onContinuar } = await abrirPantalla();

    await fireEvent.changeText(campo, '5512');
    await fireEvent(campo, 'submitEditing');

    expect(onContinuar).not.toHaveBeenCalled();
  });
});
