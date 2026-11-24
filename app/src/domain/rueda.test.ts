import type { Circulo, EstadoPago } from './circulo';
import {
  fechaDeSemana,
  miIntegrante,
  resumenDeAportes,
  resumenDeMiTurno,
  segmentosDeLaRueda,
} from './rueda';

// Círculo de 15 x $600. La semana 1 vence el lunes 26 de octubre de 2026, así
// que la semana 6 vence el 30 de noviembre y la 13 el 18 de enero de 2027.
function circulo(opciones: {
  semanaActual?: number;
  miTurno?: number;
  miEstado?: EstadoPago;
  misCuotas?: number;
} = {}): Circulo {
  const { semanaActual = 6, miTurno = 13, miEstado = 'pendiente', misCuotas = 5 } = opciones;
  return {
    id: 'los-del-mercado',
    nombre: 'Los del mercado',
    moneda: 'pesos',
    cuotaSemanal: 600,
    semanaActual,
    inicio: '2026-10-26',
    integrantes: Array.from({ length: 15 }, (_, i) => {
      const turno = i + 1;
      const soyYo = turno === miTurno;
      return {
        id: soyYo ? 'yo' : `integrante-${turno}`,
        nombre: soyYo ? 'Tú' : `Integrante ${turno}`,
        turno,
        estado: soyYo ? miEstado : 'alDia',
        cuotasPagadas: soyYo ? misCuotas : semanaActual,
      };
    }),
  };
}

describe('miIntegrante', () => {
  it('encuentra a la persona por su id', () => {
    expect(miIntegrante(circulo(), 'yo').turno).toBe(13);
  });

  it('lanza un error si la persona no está en el círculo', () => {
    expect(() => miIntegrante(circulo(), 'nadie')).toThrow(/nadie/);
  });
});

describe('fechaDeSemana', () => {
  it('la semana 1 vence el día de inicio y cada una siguiente 7 días después', () => {
    expect(fechaDeSemana(circulo(), 1)).toBe('2026-10-26');
    expect(fechaDeSemana(circulo(), 2)).toBe('2026-11-02');
    expect(fechaDeSemana(circulo(), 6)).toBe('2026-11-30');
    expect(fechaDeSemana(circulo(), 13)).toBe('2027-01-18');
  });
});

describe('segmentosDeLaRueda', () => {
  it('tiene un segmento por semana', () => {
    expect(segmentosDeLaRueda(circulo(), 'yo')).toHaveLength(15);
  });

  it('marca las semanas que ya empezaron, la tuya y las que faltan', () => {
    const segmentos = segmentosDeLaRueda(circulo({ semanaActual: 6, miTurno: 13 }), 'yo');

    expect(segmentos.slice(0, 6)).toEqual(Array(6).fill('cobraron'));
    expect(segmentos.slice(6, 12)).toEqual(Array(6).fill('faltan'));
    expect(segmentos[12]).toBe('tuTurno');
    expect(segmentos.slice(13)).toEqual(['faltan', 'faltan']);
  });

  it('tu turno se marca como tuyo aunque ya haya pasado', () => {
    const segmentos = segmentosDeLaRueda(circulo({ semanaActual: 6, miTurno: 4 }), 'yo');

    expect(segmentos[3]).toBe('tuTurno');
    expect(segmentos.filter((s) => s === 'tuTurno')).toHaveLength(1);
    expect(segmentos.filter((s) => s === 'cobraron')).toHaveLength(5);
  });

  it('en la semana 1 solo ha empezado una semana', () => {
    const segmentos = segmentosDeLaRueda(circulo({ semanaActual: 1, miTurno: 13 }), 'yo');

    expect(segmentos.filter((s) => s === 'cobraron')).toHaveLength(1);
  });
});

describe('resumenDeMiTurno', () => {
  it('si te toca más adelante dice cuántas semanas faltan y qué día', () => {
    expect(resumenDeMiTurno(circulo({ semanaActual: 6, miTurno: 13 }), 'yo')).toEqual({
      tipo: 'faltan',
      semana: 13,
      semanasRestantes: 7,
      fecha: '2027-01-18',
    });
  });

  it('si te toca esta semana lo dice', () => {
    expect(resumenDeMiTurno(circulo({ semanaActual: 6, miTurno: 6 }), 'yo')).toEqual({
      tipo: 'estaSemana',
      semana: 6,
      fecha: '2026-11-30',
    });
  });

  it('si ya pasó dice que ya cobraste, sin fecha', () => {
    expect(resumenDeMiTurno(circulo({ semanaActual: 6, miTurno: 4 }), 'yo')).toEqual({
      tipo: 'yaCobraste',
      semana: 4,
    });
  });

  it('con una sola semana de espera, falta exactamente una', () => {
    const resumen = resumenDeMiTurno(circulo({ semanaActual: 6, miTurno: 7 }), 'yo');

    expect(resumen).toMatchObject({ tipo: 'faltan', semanasRestantes: 1 });
  });
});

describe('resumenDeAportes', () => {
  it('multiplica las cuotas pagadas por la cuota semanal', () => {
    const resumen = resumenDeAportes(circulo({ misCuotas: 5 }), 'yo');

    expect(resumen).toMatchObject({ cuotas: 5, totalDeCuotas: 15, monto: 3000 });
  });

  it('dice cuándo vence la cuota de esta semana', () => {
    expect(resumenDeAportes(circulo({ semanaActual: 6 }), 'yo').vence).toBe('2026-11-30');
  });

  it('distingue al día, pendiente y atrasada', () => {
    const alDia = resumenDeAportes(circulo({ miEstado: 'alDia' }), 'yo');
    const pendiente = resumenDeAportes(circulo({ miEstado: 'pendiente' }), 'yo');
    const atrasada = resumenDeAportes(circulo({ miEstado: 'atrasado' }), 'yo');

    expect([alDia.alDia, alDia.atrasada]).toEqual([true, false]);
    expect([pendiente.alDia, pendiente.atrasada]).toEqual([false, false]);
    expect([atrasada.alDia, atrasada.atrasada]).toEqual([false, true]);
  });
});
