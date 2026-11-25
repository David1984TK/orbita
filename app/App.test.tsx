import { act, fireEvent, render, screen } from '@testing-library/react-native';
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

    expect(await screen.findByText('Crea tu llave')).toBeTruthy();
  });

  it('al crear la llave avanza a la identidad', async () => {
    await render(<App />);
    await escribirTelefonoYContinuar();
    await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '123456');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await screen.findByText('Crea tu llave');

    await fireEvent.press(screen.getByRole('button', { name: /Activar/ }));

    expect(await screen.findByText('Tu identidad')).toBeTruthy();
  });

  it('de la identidad entra a la pantalla principal con el círculo', async () => {
    await render(<App />);
    await escribirTelefonoYContinuar();
    await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '123456');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(await screen.findByRole('button', { name: /Activar/ }));
    await screen.findByText('Tu identidad');

    await fireEvent.press(screen.getByRole('button', { name: 'Tomar foto de mi INE' }));

    expect(await screen.findByText('Los del mercado')).toBeTruthy();
    expect(screen.getByLabelText('Semana 6 de 15')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Círculo' })).toBeTruthy();
  });

  it('de punta a punta: entra, aporta la cuota y Mi círculo queda al día', async () => {
    await render(<App />);
    await escribirTelefonoYContinuar();
    await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '123456');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(await screen.findByRole('button', { name: /Activar/ }));
    await screen.findByText('Tu identidad');
    await fireEvent.press(screen.getByRole('button', { name: 'Tomar foto de mi INE' }));

    await fireEvent.press(await screen.findByRole('button', { name: 'Aportar mi cuota' }));
    expect(screen.getByText('$603')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Confirmar con/ }));

    expect(await screen.findByText('Ya aportaste esta semana')).toBeTruthy();
  });

  describe('Perdí mi teléfono', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('desde el inicio abre la recuperación y se puede cancelar', async () => {
      await render(<App />);

      await fireEvent.press(screen.getByRole('button', { name: 'Perdí mi teléfono' }));
      expect(screen.getByText('Recuperar mi acceso')).toBeTruthy();

      await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
      expect(screen.getByText('Tu ahorro en grupo, sin que nadie tenga que guardarlo.')).toBeTruthy();
    });

    it('de punta a punta: recupera el acceso y entra a su círculo con el retiro en espera', async () => {
      jest.useFakeTimers();
      await render(<App />);

      await fireEvent.press(screen.getByRole('button', { name: 'Perdí mi teléfono' }));
      await fireEvent.changeText(
        screen.getByLabelText('Número de teléfono celular, 10 dígitos'),
        '5598765432',
      );
      await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
      await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '123456');
      await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Empezar' }));

      // La primera consulta trae una confirmación de tres; la siguiente, la segunda.
      expect(await screen.findByText('Falta una confirmación.')).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await fireEvent.press(await screen.findByRole('button', { name: /Activar/ }));
      expect(await screen.findByText('Recuperaste tu acceso')).toBeTruthy();
      await fireEvent.press(screen.getByRole('button', { name: 'Entrar a mi círculo' }));

      expect(await screen.findByText('Los del mercado')).toBeTruthy();
    });
  });

  it('crear un círculo lleva a verlo llenarse, con el enlace para invitar', async () => {
    await render(<App />);
    await escribirTelefonoYContinuar();
    await fireEvent.changeText(screen.getByLabelText('Código de 6 dígitos'), '123456');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(await screen.findByRole('button', { name: /Activar/ }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Tomar foto de mi INE' }));
    await screen.findByText('Los del mercado');
    await fireEvent.press(screen.getByRole('tab', { name: 'Grupo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Crear otro círculo' }));

    await fireEvent.changeText(screen.getByLabelText('Nombre del círculo'), 'Las del taller');
    await fireEvent.changeText(screen.getByLabelText('Cuota semanal'), '500');
    await fireEvent.press(screen.getByRole('button', { name: 'Crear e invitar' }));

    expect(await screen.findByText('EN FORMACIÓN')).toBeTruthy();
    expect(screen.getByText('Las del taller')).toBeTruthy();
    expect(screen.getByText('https://orbita.example/c/las-del-taller-1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Compartir por WhatsApp' })).toBeTruthy();
  });
});
