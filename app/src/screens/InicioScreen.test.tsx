import { fireEvent, render, screen } from '@testing-library/react-native';
import type { EstadoPago, MiCirculo } from '../domain';
import { circuloDeEjemplo, formacionDeEjemplo } from '../servicios/circulos';
import { InicioScreen } from './InicioScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// El círculo de ejemplo: 15 personas, $600 a la semana, semana 6 (vence el lunes
// 30 de noviembre de 2026). Yo cobro en la semana 12 y me falta pagar esta semana.
type Cambios = {
  semanaActual?: number;
  miTurno?: number;
  miEstado?: EstadoPago;
  misCuotas?: number;
  retiroHasta?: string;
};

function miCirculo({ semanaActual, miTurno, miEstado, misCuotas, retiroHasta }: Cambios = {}): MiCirculo {
  const base = circuloDeEjemplo();
  const yoAntes = base.circulo.integrantes.find((i) => i.id === base.yoId)!;
  const turnoDestino = miTurno ?? yoAntes.turno;
  return {
    yoId: base.yoId,
    circulo: {
      ...base.circulo,
      semanaActual: semanaActual ?? base.circulo.semanaActual,
      // Intercambia turnos para que siga habiendo uno de cada.
      integrantes: base.circulo.integrantes.map((i) => {
        if (i.id === base.yoId) {
          return {
            ...i,
            turno: turnoDestino,
            estado: miEstado ?? i.estado,
            cuotasPagadas: misCuotas ?? i.cuotasPagadas,
            retiroCongeladoHasta: retiroHasta,
          };
        }
        return i.turno === turnoDestino ? { ...i, turno: yoAntes.turno } : i;
      }),
    },
  };
}

async function abrir(cambios: Cambios = {}, ahora?: Date) {
  const onAportar = jest.fn();
  const onRetirar = jest.fn();
  await render(
    <InicioScreen
      miCirculo={miCirculo(cambios)}
      onAportar={onAportar}
      onRetirar={onRetirar}
      ahora={ahora}
    />,
  );
  return { onAportar, onRetirar };
}

describe('InicioScreen', () => {
  it('encabeza con el nombre del círculo, cuántos son y la cuota', async () => {
    await abrir();

    expect(screen.getByText('Los del mercado')).toBeTruthy();
    expect(screen.getByText('15 personas · $600 cada semana')).toBeTruthy();
  });

  it('muestra la semana en que va el círculo', async () => {
    await abrir();

    expect(screen.getByLabelText('Semana 6 de 15')).toBeTruthy();
    expect(screen.getByText('de 15 semanas')).toBeTruthy();
    expect(screen.getByText('Ya cobraron')).toBeTruthy();
    expect(screen.getByText('Tu turno')).toBeTruthy();
    expect(screen.getByText('Faltan')).toBeTruthy();
  });

  it('dice cuándo me toca y cuánto voy a recibir', async () => {
    await abrir();

    expect(screen.getByText('Te toca en la semana 12')).toBeTruthy();
    expect(screen.getByText('Faltan 6 semanas · 11 de enero')).toBeTruthy();
    expect(screen.getByText('$9,000')).toBeTruthy();
  });

  it('dice cuánto llevo aportado', async () => {
    await abrir();

    expect(screen.getByText('Llevas aportado')).toBeTruthy();
    expect(screen.getByText('5 de 15 cuotas, todas a tiempo')).toBeTruthy();
    expect(screen.getByText('$3,000')).toBeTruthy();
  });

  it('con una semana de espera dice "Falta 1 semana", en singular', async () => {
    await abrir({ miTurno: 7 });

    expect(screen.getByText(/^Falta 1 semana · /)).toBeTruthy();
  });

  it('si me toca esta semana lo dice y da el día', async () => {
    await abrir({ miTurno: 6 });

    expect(screen.getByText('Te toca esta semana')).toBeTruthy();
    expect(screen.getByText('Cobras el lunes 30 de noviembre')).toBeTruthy();
  });

  it('si ya cobré lo dice y avisa que sigo aportando', async () => {
    await abrir({ miTurno: 3 });

    expect(screen.getByText('Ya cobraste en la semana 3')).toBeTruthy();
    expect(screen.getByText('Sigues aportando hasta la semana 15')).toBeTruthy();
  });

  it('con la cuota pendiente se puede aportar y dice cuándo vence', async () => {
    const { onAportar } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Aportar mi cuota' }));

    expect(onAportar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Vence el lunes 30 de noviembre')).toBeTruthy();
  });

  it('con la cuota atrasada lo dice distinto y avisa del pago atrasado', async () => {
    await abrir({ miEstado: 'atrasado' });

    expect(screen.getByText('Venció el lunes 30 de noviembre')).toBeTruthy();
    expect(screen.getByText('5 de 15 cuotas, con un pago atrasado')).toBeTruthy();
    // Aun atrasada, puede ponerse al corriente.
    expect(screen.getByRole('button', { name: 'Aportar mi cuota' })).toBeTruthy();
  });

  it('si ya aportó esta semana no deja aportar otra vez y anuncia la siguiente', async () => {
    const { onAportar } = await abrir({ miEstado: 'alDia', misCuotas: 6 });

    const boton = screen.getByRole('button', { name: 'Ya aportaste esta semana' });
    await fireEvent.press(boton);

    expect(boton.props.accessibilityState.disabled).toBe(true);
    expect(onAportar).not.toHaveBeenCalled();
    expect(screen.queryByText('Aportar mi cuota')).toBeNull();
    expect(screen.getByText('La siguiente vence el lunes 7 de diciembre')).toBeTruthy();
  });

  it('en la última semana, si ya aportó, dice que fue la última cuota', async () => {
    await abrir({ semanaActual: 15, miTurno: 3, miEstado: 'alDia', misCuotas: 15 });

    expect(screen.getByText('Fue la última cuota del círculo')).toBeTruthy();
  });

  describe('cuando es mi turno de cobrar', () => {
    it('ofrece retirar como lo principal y no antes de mi turno', async () => {
      const antes = await abrir({ miTurno: 9 });
      expect(screen.queryByRole('button', { name: 'Retirar mi dinero' })).toBeNull();
      expect(antes.onRetirar).not.toHaveBeenCalled();
    });

    it('en mi semana aparece "Retirar mi dinero" y avisa al tocarlo', async () => {
      const { onRetirar } = await abrir({ miTurno: 6 });

      await fireEvent.press(screen.getByRole('button', { name: 'Retirar mi dinero' }));

      expect(onRetirar).toHaveBeenCalledTimes(1);
    });

    it('si me falta la cuota de esta semana, aportar queda como acción secundaria', async () => {
      const { onAportar, onRetirar } = await abrir({ miTurno: 6, miEstado: 'pendiente' });

      await fireEvent.press(screen.getByRole('button', { name: 'Aportar mi cuota' }));

      expect(onAportar).toHaveBeenCalledTimes(1);
      expect(onRetirar).not.toHaveBeenCalled();
      expect(screen.getByText('Vence el lunes 30 de noviembre')).toBeTruthy();
    });

    it('si ya aporté esta semana solo queda retirar y se dice que ya aporté', async () => {
      await abrir({ miTurno: 6, miEstado: 'alDia', misCuotas: 6 });

      expect(screen.getByRole('button', { name: 'Retirar mi dinero' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Aportar mi cuota' })).toBeNull();
      expect(
        screen.getByText('Ya aportaste esta semana · La siguiente vence el lunes 7 de diciembre'),
      ).toBeTruthy();
    });
  });

  describe('en la espera de seguridad de después de recuperar el acceso', () => {
    const hasta = '2026-11-27T12:00:00Z';
    const durante = new Date('2026-11-25T12:00:00Z');
    const despues = new Date('2026-11-28T12:00:00Z');

    it('en mi turno el retiro se apaga y dice hasta cuándo', async () => {
      const { onRetirar } = await abrir({ miTurno: 6, retiroHasta: hasta }, durante);

      const boton = screen.getByRole('button', { name: 'Retirar mi dinero' });
      await fireEvent.press(boton);

      expect(boton.props.accessibilityState.disabled).toBe(true);
      expect(onRetirar).not.toHaveBeenCalled();
      expect(
        screen.getByText('Por seguridad podrás retirar a partir del viernes 27 de noviembre'),
      ).toBeTruthy();
    });

    it('aun en la espera se puede aportar la cuota', async () => {
      const { onAportar } = await abrir({ miTurno: 6, retiroHasta: hasta }, durante);

      await fireEvent.press(screen.getByRole('button', { name: 'Aportar mi cuota' }));

      expect(onAportar).toHaveBeenCalledTimes(1);
    });

    it('cuando la espera termina se puede retirar otra vez', async () => {
      const { onRetirar } = await abrir({ miTurno: 6, retiroHasta: hasta }, despues);

      await fireEvent.press(screen.getByRole('button', { name: 'Retirar mi dinero' }));

      expect(onRetirar).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/Por seguridad podrás retirar/)).toBeNull();
    });

    it('si no es mi turno no hay botón de retiro ni aviso de espera', async () => {
      await abrir({ miTurno: 9, retiroHasta: hasta }, durante);

      expect(screen.queryByRole('button', { name: 'Retirar mi dinero' })).toBeNull();
      expect(screen.queryByText(/Por seguridad podrás retirar/)).toBeNull();
    });
  });

  describe('círculos que se están llenando', () => {
    async function abrirConFormacion(formando = [formacionDeEjemplo()]) {
      const onVerFormacion = jest.fn();
      await render(
        <InicioScreen
          miCirculo={miCirculo()}
          onAportar={jest.fn()}
          onRetirar={jest.fn()}
          enFormacion={formando}
          onVerFormacion={onVerFormacion}
        />,
      );
      return { onVerFormacion };
    }

    it('sin círculos en formación no hay aviso', async () => {
      await abrir();

      expect(screen.queryByText(/Estás formando/)).toBeNull();
    });

    it('avisa de cada círculo que se llena y cuánto falta', async () => {
      await abrirConFormacion([
        formacionDeEjemplo({ id: 'uno', nombre: 'Primero' }),
        formacionDeEjemplo({
          id: 'dos',
          nombre: 'Segundo',
          integrantes: 5,
          participantes: [
            { id: 'yo', nombre: 'David Nava' },
            { id: 'a', nombre: 'Rosa Martínez' },
            { id: 'b', nombre: 'Julio Lara' },
            { id: 'c', nombre: 'Ana Torres' },
          ],
        }),
      ]);

      expect(screen.getByLabelText('Estás formando Primero. Faltan 9 personas.')).toBeTruthy();
      expect(screen.getByLabelText('Estás formando Segundo. Falta 1 persona.')).toBeTruthy();
    });

    it('al tocar un aviso dice cuál círculo se quiere ver', async () => {
      const { onVerFormacion } = await abrirConFormacion([
        formacionDeEjemplo({ id: 'uno', nombre: 'Primero' }),
        formacionDeEjemplo({ id: 'dos', nombre: 'Segundo' }),
      ]);

      await fireEvent.press(screen.getByLabelText(/Estás formando Segundo/));

      expect(onVerFormacion).toHaveBeenCalledTimes(1);
      expect(onVerFormacion).toHaveBeenCalledWith('dos');
    });
  });
});
