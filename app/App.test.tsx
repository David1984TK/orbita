import { fireEvent, render, screen } from '@testing-library/react-native';
import App from './App';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function escribirTelefonoYContinuar() {
  await fireEvent.changeText(
    screen.getByLabelText('Número de teléfono celular, 10 dígitos'),
    '5512345678',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
}

describe('App: entrada', () => {
  it('del teléfono pasa al código y muestra el número', async () => {
    await render(<App />);

    await escribirTelefonoYContinuar();

    expect(screen.getByText('Tu código')).toBeTruthy();
    expect(screen.getByText('Te lo mandamos por WhatsApp al 55 1234 5678')).toBeTruthy();
  });

  it('"Cambiar número" regresa al teléfono', async () => {
    await render(<App />);
    await escribirTelefonoYContinuar();

    await fireEvent.press(screen.getByText('Cambiar número'));

    expect(screen.getByLabelText('Número de teléfono celular, 10 dígitos')).toBeTruthy();
  });

  it('con un código equivocado se queda en la pantalla del código', async () => {
    await render(<App />);
    await escribirTelefonoYContinuar();

    await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '000000');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/no es correcto/)).toBeTruthy();
    expect(screen.getByText('Tu código')).toBeTruthy();
  });

  it('con el código correcto avanza a la creación de la llave', async () => {
    await render(<App />);
    await escribirTelefonoYContinuar();

    await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '123456');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/Sigue la pantalla «Tu llave»/)).toBeTruthy();
  });
});
