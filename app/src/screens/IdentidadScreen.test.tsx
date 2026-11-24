import { fireEvent, render, screen } from '@testing-library/react-native';
import { IdentidadScreen } from './IdentidadScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

async function abrirPantalla() {
  const onTomarFoto = jest.fn();
  await render(<IdentidadScreen onTomarFoto={onTomarFoto} />);
  return { onTomarFoto };
}

describe('IdentidadScreen', () => {
  it('dice sin rodeos por qué se pide y que es una sola vez', async () => {
    await abrirPantalla();

    expect(screen.getByText('Tu identidad')).toBeTruthy();
    expect(
      screen.getByText('La ley lo pide para mover dinero. Se hace una sola vez.'),
    ).toBeTruthy();
  });

  it('presenta los tres pasos con su explicación', async () => {
    await abrirPantalla();

    expect(screen.getByText('Foto de tu INE')).toBeTruthy();
    expect(screen.getByText('Por delante y por detrás')).toBeTruthy();
    expect(screen.getByText('Una selfie')).toBeTruthy();
    expect(screen.getByText('Para confirmar que eres tú')).toBeTruthy();
    expect(screen.getByText('Tu domicilio')).toBeTruthy();
    expect(screen.getByText('Solo el que aparece en tu INE')).toBeTruthy();
  });

  it('avisa que los documentos no los ve el grupo', async () => {
    await abrirPantalla();

    expect(screen.getByText(/No se comparten con los demás integrantes de tu círculo/)).toBeTruthy();
  });

  it('el progreso se lee como paso 1 de 3 para los lectores de pantalla', async () => {
    await abrirPantalla();

    expect(screen.getByLabelText('Paso 1 de 3')).toBeTruthy();
  });

  it('"Tomar foto de mi INE" avisa que se quiere empezar', async () => {
    const { onTomarFoto } = await abrirPantalla();

    await fireEvent.press(screen.getByRole('button', { name: 'Tomar foto de mi INE' }));

    expect(onTomarFoto).toHaveBeenCalledTimes(1);
  });

  it('no usa las palabras que están prohibidas en el producto', async () => {
    await abrirPantalla();

    expect(screen.queryByText(/tanda|cundina|caja de ahorro|seguro/i)).toBeNull();
  });
});
