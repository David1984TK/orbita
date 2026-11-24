import type { Circulo } from './circulo';
import {
  COMISION_DE_DEPOSITO,
  desgloseDeAporte,
  PORCENTAJE_DE_COMISION,
  registrarAporte,
} from './aporte';

describe('desgloseDeAporte', () => {
  it('una cuota de $600 paga $3 de comisión y se descuentan $603', () => {
    expect(desgloseDeAporte(600)).toEqual({ aCirculo: 600, comision: 3, total: 603 });
  });

  it('al círculo siempre llega la cuota completa: la comisión va aparte', () => {
    expect(desgloseDeAporte(1000).aCirculo).toBe(1000);
    expect(desgloseDeAporte(1000).total).toBe(1005);
  });

  it('calcula bien cuando la comisión trae centavos', () => {
    // 0.5% de 250 = 1.25
    expect(desgloseDeAporte(250)).toEqual({ aCirculo: 250, comision: 1.25, total: 251.25 });
  });

  it('no arrastra errores de decimales de punto flotante', () => {
    // 0.5% de 333 = 1.665 → se redondea a 1.67; el total tiene que sumar exacto.
    const desglose = desgloseDeAporte(333);

    expect(desglose.comision).toBe(1.67);
    expect(desglose.total).toBe(334.67);
    expect(desglose.aCirculo + desglose.comision).toBe(desglose.total);
  });

  it('con cuota cero no cobra nada', () => {
    expect(desgloseDeAporte(0)).toEqual({ aCirculo: 0, comision: 0, total: 0 });
  });

  it('la comisión es 0.5%, y así se escribe en pantalla', () => {
    expect(COMISION_DE_DEPOSITO).toBe(0.005);
    expect(PORCENTAJE_DE_COMISION).toBe('0.5');
  });
});

function circulo(estadoDeYo: 'alDia' | 'pendiente' | 'atrasado'): Circulo {
  return {
    id: 'c',
    nombre: 'Los del mercado',
    moneda: 'pesos',
    cuotaSemanal: 600,
    semanaActual: 6,
    inicio: '2026-10-26',
    integrantes: [
      { id: 'yo', nombre: 'Tú', turno: 12, estado: estadoDeYo, cuotasPagadas: 5 },
      { id: 'otra', nombre: 'Otra', turno: 3, estado: 'alDia', cuotasPagadas: 6 },
    ],
  };
}

describe('registrarAporte', () => {
  it('deja a la persona al día y suma una cuota', () => {
    const despues = registrarAporte(circulo('pendiente'), 'yo');
    const yo = despues.integrantes.find((i) => i.id === 'yo')!;

    expect(yo.estado).toBe('alDia');
    expect(yo.cuotasPagadas).toBe(6);
  });

  it('también sirve para ponerse al corriente estando atrasada', () => {
    const yo = registrarAporte(circulo('atrasado'), 'yo').integrantes.find((i) => i.id === 'yo')!;

    expect(yo.estado).toBe('alDia');
  });

  it('no toca a las demás integrantes', () => {
    const antes = circulo('pendiente');
    const despues = registrarAporte(antes, 'yo');

    expect(despues.integrantes.find((i) => i.id === 'otra')).toEqual(
      antes.integrantes.find((i) => i.id === 'otra'),
    );
  });

  it('no modifica el círculo original', () => {
    const antes = circulo('pendiente');
    registrarAporte(antes, 'yo');

    expect(antes.integrantes[0]).toMatchObject({ estado: 'pendiente', cuotasPagadas: 5 });
  });

  it('no deja pagar dos veces la misma cuota', () => {
    expect(() => registrarAporte(circulo('alDia'), 'yo')).toThrow(/ya aportó/);
  });

  it('lanza un error si la persona no está en el círculo', () => {
    expect(() => registrarAporte(circulo('pendiente'), 'nadie')).toThrow(/nadie/);
  });
});
