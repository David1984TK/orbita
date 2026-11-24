import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ResultadoLlave } from '../servicios/llave';
import { LlaveScreen } from './LlaveScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

type Opciones = {
  onCrear?: () => Promise<ResultadoLlave>;
  plataforma?: 'ios' | 'android';
};

async function abrirPantalla({ onCrear, plataforma = 'ios' }: Opciones = {}) {
  const crear = jest.fn(onCrear ?? (async (): Promise<ResultadoLlave> => ({ ok: true })));
  await render(<LlaveScreen onCrear={crear} plataforma={plataforma} />);
  return { crear };
}

const boton = () => screen.getByRole('button', { name: /Activar|Creando/ });

describe('LlaveScreen', () => {
  it('explica la llave por lo que significa, sin palabras técnicas', async () => {
    await abrirPantalla();

    expect(screen.getByText('Crea tu llave')).toBeTruthy();
    expect(screen.getByText('Solo funciona en este teléfono')).toBeTruthy();
    expect(screen.getByText('La llave no sale de aquí')).toBeTruthy();
    expect(screen.getByText('Nadie más puede entrar')).toBeTruthy();
    expect(screen.getByText('Ni nosotros')).toBeTruthy();
    // Palabras que no deben aparecer en ninguna pantalla.
    expect(screen.queryByText(/passkey|wallet|semilla|\bgas\b|XLM/i)).toBeNull();
  });

  it('en iOS habla de Face ID y del rostro', async () => {
    await abrirPantalla({ plataforma: 'ios' });

    expect(screen.getByText('Activar Face ID')).toBeTruthy();
    expect(screen.getByText(/Tu rostro abre Órbita/)).toBeTruthy();
  });

  it('en Android habla de la huella', async () => {
    await abrirPantalla({ plataforma: 'android' });

    expect(screen.getByText('Activar mi huella')).toBeTruthy();
    expect(screen.getByText(/Tu huella abre Órbita/)).toBeTruthy();
    expect(screen.queryByText(/Face ID/)).toBeNull();
  });

  it('al tocar el botón pide crear la llave', async () => {
    const { crear } = await abrirPantalla();

    await fireEvent.press(boton());

    expect(crear).toHaveBeenCalledTimes(1);
  });

  it('si la persona cancela no muestra ningún aviso y puede volver a intentar', async () => {
    await abrirPantalla({ onCrear: async () => ({ ok: false, motivo: 'cancelada' }) });

    await fireEvent.press(boton());

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Activar Face ID')).toBeTruthy();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si el teléfono no tiene biometría explica qué hacer, según la plataforma', async () => {
    await abrirPantalla({
      onCrear: async () => ({ ok: false, motivo: 'sin-biometria' }),
      plataforma: 'android',
    });

    await fireEvent.press(boton());

    expect(await screen.findByText(/no tiene una huella guardada/)).toBeTruthy();
  });

  it('si falla por otra razón avisa y deja reintentar', async () => {
    await abrirPantalla({ onCrear: async () => ({ ok: false, motivo: 'error' }) });

    await fireEvent.press(boton());

    expect(
      await screen.findByText('No pudimos crear tu llave. Inténtalo de nuevo.'),
    ).toBeTruthy();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si la creación lanza un error lo trata como un fallo y no se rompe', async () => {
    await abrirPantalla({
      onCrear: async () => {
        throw new Error('fallo del sistema');
      },
    });

    await fireEvent.press(boton());

    expect(
      await screen.findByText('No pudimos crear tu llave. Inténtalo de nuevo.'),
    ).toBeTruthy();
  });

  it('el aviso desaparece al volver a intentar', async () => {
    let resultado: ResultadoLlave = { ok: false, motivo: 'error' };
    await abrirPantalla({ onCrear: async () => resultado });
    await fireEvent.press(boton());
    await screen.findByText(/No pudimos crear tu llave/);

    resultado = { ok: false, motivo: 'cancelada' };
    await fireEvent.press(boton());

    expect(screen.queryByText(/No pudimos crear tu llave/)).toBeNull();
  });

  it('mientras la crea no deja pedirla dos veces', async () => {
    let terminar: (resultado: ResultadoLlave) => void = () => {};
    const { crear } = await abrirPantalla({
      onCrear: () => new Promise<ResultadoLlave>((resolver) => (terminar = resolver)),
    });

    await fireEvent.press(boton());
    expect(screen.getByText('Creando tu llave…')).toBeTruthy();
    await fireEvent.press(boton());

    expect(crear).toHaveBeenCalledTimes(1);

    await act(async () => terminar({ ok: true }));
    expect(screen.getByText('Activar Face ID')).toBeTruthy();
  });
});
