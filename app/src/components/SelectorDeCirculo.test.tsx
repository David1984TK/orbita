import { fireEvent, render, screen } from '@testing-library/react-native';
import { PastillaDeCirculo, TituloDeCirculo } from './SelectorDeCirculo';

describe('TituloDeCirculo', () => {
  it('sin lista que abrir es solo un título: no es un botón ni lleva flecha', async () => {
    await render(<TituloDeCirculo nombre="Los del mercado" />);

    expect(screen.getByRole('header', { name: 'Los del mercado' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('⌄')).toBeNull();
  });

  it('con lista que abrir es un botón con flecha que dice que cambia de círculo', async () => {
    const abrir = jest.fn();
    await render(<TituloDeCirculo nombre="Los del mercado" onAbrirLista={abrir} />);

    expect(screen.getByText('⌄')).toBeTruthy();
    expect(screen.getByText('Los del mercado')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Los del mercado. Cambiar de círculo.' }));

    expect(abrir).toHaveBeenCalledTimes(1);
  });
});

describe('PastillaDeCirculo', () => {
  it('muestra el nombre con flecha y abre la lista al tocarla', async () => {
    const abrir = jest.fn();
    await render(<PastillaDeCirculo nombre="Las del taller" onAbrirLista={abrir} />);

    expect(screen.getByText('Las del taller')).toBeTruthy();
    expect(screen.getByText('⌄')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Las del taller. Cambiar de círculo.' }));

    expect(abrir).toHaveBeenCalledTimes(1);
  });
});
