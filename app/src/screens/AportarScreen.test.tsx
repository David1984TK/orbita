import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { MiCirculo } from '../domain';
import type { ResultadoDeAporte } from '../servicios/aportes';
import { circuloDeEjemplo } from '../servicios/circulos';
import { AportarScreen } from './AportarScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

type Opciones = {
  miCirculo?: MiCirculo;
  onConfirmar?: (total: number) => Promise<ResultadoDeAporte>;
  plataforma?: 'ios' | 'android';
};

// El círculo de ejemplo: $600 a la semana, semana 6 de 15, y me toca en la 12.
async function abrir({ miCirculo, onConfirmar, plataforma = 'ios' }: Opciones = {}) {
  const confirmar = jest.fn(onConfirmar ?? (async (): Promise<ResultadoDeAporte> => ({ ok: true })));
  const onVolver = jest.fn();
  await render(
    <AportarScreen
      miCirculo={miCirculo ?? circuloDeEjemplo()}
      onConfirmar={confirmar}
      onVolver={onVolver}
      plataforma={plataforma}
    />,
  );
  return { confirmar, onVolver };
}

const boton = () => screen.getByRole('button', { name: /Confirmar|Confirmando/ });

describe('AportarScreen', () => {
  it('dice en qué semana va y cuánto se descuenta en total', async () => {
    await abrir();

    expect(screen.getByText('Semana 6 de 15')).toBeTruthy();
    expect(screen.getByText('Aportar')).toBeTruthy();
    expect(screen.getByText('$603')).toBeTruthy();
    expect(screen.getByText('Se descuenta de tu cuenta')).toBeTruthy();
  });

  it('desglosa la comisión antes de pagar: a tu círculo, comisión y total', async () => {
    await abrir();

    expect(screen.getByText('Va a tu círculo')).toBeTruthy();
    expect(screen.getByText('$600.00')).toBeTruthy();
    expect(screen.getByText('Comisión de depósito')).toBeTruthy();
    expect(screen.getByText('0.5%')).toBeTruthy();
    expect(screen.getByText('$3.00')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('$603.00')).toBeTruthy();
  });

  it('explica dónde queda el dinero y cuándo se libera, si me toca más adelante', async () => {
    await abrir();

    expect(
      screen.getByText(
        'Tu aporte queda guardado en el círculo hasta la semana 12, cuando te toque cobrar. Nadie puede sacarlo antes.',
      ),
    ).toBeTruthy();
  });

  it('si ya cobré no promete una fecha que no existe', async () => {
    const base = circuloDeEjemplo();
    const yaCobre: MiCirculo = {
      ...base,
      circulo: {
        ...base.circulo,
        integrantes: base.circulo.integrantes.map((i) =>
          i.id === base.yoId ? { ...i, turno: 2 } : i.turno === 2 ? { ...i, turno: 12 } : i,
        ),
      },
    };

    await abrir({ miCirculo: yaCobre });

    expect(screen.queryByText(/hasta la semana/)).toBeNull();
    expect(
      screen.getByText(
        'Tu aporte queda guardado en el círculo y se libera en el orden pactado. Nadie puede sacarlo antes.',
      ),
    ).toBeTruthy();
  });

  it('en iOS confirma con Face ID y en Android con la huella', async () => {
    await abrir({ plataforma: 'ios' });
    expect(screen.getByText('Confirmar con Face ID')).toBeTruthy();
  });

  it('en Android pide la huella', async () => {
    await abrir({ plataforma: 'android' });

    expect(screen.getByText('Confirmar con mi huella')).toBeTruthy();
    expect(screen.queryByText(/Face ID/)).toBeNull();
  });

  it('al confirmar manda el total que se descuenta, comisión incluida', async () => {
    const { confirmar } = await abrir();

    await fireEvent.press(boton());

    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(confirmar).toHaveBeenCalledWith(603);
  });

  it('si la persona cancela no muestra ningún aviso y puede volver a intentar', async () => {
    await abrir({ onConfirmar: async () => ({ ok: false, motivo: 'cancelada' }) });

    await fireEvent.press(boton());

    expect(screen.queryByRole('alert')).toBeNull();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si falla avisa y deja reintentar', async () => {
    await abrir({ onConfirmar: async () => ({ ok: false, motivo: 'error' }) });

    await fireEvent.press(boton());

    expect(
      await screen.findByText(
        'No pudimos completar tu aporte. Revisa tu conexión e inténtalo de nuevo.',
      ),
    ).toBeTruthy();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si el aporte lanza un error lo trata como un fallo y no se rompe', async () => {
    await abrir({
      onConfirmar: async () => {
        throw new Error('fallo del sistema');
      },
    });

    await fireEvent.press(boton());

    expect(await screen.findByText(/No pudimos completar tu aporte/)).toBeTruthy();
  });

  it('el aviso desaparece al volver a intentar', async () => {
    let resultado: ResultadoDeAporte = { ok: false, motivo: 'error' };
    await abrir({ onConfirmar: async () => resultado });
    await fireEvent.press(boton());
    await screen.findByText(/No pudimos completar tu aporte/);

    resultado = { ok: false, motivo: 'cancelada' };
    await fireEvent.press(boton());

    expect(screen.queryByText(/No pudimos completar tu aporte/)).toBeNull();
  });

  it('mientras confirma no deja aportar dos veces', async () => {
    let terminar: (resultado: ResultadoDeAporte) => void = () => {};
    const { confirmar } = await abrir({
      onConfirmar: () => new Promise<ResultadoDeAporte>((resolver) => (terminar = resolver)),
    });

    await fireEvent.press(boton());
    expect(screen.getByText('Confirmando…')).toBeTruthy();
    await fireEvent.press(boton());

    expect(confirmar).toHaveBeenCalledTimes(1);

    await act(async () => terminar({ ok: true }));
    expect(screen.getByText('Confirmar con Face ID')).toBeTruthy();
  });

  it('"Volver" regresa sin aportar', async () => {
    const { confirmar, onVolver } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(onVolver).toHaveBeenCalledTimes(1);
    expect(confirmar).not.toHaveBeenCalled();
  });
});
