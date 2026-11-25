import { render, screen } from '@testing-library/react-native';
import type { EstadoPago, MiCirculo } from '../domain';
import { circuloDeEjemplo } from '../servicios/circulos';
import { GrupoScreen } from './GrupoScreen';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// El círculo de ejemplo: 15 personas, semana 6. Cobra Rosa Martínez (turno 6),
// Carmen Ruiz va 3 días tarde, yo (David Nava, turno 12) tengo pendiente la
// cuota de esta semana y las demás van al día.
async function abrir(miCirculo: MiCirculo = circuloDeEjemplo()) {
  await render(<GrupoScreen miCirculo={miCirculo} />);
}

function conEstados(cambios: Record<string, { estado: EstadoPago; diasDeAtraso?: number }>): MiCirculo {
  const base = circuloDeEjemplo();
  return {
    ...base,
    circulo: {
      ...base.circulo,
      integrantes: base.circulo.integrantes.map((i) => ({ ...i, ...(cambios[i.id] ?? {}) })),
    },
  };
}

describe('GrupoScreen', () => {
  it('encabeza con la semana y cuántas personas van al día', async () => {
    await abrir();

    expect(screen.getByText('El grupo')).toBeTruthy();
    expect(screen.getByText('Semana 6 · 13 al día, 1 pendiente, 1 atrasado')).toBeTruthy();
  });

  it('dice quién cobra esta semana', async () => {
    await abrir();

    expect(screen.getByText('COBRA ESTA SEMANA')).toBeTruthy();
    expect(screen.getByText('Turno 6 de 15')).toBeTruthy();
    expect(screen.getByText('Cobrando')).toBeTruthy();
  });

  it('lista a las 15 integrantes con su turno', async () => {
    await abrir();

    expect(screen.getByText('LOS 15 INTEGRANTES')).toBeTruthy();
    expect(screen.getByText('Julio Lara')).toBeTruthy();
    expect(screen.getByText('Turno 7')).toBeTruthy();
    expect(screen.getByText('Luis Cano')).toBeTruthy();
    expect(screen.getByText('Turno 15')).toBeTruthy();
  });

  it('en la lista me llama "Tú" y no usa mi nombre', async () => {
    await abrir();

    expect(screen.getByText('Tú')).toBeTruthy();
    expect(screen.getByText('Turno 12')).toBeTruthy();
    expect(screen.queryByText('David Nava')).toBeNull();
  });

  it('pone primero a la persona y luego a las demás por turno', async () => {
    await abrir();

    const nombres = screen
      .getAllByText(/^(Tú|Marcos Díaz|Lucía Ortega|Julio Lara|Luis Cano)$/)
      .map((n) => n.props.children);

    expect(nombres).toEqual(['Tú', 'Marcos Díaz', 'Lucía Ortega', 'Julio Lara', 'Luis Cano']);
  });

  it('muestra las iniciales de cada quien', async () => {
    await abrir();

    // Las iniciales son decorativas y se ocultan a los lectores de pantalla.
    // Rosa sale dos veces: en "Cobra esta semana" y en la lista.
    expect(screen.getAllByText('RM', { includeHiddenElements: true })).toHaveLength(2);
    // Aunque en pantalla me llame "Tú", mis iniciales salen de mi nombre.
    expect(screen.getByText('DN', { includeHiddenElements: true })).toBeTruthy();
  });

  it('distingue al día, pendiente y atrasada con su etiqueta', async () => {
    await abrir();

    expect(screen.getAllByText('Al día')).toHaveLength(13);
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText('3 días tarde')).toBeTruthy();
  });

  it('cada fila se lee completa para los lectores de pantalla', async () => {
    await abrir();

    expect(screen.getByLabelText('Carmen Ruiz, Turno 8, 3 días tarde')).toBeTruthy();
    expect(screen.getByLabelText('Tú, Turno 12, Pendiente')).toBeTruthy();
  });

  it('si todas van al día lo dice y no hay etiquetas de atraso', async () => {
    await abrir(
      conEstados({ yo: { estado: 'alDia' }, 'integrante-8': { estado: 'alDia' } }),
    );

    expect(screen.getByText('Semana 6 · Todos al día')).toBeTruthy();
    expect(screen.queryByText(/días tarde/)).toBeNull();
    expect(screen.queryByText('Pendiente')).toBeNull();
  });

  it('si me toca cobrar a mí, la tarjeta de quien cobra dice "Tú"', async () => {
    const base = circuloDeEjemplo();
    const meToca: MiCirculo = {
      ...base,
      circulo: { ...base.circulo, semanaActual: 12 },
    };

    await abrir(meToca);

    expect(screen.getAllByText('Tú')).toHaveLength(2);
    expect(screen.getByText('Turno 12 de 15')).toBeTruthy();
  });

  it('si nadie tiene el turno de esta semana no inventa a quien cobra', async () => {
    const base = circuloDeEjemplo();
    const sinTurno: MiCirculo = {
      ...base,
      circulo: { ...base.circulo, semanaActual: 99 },
    };

    await abrir(sinTurno);

    expect(screen.queryByText('COBRA ESTA SEMANA')).toBeNull();
    expect(screen.getByText('LOS 15 INTEGRANTES')).toBeTruthy();
  });
});
