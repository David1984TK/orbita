import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CirculoEnFormacion, MiCirculo } from '../domain';
import { arrancarCirculo } from '../domain';
import { circuloDeEjemplo, formacionDeEjemplo } from '../servicios/circulos';
import { CirculosScreen } from './CirculosScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// El círculo de ejemplo ("Los del mercado", 15 personas, semana 6, yo pendiente) y
// otro, ya arrancado, de 5 personas ("Las del taller", semana 1, yo pendiente).
function delTaller(): MiCirculo {
  const formacion = formacionDeEjemplo({
    id: 'las-del-taller',
    nombre: 'Las del taller',
    integrantes: 5,
    cuotaSemanal: 500,
    participantes: [
      { id: 'yo', nombre: 'David Nava' },
      { id: 'a', nombre: 'Rosa Martínez' },
      { id: 'b', nombre: 'Julio Lara' },
      { id: 'c', nombre: 'Ana Torres' },
      { id: 'd', nombre: 'Carmen Ruiz' },
    ],
  });
  return arrancarCirculo(formacion, { yo: 4, a: 1, b: 2, c: 3, d: 5 }, '2026-12-07');
}

type Opciones = {
  activos?: MiCirculo[];
  actualId?: string | null;
  enFormacion?: CirculoEnFormacion[];
};

async function abrir({
  activos = [circuloDeEjemplo(), delTaller()],
  actualId = 'los-del-mercado',
  enFormacion = [],
}: Opciones = {}) {
  const onElegir = jest.fn();
  const onVerFormacion = jest.fn();
  const onCrear = jest.fn();
  const onVolver = jest.fn();
  await render(
    <CirculosScreen
      activos={activos}
      actualId={actualId}
      enFormacion={enFormacion}
      onElegir={onElegir}
      onVerFormacion={onVerFormacion}
      onCrear={onCrear}
      onVolver={onVolver}
    />,
  );
  return { onElegir, onVerFormacion, onCrear, onVolver };
}

describe('CirculosScreen', () => {
  it('lista los círculos en curso con su semana y su cuota', async () => {
    await abrir();

    expect(screen.getByText('Mis círculos')).toBeTruthy();
    expect(screen.getByText('EN CURSO')).toBeTruthy();
    expect(screen.getByText('Los del mercado')).toBeTruthy();
    expect(screen.getByText('Semana 6 de 15 · $600 cada semana')).toBeTruthy();
    expect(screen.getByText('Las del taller')).toBeTruthy();
    expect(screen.getByText('Semana 1 de 5 · $500 cada semana')).toBeTruthy();
  });

  it('cada círculo dice cómo va la persona con su cuota', async () => {
    await abrir();

    // En ambos le falta aportar la cuota de la semana.
    expect(screen.getAllByText('Pendiente')).toHaveLength(2);
  });

  it('un círculo atrasado se marca con los días de atraso', async () => {
    const atrasado = circuloDeEjemplo();
    atrasado.circulo.integrantes = atrasado.circulo.integrantes.map((i) =>
      i.id === atrasado.yoId ? { ...i, estado: 'atrasado', diasDeAtraso: 2 } : i,
    );

    await abrir({ activos: [atrasado], actualId: 'los-del-mercado' });

    expect(screen.getByText('2 días tarde')).toBeTruthy();
  });

  it('marca cuál es el que se está viendo, para los lectores de pantalla', async () => {
    await abrir({ actualId: 'las-del-taller' });

    expect(screen.getByRole('button', { name: /Las del taller.*Es el que estás viendo/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Las del taller/ }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: /Los del mercado/ }).props.accessibilityState.selected).toBe(false);
    expect(screen.queryByRole('button', { name: /Los del mercado.*Es el que estás viendo/ })).toBeNull();
  });

  it('al tocar un círculo lo elige', async () => {
    const { onElegir } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: /Las del taller/ }));

    expect(onElegir).toHaveBeenCalledTimes(1);
    expect(onElegir).toHaveBeenCalledWith('las-del-taller');
  });

  it('también deja elegir el que ya se está viendo', async () => {
    const { onElegir } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: /Los del mercado/ }));

    expect(onElegir).toHaveBeenCalledWith('los-del-mercado');
  });

  describe('los que se están llenando', () => {
    const formando = () =>
      formacionDeEjemplo({ id: 'nuevo', nombre: 'Las del barrio', cuotaSemanal: 300 });

    it('van aparte, con cuánto falta', async () => {
      await abrir({ enFormacion: [formando()] });

      expect(screen.getByText('SE ESTÁN LLENANDO')).toBeTruthy();
      expect(screen.getByText('Las del barrio')).toBeTruthy();
      expect(screen.getByText('Faltan 9 personas · $300 cada semana')).toBeTruthy();
      expect(screen.getByText('En formación')).toBeTruthy();
    });

    it('al tocar uno pide verlo, no lo elige como círculo en curso', async () => {
      const { onVerFormacion, onElegir } = await abrir({ enFormacion: [formando()] });

      await fireEvent.press(screen.getByRole('button', { name: /Las del barrio/ }));

      expect(onVerFormacion).toHaveBeenCalledWith('nuevo');
      expect(onElegir).not.toHaveBeenCalled();
    });

    it('si ya se llenó dice que arrancó', async () => {
      const lleno = formacionDeEjemplo({ id: 'lleno', nombre: 'Las del barrio', integrantes: 5, participantes: delTaller().circulo.integrantes.map((i) => ({ id: i.id, nombre: i.nombre })) });

      await abrir({ enFormacion: [lleno] });

      expect(screen.getByText('Ya arrancó')).toBeTruthy();
      expect(screen.queryByText('En formación')).toBeNull();
    });

    it('sin círculos en formación no hay esa sección', async () => {
      await abrir({ enFormacion: [] });

      expect(screen.queryByText('SE ESTÁN LLENANDO')).toBeNull();
    });
  });

  it('sin círculos en curso no hay esa sección, y solo aparecen los que se llenan', async () => {
    await abrir({
      activos: [],
      actualId: null,
      enFormacion: [formacionDeEjemplo({ id: 'nuevo', nombre: 'Las del barrio' })],
    });

    expect(screen.queryByText('EN CURSO')).toBeNull();
    expect(screen.getByText('SE ESTÁN LLENANDO')).toBeTruthy();
  });

  it('sin ningún círculo lo dice', async () => {
    await abrir({ activos: [], actualId: null, enFormacion: [] });

    expect(screen.getByText('Todavía no estás en ningún círculo.')).toBeTruthy();
  });

  it('"Crear un círculo" abre la creación', async () => {
    const { onCrear } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Crear un círculo' }));

    expect(onCrear).toHaveBeenCalledTimes(1);
  });

  it('"Volver" regresa sin elegir', async () => {
    const { onVolver, onElegir } = await abrir();

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(onVolver).toHaveBeenCalledTimes(1);
    expect(onElegir).not.toHaveBeenCalled();
  });
});
