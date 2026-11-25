import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Aviso } from './PilaDeAvisos';
import { PilaDeAvisos } from './PilaDeAvisos';

function aviso(id: string, negrita: string, cambios: Partial<Aviso> = {}): Aviso {
  return {
    id,
    etiqueta: `Aviso ${negrita}`,
    antes: 'Estás formando ',
    negrita,
    despues: ' · Faltan 3 personas',
    onPress: jest.fn(),
    ...cambios,
  };
}

type Nodo = { type: string; props: Record<string, unknown>; children?: Nodo[] | null };

// Cuenta las tarjetas "de relleno" que asoman detrás de la de enfrente: son vistas
// decorativas que no reciben toques.
function contarCapas(nodo: Nodo | Nodo[] | null): number {
  if (nodo === null) {
    return 0;
  }
  if (Array.isArray(nodo)) {
    return nodo.reduce((total, n) => total + contarCapas(n), 0);
  }
  const esCapa = nodo.type === 'View' && nodo.props.pointerEvents === 'none';
  return (esCapa ? 1 : 0) + (nodo.children ?? []).reduce((total, n) => total + contarCapas(n), 0);
}

const capas = () => contarCapas(screen.toJSON() as Nodo | Nodo[] | null);

describe('PilaDeAvisos', () => {
  it('sin avisos no dibuja nada', async () => {
    await render(<PilaDeAvisos avisos={[]} />);

    expect(screen.toJSON()).toBeNull();
  });

  describe('con un solo aviso', () => {
    it('es una tarjeta con su texto armado de principio a fin', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', '«Los del mercado»')]} />);

      expect(screen.getByText(/Estás formando.*«Los del mercado».*Faltan 3 personas/)).toBeTruthy();
    });

    it('al tocarla abre ese aviso, sin pasar por ninguna pila', async () => {
      const uno = aviso('a', 'Uno');
      await render(<PilaDeAvisos avisos={[uno]} />);

      await fireEvent.press(screen.getByRole('button', { name: 'Aviso Uno' }));

      expect(uno.onPress).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Mostrar menos')).toBeNull();
    });
  });

  describe('con varios avisos', () => {
    const tres = () => [aviso('a', 'Uno'), aviso('b', 'Dos'), aviso('c', 'Tres')];

    it('cerrada, se ve solo el aviso de enfrente y se dice cuántos hay', async () => {
      await render(<PilaDeAvisos avisos={tres()} />);

      expect(screen.getByText(/Uno/)).toBeTruthy();
      expect(screen.queryByText(/Dos/)).toBeNull();
      expect(screen.queryByText(/Tres/)).toBeNull();
      expect(screen.getByRole('button', { name: '3 avisos. Toca para ver todos.' })).toBeTruthy();
    });

    it('tocarla cerrada no abre ningún aviso: primero los despliega todos', async () => {
      const avisos = tres();
      await render(<PilaDeAvisos avisos={avisos} />);

      await fireEvent.press(screen.getByRole('button', { name: '3 avisos. Toca para ver todos.' }));

      expect(avisos.every((a) => (a.onPress as jest.Mock).mock.calls.length === 0)).toBe(true);
      expect(screen.getByText(/Uno/)).toBeTruthy();
      expect(screen.getByText(/Dos/)).toBeTruthy();
      expect(screen.getByText(/Tres/)).toBeTruthy();
      expect(screen.getByText('Mostrar menos')).toBeTruthy();
    });

    it('desplegada, tocar un aviso lo abre y la pila se vuelve a cerrar', async () => {
      const avisos = tres();
      await render(<PilaDeAvisos avisos={avisos} />);
      await fireEvent.press(screen.getByRole('button', { name: '3 avisos. Toca para ver todos.' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Aviso Dos' }));

      expect(avisos[1].onPress).toHaveBeenCalledTimes(1);
      expect(avisos[0].onPress).not.toHaveBeenCalled();
      expect(screen.queryByText('Mostrar menos')).toBeNull();
      expect(screen.getByRole('button', { name: '3 avisos. Toca para ver todos.' })).toBeTruthy();
    });

    it('"Mostrar menos" cierra la pila sin abrir nada', async () => {
      const avisos = tres();
      await render(<PilaDeAvisos avisos={avisos} />);
      await fireEvent.press(screen.getByRole('button', { name: '3 avisos. Toca para ver todos.' }));

      await fireEvent.press(screen.getByText('Mostrar menos'));

      expect(screen.queryByText(/Dos/)).toBeNull();
      expect(avisos.every((a) => (a.onPress as jest.Mock).mock.calls.length === 0)).toBe(true);
    });

    it('tocar afuera de las tarjetas también cierra la pila', async () => {
      await render(<PilaDeAvisos avisos={tres()} />);
      await fireEvent.press(screen.getByRole('button', { name: '3 avisos. Toca para ver todos.' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Cerrar los avisos' }));

      expect(screen.queryByText('Mostrar menos')).toBeNull();
      expect(screen.queryByText(/Dos/)).toBeNull();
    });

    it('las tarjetas que asoman detrás son una menos que los avisos, y como mucho dos', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', 'Uno'), aviso('b', 'Dos')]} />);
      expect(capas()).toBe(1);
    });

    it('con tres avisos asoman dos capas, y con cinco siguen siendo dos', async () => {
      const { rerender } = await render(<PilaDeAvisos avisos={tres()} />);
      expect(capas()).toBe(2);

      await rerender(
        <PilaDeAvisos
          avisos={[
            aviso('a', 'Uno'),
            aviso('b', 'Dos'),
            aviso('c', 'Tres'),
            aviso('d', 'Cuatro'),
            aviso('e', 'Cinco'),
          ]}
        />,
      );
      expect(capas()).toBe(2);
    });

    it('un solo aviso no lleva capas detrás', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} />);

      expect(capas()).toBe(0);
    });

    it('el de enfrente es el primero de la lista', async () => {
      await render(<PilaDeAvisos avisos={[aviso('x', 'Primero'), aviso('y', 'Segundo')]} />);

      expect(screen.getByText(/Primero/)).toBeTruthy();
      expect(screen.queryByText(/Segundo/)).toBeNull();
    });

    it('si quedan menos de dos avisos deja de ser pila, aunque estuviera desplegada', async () => {
      const { rerender } = await render(<PilaDeAvisos avisos={tres()} />);
      await fireEvent.press(screen.getByRole('button', { name: '3 avisos. Toca para ver todos.' }));

      await rerender(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} />);

      expect(screen.queryByText('Mostrar menos')).toBeNull();
      expect(screen.queryByRole('button', { name: /avisos\. Toca para ver todos/ })).toBeNull();
      expect(screen.getByRole('button', { name: 'Aviso Uno' })).toBeTruthy();
    });

    it('con más de tres avisos solo se ven tres capas, pero al abrirla están todos', async () => {
      const cinco = [
        aviso('a', 'Uno'),
        aviso('b', 'Dos'),
        aviso('c', 'Tres'),
        aviso('d', 'Cuatro'),
        aviso('e', 'Cinco'),
      ];
      await render(<PilaDeAvisos avisos={cinco} />);
      expect(screen.getByRole('button', { name: '5 avisos. Toca para ver todos.' })).toBeTruthy();

      await fireEvent.press(screen.getByRole('button', { name: '5 avisos. Toca para ver todos.' }));

      for (const nombre of ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco']) {
        expect(screen.getByText(new RegExp(nombre))).toBeTruthy();
      }
    });
  });

  describe('duran 6 segundos', () => {
    const DURACION = 6000;

    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    async function pasar(ms: number) {
      await act(async () => {
        jest.advanceTimersByTime(ms);
      });
    }

    it('por defecto duran 6 segundos: a los 5 todavía están y a los 6 ya no', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} />);

      await pasar(DURACION - 1);
      expect(screen.getByText(/Uno/)).toBeTruthy();

      await pasar(1);
      expect(screen.queryByText(/Uno/)).toBeNull();
    });

    it('al quitarse avisa cuáles ya se mostraron', async () => {
      const onMostrados = jest.fn();
      await render(
        <PilaDeAvisos avisos={[aviso('a', 'Uno'), aviso('b', 'Dos')]} onMostrados={onMostrados} />,
      );
      expect(onMostrados).not.toHaveBeenCalled();

      await pasar(DURACION);

      expect(onMostrados).toHaveBeenCalledTimes(1);
      expect(onMostrados).toHaveBeenCalledWith(['a', 'b']);
    });

    it('al quitarse queda un distintivo con cuántos avisos hay, en singular y plural', async () => {
      const { rerender } = await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} />);
      await pasar(DURACION);
      expect(screen.getByText('1 aviso')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Ver 1 aviso' })).toBeTruthy();

      await rerender(<PilaDeAvisos avisos={[aviso('a', 'Uno'), aviso('b', 'Dos')]} mostrados={['a', 'b']} />);
      await pasar(DURACION);
      expect(screen.getByText('2 avisos')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Ver 2 avisos' })).toBeTruthy();
    });

    it('el distintivo los vuelve a sacar y se quitan otra vez a los 6 segundos', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} />);
      await pasar(DURACION);

      await fireEvent.press(screen.getByRole('button', { name: 'Ver 1 aviso' }));
      expect(screen.getByText(/Uno/)).toBeTruthy();
      expect(screen.queryByText('1 aviso')).toBeNull();

      await pasar(DURACION);
      expect(screen.queryByText(/Uno/)).toBeNull();
      expect(screen.getByText('1 aviso')).toBeTruthy();
    });

    it('la duración se puede cambiar', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} duracionMs={1000} />);

      await pasar(999);
      expect(screen.getByText(/Uno/)).toBeTruthy();
      await pasar(1);
      expect(screen.queryByText(/Uno/)).toBeNull();
    });

    it('si el aviso ya se había mostrado, no sale solo: solo el distintivo', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} mostrados={['a']} />);

      expect(screen.queryByText(/Uno/)).toBeNull();
      expect(screen.getByRole('button', { name: 'Ver 1 aviso' })).toBeTruthy();
    });

    it('si llega un aviso nuevo, la pila vuelve a salir aunque estuviera quitada', async () => {
      const { rerender } = await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} mostrados={['a']} />);
      expect(screen.queryByText(/Uno/)).toBeNull();

      await rerender(
        <PilaDeAvisos avisos={[aviso('a', 'Uno'), aviso('b', 'Dos')]} mostrados={['a']} />,
      );

      expect(screen.getByText(/Uno/)).toBeTruthy();
      expect(screen.getByRole('button', { name: '2 avisos. Toca para ver todos.' })).toBeTruthy();
    });

    it('que cambie el texto de un aviso no reinicia sus 6 segundos', async () => {
      const { rerender } = await render(<PilaDeAvisos avisos={[aviso('a', 'Uno')]} />);
      await pasar(3000);

      await rerender(
        <PilaDeAvisos avisos={[aviso('a', 'Uno', { despues: ' · Faltan 2 personas' })]} />,
      );
      await pasar(3000);

      expect(screen.queryByText(/Uno/)).toBeNull();
    });

    it('mientras la pila está abierta no se quita, y al cerrarla vuelve a contar 6 segundos', async () => {
      await render(<PilaDeAvisos avisos={[aviso('a', 'Uno'), aviso('b', 'Dos')]} />);
      await fireEvent.press(screen.getByRole('button', { name: '2 avisos. Toca para ver todos.' }));

      await pasar(DURACION * 3);
      expect(screen.getByText(/Dos/)).toBeTruthy();

      await fireEvent.press(screen.getByText('Mostrar menos'));
      await pasar(DURACION - 1);
      expect(screen.getByText(/Uno/)).toBeTruthy();
      await pasar(1);
      expect(screen.queryByText(/Uno/)).toBeNull();
    });

    it('tocar un aviso lo abre y cuenta como mostrado', async () => {
      const uno = aviso('a', 'Uno');
      const onMostrados = jest.fn();
      await render(<PilaDeAvisos avisos={[uno]} onMostrados={onMostrados} />);

      await fireEvent.press(screen.getByRole('button', { name: 'Aviso Uno' }));

      expect(uno.onPress).toHaveBeenCalledTimes(1);
      expect(onMostrados).toHaveBeenCalledWith(['a']);
    });

    it('tocar un aviso de la pila abierta también cuenta como mostrado', async () => {
      const onMostrados = jest.fn();
      await render(
        <PilaDeAvisos avisos={[aviso('a', 'Uno'), aviso('b', 'Dos')]} onMostrados={onMostrados} />,
      );
      await fireEvent.press(screen.getByRole('button', { name: '2 avisos. Toca para ver todos.' }));

      await fireEvent.press(screen.getByRole('button', { name: 'Aviso Dos' }));

      expect(onMostrados).toHaveBeenCalledWith(['a', 'b']);
    });

    it('si no hay avisos no hay ni pila ni distintivo', async () => {
      await render(<PilaDeAvisos avisos={[]} />);
      await pasar(DURACION);

      expect(screen.toJSON()).toBeNull();
    });
  });
});
