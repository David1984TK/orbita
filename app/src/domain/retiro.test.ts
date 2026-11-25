import type { Circulo, Moneda } from './circulo';
import {
  COMISION_DE_RETIRO,
  COMISION_ORBITA,
  desgloseDeRetiro,
  PORCENTAJE_COMISION_ORBITA,
  puedeRetirar,
  registrarRetiro,
} from './retiro';
import { resumenDeMiTurno } from './rueda';

describe('desgloseDeRetiro', () => {
  it('un bote de $9,000 paga $90 de Órbita y $45 de retiro: recibes $8,865', () => {
    expect(desgloseDeRetiro(9000, 'pesos')).toEqual({
      bote: 9000,
      comisionOrbita: 90,
      comisionDeRetiro: 45,
      recibes: 8865,
    });
  });

  it('la comisión de Órbita es proporcional al bote', () => {
    expect(desgloseDeRetiro(1500, 'pesos')).toMatchObject({ comisionOrbita: 15, recibes: 1440 });
  });

  it('calcula bien cuando la comisión trae centavos', () => {
    // 1% de 1,250.50 = 12.505 → se redondea hacia arriba a 12.51
    const desglose = desgloseDeRetiro(1250.5, 'pesos');

    expect(desglose.comisionOrbita).toBe(12.51);
    expect(desglose.recibes).toBe(1192.99);
  });

  it('el bote menos las comisiones siempre suma exacto', () => {
    const { bote, comisionOrbita, comisionDeRetiro, recibes } = desgloseDeRetiro(7333.33, 'pesos');

    expect(Math.round((bote - comisionOrbita - comisionDeRetiro) * 100)).toBe(
      Math.round(recibes * 100),
    );
  });

  it('las comisiones son 1% y $45, y así se escribe el porcentaje', () => {
    expect(COMISION_ORBITA).toBe(0.01);
    expect(COMISION_DE_RETIRO).toBe(45);
    expect(PORCENTAJE_COMISION_ORBITA).toBe('1');
  });

  it('en dólares lanza un error en vez de inventar una comisión', () => {
    expect(() => desgloseDeRetiro(500, 'dolares')).toThrow(/pesos/);
  });
});

function circulo(opciones: {
  semanaActual?: number;
  miTurno?: number;
  yaRetiro?: boolean;
  moneda?: Moneda;
  cuota?: number;
  integrantes?: number;
} = {}): Circulo {
  const {
    semanaActual = 6,
    miTurno = 6,
    yaRetiro,
    moneda = 'pesos',
    cuota = 600,
    integrantes = 15,
  } = opciones;
  return {
    id: 'c',
    nombre: 'Los del mercado',
    moneda,
    cuotaSemanal: cuota,
    semanaActual,
    inicio: '2026-10-26',
    integrantes: Array.from({ length: integrantes }, (_, i) => ({
      id: i + 1 === miTurno ? 'yo' : `i${i + 1}`,
      nombre: `Persona ${i + 1}`,
      turno: i + 1,
      estado: 'alDia' as const,
      cuotasPagadas: semanaActual,
      yaRetiro: i + 1 === miTurno ? yaRetiro : undefined,
    })),
  };
}

describe('puedeRetirar', () => {
  it('sí, en la semana de mi turno si aún no retiro', () => {
    expect(puedeRetirar(circulo({ semanaActual: 6, miTurno: 6 }), 'yo')).toBe(true);
  });

  it('no, si mi turno es más adelante', () => {
    expect(puedeRetirar(circulo({ semanaActual: 6, miTurno: 9 }), 'yo')).toBe(false);
  });

  it('no, si mi turno ya pasó', () => {
    expect(puedeRetirar(circulo({ semanaActual: 6, miTurno: 3 }), 'yo')).toBe(false);
  });

  it('no, si ya retiré en mi semana', () => {
    expect(puedeRetirar(circulo({ yaRetiro: true }), 'yo')).toBe(false);
  });

  it('no, en un círculo en dólares', () => {
    expect(puedeRetirar(circulo({ moneda: 'dolares' }), 'yo')).toBe(false);
  });

  it('no, si después de las comisiones no quedaría nada', () => {
    // 5 personas x $5 = $25 de bote, menos $45 de retiro: no alcanza.
    expect(puedeRetirar(circulo({ cuota: 5, integrantes: 5, semanaActual: 2, miTurno: 2 }), 'yo')).toBe(
      false,
    );
  });
});

describe('registrarRetiro', () => {
  it('marca que ya retiré', () => {
    const despues = registrarRetiro(circulo(), 'yo');

    expect(despues.integrantes.find((i) => i.id === 'yo')?.yaRetiro).toBe(true);
  });

  it('después de retirar ya no se puede retirar y mi turno cuenta como cobrado', () => {
    const despues = registrarRetiro(circulo(), 'yo');

    expect(puedeRetirar(despues, 'yo')).toBe(false);
    expect(resumenDeMiTurno(despues, 'yo')).toEqual({ tipo: 'yaCobraste', semana: 6 });
  });

  it('no toca a las demás ni modifica el círculo original', () => {
    const antes = circulo();
    const despues = registrarRetiro(antes, 'yo');

    expect(despues.integrantes.filter((i) => i.yaRetiro === true)).toHaveLength(1);
    expect(antes.integrantes.find((i) => i.id === 'yo')?.yaRetiro).toBeUndefined();
  });

  it('no deja retirar dos veces el mismo bote', () => {
    expect(() => registrarRetiro(circulo({ yaRetiro: true }), 'yo')).toThrow(/ya retiró/);
  });

  it('lanza un error si la persona no está en el círculo', () => {
    expect(() => registrarRetiro(circulo(), 'nadie')).toThrow(/nadie/);
  });
});
