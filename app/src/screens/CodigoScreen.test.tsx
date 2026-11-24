import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CodigoScreen } from './CodigoScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

const ETIQUETA_CAMPO = 'Código de 6 dígitos';

type Opciones = {
  onVerificar?: (codigo: string) => Promise<boolean>;
  segundosParaReenviar?: number;
};

async function abrirPantalla({ onVerificar, segundosParaReenviar }: Opciones = {}) {
  const verificar = jest.fn(onVerificar ?? (async () => true));
  const onReenviar = jest.fn();
  const onCambiarNumero = jest.fn();
  await render(
    <CodigoScreen
      telefono="5512345678"
      onVerificar={verificar}
      onReenviar={onReenviar}
      onCambiarNumero={onCambiarNumero}
      segundosParaReenviar={segundosParaReenviar}
    />,
  );
  return { verificar, onReenviar, onCambiarNumero };
}

const campo = () => screen.getByLabelText(ETIQUETA_CAMPO);
const botonContinuar = () => screen.getByRole('button', { name: /Continuar|Verificando/ });

async function escribir(texto: string) {
  await fireEvent.changeText(campo(), texto);
}

describe('CodigoScreen', () => {
  it('dice a qué teléfono se mandó el código y arranca vacío', async () => {
    await abrirPantalla();

    expect(screen.getByText('Te lo mandamos por WhatsApp al 55 1234 5678')).toBeTruthy();
    expect(campo().props.value).toBe('');
    expect(botonContinuar().props.accessibilityState.disabled).toBe(true);
  });

  it('muestra cada dígito en su casilla', async () => {
    await abrirPantalla();

    await escribir('4927');

    // Las casillas se ocultan a propósito de los lectores de pantalla (el campo
    // ya lo dice todo), por eso hay que pedir los elementos ocultos.
    for (const digito of ['4', '9', '2', '7']) {
      expect(screen.getByText(digito, { includeHiddenElements: true })).toBeTruthy();
    }
  });

  it('con el código incompleto no se puede continuar', async () => {
    const { verificar } = await abrirPantalla();

    await escribir('49271');
    await fireEvent.press(botonContinuar());

    expect(botonContinuar().props.accessibilityState.disabled).toBe(true);
    expect(verificar).not.toHaveBeenCalled();
  });

  it('entrega el código limpio aunque se pegue con espacios', async () => {
    const { verificar } = await abrirPantalla();

    await escribir('492 716');
    await fireEvent.press(botonContinuar());

    expect(verificar).toHaveBeenCalledTimes(1);
    expect(verificar).toHaveBeenCalledWith('492716');
  });

  it('el botón del teclado también verifica con el código completo', async () => {
    const { verificar } = await abrirPantalla();

    await escribir('492716');
    await fireEvent(campo(), 'submitEditing');

    expect(verificar).toHaveBeenCalledWith('492716');
  });

  it('con un código equivocado avisa y limpia las casillas', async () => {
    await abrirPantalla({ onVerificar: async () => false });

    await escribir('111111');
    await fireEvent.press(botonContinuar());

    expect(
      await screen.findByText('Ese código no es correcto. Revísalo e inténtalo de nuevo.'),
    ).toBeTruthy();
    expect(campo().props.value).toBe('');
  });

  it('si no se pudo verificar lo dice distinto y conserva lo escrito', async () => {
    await abrirPantalla({
      onVerificar: async () => {
        throw new Error('sin conexión');
      },
    });

    await escribir('492716');
    await fireEvent.press(botonContinuar());

    expect(
      await screen.findByText(
        'No pudimos verificar el código. Revisa tu conexión e inténtalo de nuevo.',
      ),
    ).toBeTruthy();
    expect(campo().props.value).toBe('492716');
    // Lo escrito se conserva y se puede volver a intentar.
    expect(botonContinuar().props.accessibilityState.disabled).toBe(false);
  });

  it('el aviso de error desaparece al volver a escribir', async () => {
    await abrirPantalla({ onVerificar: async () => false });
    await escribir('111111');
    await fireEvent.press(botonContinuar());
    await screen.findByText(/no es correcto/);

    await escribir('2');

    expect(screen.queryByText(/no es correcto/)).toBeNull();
  });

  it('mientras verifica no deja mandar el código dos veces', async () => {
    let terminar: (correcto: boolean) => void = () => {};
    const { verificar } = await abrirPantalla({
      onVerificar: () => new Promise<boolean>((resolver) => (terminar = resolver)),
    });

    await escribir('492716');
    await fireEvent.press(botonContinuar());
    expect(screen.getByText('Verificando…')).toBeTruthy();
    await fireEvent.press(botonContinuar());
    await fireEvent(campo(), 'submitEditing');

    expect(verificar).toHaveBeenCalledTimes(1);

    await act(async () => terminar(true));
    expect(screen.getByText('Continuar')).toBeTruthy();
  });

  it('"Cambiar número" regresa a la pantalla del teléfono', async () => {
    const { onCambiarNumero } = await abrirPantalla();

    await fireEvent.press(screen.getByText('Cambiar número'));

    expect(onCambiarNumero).toHaveBeenCalledTimes(1);
  });
});

describe('CodigoScreen: reenvío', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  async function avanzar(segundos: number) {
    await act(async () => {
      jest.advanceTimersByTime(segundos * 1000);
    });
  }

  it('cuenta hacia atrás y no deja reenviar mientras tanto', async () => {
    await abrirPantalla({ segundosParaReenviar: 60 });
    expect(screen.getByText(/Reenviar en 1:00/)).toBeTruthy();

    await avanzar(18);

    expect(screen.getByText(/Reenviar en 0:42/)).toBeTruthy();
    expect(screen.queryByText('Reenviar código')).toBeNull();
  });

  it('al terminar la cuenta permite reenviar y la reinicia', async () => {
    const { onReenviar } = await abrirPantalla({ segundosParaReenviar: 30 });

    await avanzar(30);
    await fireEvent.press(screen.getByText('Reenviar código'));

    expect(onReenviar).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Reenviar en 0:30/)).toBeTruthy();
    expect(screen.queryByText('Reenviar código')).toBeNull();
  });

  it('al reenviar se limpian las casillas', async () => {
    await abrirPantalla({ segundosParaReenviar: 5 });
    await escribir('4927');

    await avanzar(5);
    await fireEvent.press(screen.getByText('Reenviar código'));

    expect(campo().props.value).toBe('');
  });
});
