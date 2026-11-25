import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { MiCirculo } from '../domain';
import { circuloDeEjemplo } from '../servicios/circulos';
import type { ResultadoDeRetiro } from '../servicios/retiros';
import { RetirarScreen } from './RetirarScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// El círculo de ejemplo con mi turno puesto en la semana en curso (la 6), que es
// cuando se puede retirar: 15 personas x $600 = $9,000 de bote.
function enMiTurno(semanaActual = 6): MiCirculo {
  const base = circuloDeEjemplo();
  const yoAntes = base.circulo.integrantes.find((i) => i.id === base.yoId)!;
  return {
    yoId: base.yoId,
    circulo: {
      ...base.circulo,
      semanaActual,
      integrantes: base.circulo.integrantes.map((i) => {
        if (i.id === base.yoId) {
          return { ...i, turno: semanaActual };
        }
        return i.turno === semanaActual ? { ...i, turno: yoAntes.turno } : i;
      }),
    },
  };
}

async function abrir(
  onConfirmar?: (recibes: number) => Promise<ResultadoDeRetiro>,
  miCirculo: MiCirculo = enMiTurno(),
) {
  const confirmar = jest.fn(onConfirmar ?? (async (): Promise<ResultadoDeRetiro> => ({ ok: true })));
  const onVolver = jest.fn();
  await render(<RetirarScreen miCirculo={miCirculo} onConfirmar={confirmar} onVolver={onVolver} />);
  return { confirmar, onVolver };
}

const boton = () => screen.getByRole('button', { name: /Retirar mi dinero|Retirando/ });

describe('RetirarScreen', () => {
  it('celebra sin gritar: dice que es tu turno y cuánto recibes', async () => {
    await abrir();

    expect(screen.getByText('Es tu turno, semana 6')).toBeTruthy();
    expect(screen.getByText('$8,865')).toBeTruthy();
    expect(screen.getByText('Listos para retirar')).toBeTruthy();
  });

  it('deja a la vista el descuento de las comisiones antes de confirmar', async () => {
    await abrir();

    expect(screen.getByText('Bote del círculo')).toBeTruthy();
    expect(screen.getByText('$9,000.00')).toBeTruthy();
    expect(screen.getByText('Comisión Órbita')).toBeTruthy();
    expect(screen.getByText('1% sobre lo que recibes')).toBeTruthy();
    expect(screen.getByText('−$90.00')).toBeTruthy();
    expect(screen.getByText('Comisión de retiro')).toBeTruthy();
    expect(screen.getByText('−$45.00')).toBeTruthy();
    expect(screen.getByText('Recibes')).toBeTruthy();
    expect(screen.getByText('$8,865.00')).toBeTruthy();
  });

  it('avisa que sigues aportando y hasta cuándo, con la comisión de depósito incluida', async () => {
    await abrir();

    expect(
      screen.getByText(/Sigues aportando \$603 por semana hasta que termine el círculo, en la semana 15\./),
    ).toBeTruthy();
  });

  it('en la última semana no promete más aportes', async () => {
    await abrir(undefined, enMiTurno(15));

    expect(screen.getByText('Esta es la última semana del círculo.')).toBeTruthy();
    expect(screen.queryByText(/Sigues aportando/)).toBeNull();
  });

  it('dice cuánto tarda en llegar', async () => {
    await abrir();

    expect(screen.getByText('Llega en minutos a tu cuenta o en efectivo')).toBeTruthy();
  });

  it('al confirmar manda lo que recibes, ya sin comisiones', async () => {
    const { confirmar } = await abrir();

    await fireEvent.press(boton());

    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(confirmar).toHaveBeenCalledWith(8865);
  });

  it('si la persona cancela no muestra ningún aviso y puede volver a intentar', async () => {
    await abrir(async () => ({ ok: false, motivo: 'cancelada' }));

    await fireEvent.press(boton());

    expect(screen.queryByRole('alert')).toBeNull();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si falla avisa y deja reintentar', async () => {
    await abrir(async () => ({ ok: false, motivo: 'error' }));

    await fireEvent.press(boton());

    expect(
      await screen.findByText('No pudimos completar tu retiro. Revisa tu conexión e inténtalo de nuevo.'),
    ).toBeTruthy();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si el retiro lanza un error lo trata como un fallo y no se rompe', async () => {
    await abrir(async () => {
      throw new Error('fallo del sistema');
    });

    await fireEvent.press(boton());

    expect(await screen.findByText(/No pudimos completar tu retiro/)).toBeTruthy();
  });

  it('mientras retira no deja retirar dos veces', async () => {
    let terminar: (resultado: ResultadoDeRetiro) => void = () => {};
    const { confirmar } = await abrir(
      () => new Promise<ResultadoDeRetiro>((resolver) => (terminar = resolver)),
    );

    await fireEvent.press(boton());
    expect(screen.getByText('Retirando…')).toBeTruthy();
    await fireEvent.press(boton());

    expect(confirmar).toHaveBeenCalledTimes(1);

    await act(async () => terminar({ ok: true }));
    expect(screen.getByText('Retirar mi dinero')).toBeTruthy();
  });

  it('"Volver" regresa sin retirar', async () => {
    const { confirmar, onVolver } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(onVolver).toHaveBeenCalledTimes(1);
    expect(confirmar).not.toHaveBeenCalled();
  });
});
