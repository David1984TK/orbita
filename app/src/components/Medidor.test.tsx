import { render, screen } from '@testing-library/react-native';
import { Medidor } from './Medidor';
import { trazoDeArco } from './ruedaGeometria';

// El medidor mide 200 de lado: centro (100, 100) y radio 88 (200 / 2 − 12 de grosor).
// Empieza abajo a la izquierda (225°) y da tres cuartos de vuelta (270°).
const arco = (hasta: number) => trazoDeArco(100, 100, 88, 225, hasta);

type Nodo = { type: string; props: Record<string, unknown>; children?: Nodo[] | null };

// Junta, en orden, el trazo (`d`) de cada <Path> que dibujó el medidor.
function trazosDe(nodo: Nodo | Nodo[] | null): string[] {
  if (nodo === null) {
    return [];
  }
  if (Array.isArray(nodo)) {
    return nodo.flatMap(trazosDe);
  }
  const propios = nodo.type === 'RNSVGPath' ? [nodo.props.d as string] : [];
  return [...propios, ...(nodo.children ?? []).flatMap(trazosDe)];
}

async function abrir(fraccion: number) {
  await render(<Medidor fraccion={fraccion} valor="340" etiqueta="Básico" descripcion="Nivel Básico" />);
  return trazosDe(screen.toJSON() as Nodo | Nodo[] | null);
}

describe('Medidor', () => {
  it('muestra el valor, la etiqueta y una descripción para los lectores de pantalla', async () => {
    await abrir(0.34);

    expect(screen.getByText('340')).toBeTruthy();
    expect(screen.getByText('Básico')).toBeTruthy();
    expect(screen.getByLabelText('Nivel Básico')).toBeTruthy();
  });

  it('dibuja el fondo de tres cuartos de vuelta, abierto por abajo', async () => {
    const trazos = await abrir(0.34);

    expect(trazos[0]).toBe(arco(495));
  });

  it('el tramo lleno es la fracción de esos tres cuartos de vuelta', async () => {
    const trazos = await abrir(0.5);

    expect(trazos).toHaveLength(2);
    expect(trazos[1]).toBe(arco(225 + 135));
  });

  it('con la fracción en cero no dibuja tramo lleno', async () => {
    const trazos = await abrir(0);

    expect(trazos).toHaveLength(1);
  });

  it('con la fracción completa llena todo el medidor, y no se pasa si la fracción se sale', async () => {
    expect((await abrir(1))[1]).toBe(arco(495));
  });

  it('una fracción mayor que 1 se trata como 1', async () => {
    expect((await abrir(3))[1]).toBe(arco(495));
  });
});
