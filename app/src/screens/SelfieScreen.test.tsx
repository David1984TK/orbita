import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ResultadoDeSelfie } from '../servicios/recuperacion';
import { SelfieScreen } from './SelfieScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrir(onEmpezar?: () => Promise<ResultadoDeSelfie>) {
  const empezar = jest.fn(onEmpezar ?? (async (): Promise<ResultadoDeSelfie> => ({ ok: true })));
  await render(<SelfieScreen onEmpezar={empezar} />);
  return { empezar };
}

const boton = () => screen.getByRole('button', { name: /Empezar|Revisando/ });

describe('SelfieScreen', () => {
  it('dice en qué paso va y qué hacer frente a la cámara', async () => {
    await abrir();

    expect(screen.getByText('Paso 2 de 3')).toBeTruthy();
    expect(screen.getByText('Mírate a la cámara')).toBeTruthy();
    expect(screen.getByLabelText('Paso 2 de 3')).toBeTruthy();
    expect(
      screen.getByText('Mueve la cabeza despacio hacia un lado y después al otro.'),
    ).toBeTruthy();
    expect(screen.getByText('Busca un lugar con luz')).toBeTruthy();
  });

  it('aclara que se compara con el registro y que no se pide la INE otra vez', async () => {
    await abrir();

    expect(
      screen.getByText(/La comparamos con la foto que tomaste cuando te registraste/),
    ).toBeTruthy();
    expect(screen.getByText(/No necesitas tu INE de nuevo/)).toBeTruthy();
  });

  it('al empezar pide la comparación', async () => {
    const { empezar } = await abrir();

    await fireEvent.press(boton());

    expect(empezar).toHaveBeenCalledTimes(1);
  });

  it('si no coincide explica qué probar y deja reintentar', async () => {
    await abrir(async () => ({ ok: false, motivo: 'no-coincide' }));

    await fireEvent.press(boton());

    expect(
      await screen.findByText(
        'No pudimos confirmar que eres tú. Busca un lugar con más luz e inténtalo de nuevo.',
      ),
    ).toBeTruthy();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si falla por otra razón lo dice distinto', async () => {
    await abrir(async () => ({ ok: false, motivo: 'error' }));

    await fireEvent.press(boton());

    expect(
      await screen.findByText(
        'No pudimos revisar tu selfie. Revisa tu conexión e inténtalo de nuevo.',
      ),
    ).toBeTruthy();
  });

  it('si la persona cierra la cámara no muestra ningún aviso', async () => {
    await abrir(async () => ({ ok: false, motivo: 'cancelada' }));

    await fireEvent.press(boton());

    expect(screen.queryByRole('alert')).toBeNull();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si la verificación lanza un error lo trata como un fallo y no se rompe', async () => {
    await abrir(async () => {
      throw new Error('fallo del sistema');
    });

    await fireEvent.press(boton());

    expect(await screen.findByText(/No pudimos revisar tu selfie/)).toBeTruthy();
  });

  it('el aviso desaparece al volver a intentar', async () => {
    let resultado: ResultadoDeSelfie = { ok: false, motivo: 'no-coincide' };
    await abrir(async () => resultado);
    await fireEvent.press(boton());
    await screen.findByText(/No pudimos confirmar que eres tú/);

    resultado = { ok: false, motivo: 'cancelada' };
    await fireEvent.press(boton());

    expect(screen.queryByText(/No pudimos confirmar que eres tú/)).toBeNull();
  });

  it('mientras revisa no deja empezar dos veces', async () => {
    let terminar: (resultado: ResultadoDeSelfie) => void = () => {};
    const { empezar } = await abrir(
      () => new Promise<ResultadoDeSelfie>((resolver) => (terminar = resolver)),
    );

    await fireEvent.press(boton());
    expect(screen.getByText('Revisando…')).toBeTruthy();
    await fireEvent.press(boton());

    expect(empezar).toHaveBeenCalledTimes(1);

    await act(async () => terminar({ ok: true }));
    expect(screen.getByText('Empezar')).toBeTruthy();
  });
});
