import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BorradorDeCirculo } from '../domain';
import { formacionDeEjemplo } from '../servicios/circulos';
import type { ResultadoDeCreacion } from '../servicios/circulos';
import { NuevoCirculoScreen } from './NuevoCirculoScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrir(onCrear?: (borrador: BorradorDeCirculo) => Promise<ResultadoDeCreacion>) {
  const crear = jest.fn(
    onCrear ??
      (async (): Promise<ResultadoDeCreacion> => ({ ok: true, enFormacion: formacionDeEjemplo() })),
  );
  const onVolver = jest.fn();
  await render(<NuevoCirculoScreen onCrear={crear} onVolver={onVolver} hoy="2026-11-24" />);
  return { crear, onVolver };
}

const campoNombre = () => screen.getByLabelText('Nombre del círculo');
const campoCuota = () => screen.getByLabelText('Cuota semanal');
const boton = () => screen.getByRole('button', { name: /Crear e invitar|Creando/ });

async function llenar(nombre = 'Los del mercado', cuota = '600') {
  await fireEvent.changeText(campoNombre(), nombre);
  await fireEvent.changeText(campoCuota(), cuota);
}

describe('NuevoCirculoScreen', () => {
  it('arranca vacío: no se puede crear y pide completar nombre y cuota', async () => {
    await abrir();

    expect(screen.getByText('Nuevo círculo')).toBeTruthy();
    expect(boton().props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText(/Ponle nombre y escribe la cuota/)).toBeTruthy();
    expect(screen.getByText('Se comparte por WhatsApp con un enlace')).toBeTruthy();
  });

  it('con nombre y cuota habilita el botón y explica los números', async () => {
    await abrir();

    await llenar();

    expect(boton().props.accessibilityState.disabled).toBe(false);
    expect(
      screen.getByText(
        /Cada integrante aporta \$600 durante 10 semanas y recibe \$6,000 en su turno\. Si arranca hoy, el círculo termina el 2 de febrero\./,
      ),
    ).toBeTruthy();
  });

  it('cada ajuste recalcula el resumen', async () => {
    await abrir();
    await llenar('Los del mercado', '600');

    await fireEvent.press(screen.getByRole('button', { name: 'Más integrantes' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Más integrantes' }));
    expect(screen.getByLabelText('12 integrantes')).toBeTruthy();
    expect(screen.getByText(/durante 12 semanas y recibe \$7,200 en su turno/)).toBeTruthy();

    await fireEvent.changeText(campoCuota(), '500');
    expect(screen.getByText(/aporta \$500 durante 12 semanas y recibe \$6,000/)).toBeTruthy();
  });

  it('las integrantes van de 5 a 15 y los botones se apagan en los límites', async () => {
    await abrir();

    for (let i = 0; i < 8; i += 1) {
      await fireEvent.press(screen.getByRole('button', { name: 'Menos integrantes' }));
    }
    expect(screen.getByLabelText('5 integrantes')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Menos integrantes' }).props.accessibilityState.disabled).toBe(true);

    for (let i = 0; i < 12; i += 1) {
      await fireEvent.press(screen.getByRole('button', { name: 'Más integrantes' }));
    }
    expect(screen.getByLabelText('15 integrantes')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Más integrantes' }).props.accessibilityState.disabled).toBe(true);
  });

  it('en la cuota solo caben dígitos', async () => {
    await abrir();

    await fireEvent.changeText(campoCuota(), '$ 1,250 pesos');

    expect(campoCuota().props.value).toBe('$1250');
  });

  it('una cuota de cero o un nombre de solo espacios no dejan crear', async () => {
    await abrir();

    await llenar('Los del mercado', '0');
    expect(boton().props.accessibilityState.disabled).toBe(true);

    await llenar('   ', '600');
    expect(boton().props.accessibilityState.disabled).toBe(true);
  });

  it('el peso está elegido y los dólares todavía no se pueden elegir', async () => {
    await abrir();

    const pesos = screen.getByRole('radio', { name: 'Pesos' });
    const dolares = screen.getByRole('radio', { name: 'Dólares, próximamente' });
    await fireEvent.press(dolares);

    expect(pesos.props.accessibilityState.selected).toBe(true);
    expect(dolares.props.accessibilityState.selected).toBe(false);
    expect(dolares.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText(/dólares estarán disponibles pronto/)).toBeTruthy();
  });

  it('al crear manda lo elegido, con el nombre sin espacios de sobra', async () => {
    const { crear } = await abrir();
    await llenar('  Los del mercado  ', '600');

    await fireEvent.press(boton());

    expect(crear).toHaveBeenCalledTimes(1);
    expect(crear).toHaveBeenCalledWith({
      nombre: 'Los del mercado',
      integrantes: 10,
      cuota: 600,
      moneda: 'pesos',
    });
  });

  it('si la persona cancela la confirmación no muestra ningún aviso y puede reintentar', async () => {
    await abrir(async () => ({ ok: false, motivo: 'cancelada' }));
    await llenar();

    await fireEvent.press(boton());

    expect(screen.queryByRole('alert')).toBeNull();
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si falla avisa, conserva lo escrito y deja reintentar', async () => {
    await abrir(async () => ({ ok: false, motivo: 'error' }));
    await llenar();

    await fireEvent.press(boton());

    expect(
      await screen.findByText('No pudimos crear tu círculo. Revisa tu conexión e inténtalo de nuevo.'),
    ).toBeTruthy();
    expect(campoNombre().props.value).toBe('Los del mercado');
    expect(campoCuota().props.value).toBe('$600');
    expect(boton().props.accessibilityState.disabled).toBe(false);
  });

  it('si la creación lanza un error lo trata como un fallo y no se rompe', async () => {
    await abrir(async () => {
      throw new Error('fallo del sistema');
    });
    await llenar();

    await fireEvent.press(boton());

    expect(await screen.findByText(/No pudimos crear tu círculo/)).toBeTruthy();
  });

  it('el aviso desaparece al corregir lo escrito', async () => {
    await abrir(async () => ({ ok: false, motivo: 'error' }));
    await llenar();
    await fireEvent.press(boton());
    await screen.findByText(/No pudimos crear tu círculo/);

    await fireEvent.changeText(campoCuota(), '650');

    expect(screen.queryByText(/No pudimos crear tu círculo/)).toBeNull();
  });

  it('mientras crea no deja crear dos veces', async () => {
    let terminar: (resultado: ResultadoDeCreacion) => void = () => {};
    const { crear } = await abrir(
      () => new Promise<ResultadoDeCreacion>((resolver) => (terminar = resolver)),
    );
    await llenar();

    await fireEvent.press(boton());
    expect(screen.getByText('Creando…')).toBeTruthy();
    await fireEvent.press(boton());

    expect(crear).toHaveBeenCalledTimes(1);

    await act(async () => terminar({ ok: true, enFormacion: formacionDeEjemplo() }));
    expect(screen.getByText('Crear e invitar')).toBeTruthy();
  });

  it('"Volver" regresa sin crear', async () => {
    const { crear, onVolver } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(onVolver).toHaveBeenCalledTimes(1);
    expect(crear).not.toHaveBeenCalled();
  });
});
