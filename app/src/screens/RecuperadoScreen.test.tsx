import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ResumenDeRecuperacion } from '../servicios/recuperacion';
import { RecuperadoScreen } from './RecuperadoScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const resumen: ResumenDeRecuperacion = {
  cuotasPagadas: 6,
  cobraEnSemana: 13,
  puntaje: 340,
  retiroCongeladoHasta: '2026-11-27T21:00:00Z',
};

async function abrir(cambios: Partial<ResumenDeRecuperacion> = {}) {
  const onEntrar = jest.fn();
  await render(<RecuperadoScreen resumen={{ ...resumen, ...cambios }} onEntrar={onEntrar} />);
  return { onEntrar };
}

describe('RecuperadoScreen', () => {
  it('confirma que recuperaste el acceso y que la llave anterior quedó anulada', async () => {
    await abrir();

    expect(screen.getByText('Recuperaste tu acceso')).toBeTruthy();
    expect(
      screen.getByText('Tu llave nueva ya está en este teléfono. La anterior quedó anulada.'),
    ).toBeTruthy();
  });

  it('dice que el círculo y el historial siguen intactos', async () => {
    await abrir();

    expect(screen.getByText('Tu círculo sigue igual')).toBeTruthy();
    expect(screen.getByText('6 cuotas pagadas · cobras en la semana 13')).toBeTruthy();
    expect(screen.getByText('Tu historial')).toBeTruthy();
    expect(screen.getByText('Intacto, 340 puntos')).toBeTruthy();
  });

  it('con una sola cuota lo dice en singular', async () => {
    await abrir({ cuotasPagadas: 1 });

    expect(screen.getByText('1 cuota pagada · cobras en la semana 13')).toBeTruthy();
  });

  it('explica la espera de 72 horas como protección y avisa que el círculo fue avisado', async () => {
    await abrir();

    expect(
      screen.getByText(/Por seguridad no puedes retirar dinero durante 72 horas\./),
    ).toBeTruthy();
    expect(screen.getByText(/Avisamos a todo tu círculo/)).toBeTruthy();
  });

  it('"Entrar a mi círculo" entra a la app', async () => {
    const { onEntrar } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Entrar a mi círculo' }));

    expect(onEntrar).toHaveBeenCalledTimes(1);
  });
});
