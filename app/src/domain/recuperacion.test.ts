import type { Confirmacion } from './recuperacion';
import {
  CONFIRMACIONES_NECESARIAS,
  detalleDeConfirmacion,
  DIAS_SIN_RESPUESTA,
  etiquetaDeConfirmacion,
  formatearHace,
  formatearHaceMeses,
  HORAS_SIN_RETIRAR,
  PERSONAS_QUE_CONFIRMAN,
  resumenDeConfirmaciones,
  textoDeFaltantes,
} from './recuperacion';

const persona = (
  id: string,
  estado: Confirmacion['estado'],
  haceMinutos?: number,
): Confirmacion => ({ id, nombre: `Persona ${id}`, estado, haceMinutos });

describe('las reglas de la recuperación', () => {
  it('se pregunta a 3 personas, confirman 2, se espera 7 días y se congela 72 horas', () => {
    expect(PERSONAS_QUE_CONFIRMAN).toBe(3);
    expect(CONFIRMACIONES_NECESARIAS).toBe(2);
    expect(DIAS_SIN_RESPUESTA).toBe(7);
    expect(HORAS_SIN_RETIRAR).toBe(72);
  });
});

describe('formatearHace', () => {
  it('minutos, con singular y plural', () => {
    expect(formatearHace(4)).toBe('Hace 4 minutos');
    expect(formatearHace(1)).toBe('Hace 1 minuto');
  });

  it('menos de un minuto es "un momento"', () => {
    expect(formatearHace(0)).toBe('Hace un momento');
    expect(formatearHace(0.4)).toBe('Hace un momento');
    expect(formatearHace(-5)).toBe('Hace un momento');
  });

  it('pasa a horas y a días en su punto', () => {
    expect(formatearHace(59)).toBe('Hace 59 minutos');
    expect(formatearHace(60)).toBe('Hace 1 hora');
    expect(formatearHace(150)).toBe('Hace 2 horas');
    expect(formatearHace(60 * 24)).toBe('Hace 1 día');
    expect(formatearHace(60 * 24 * 3 + 100)).toBe('Hace 3 días');
  });
});

describe('detalleDeConfirmacion y etiquetaDeConfirmacion', () => {
  it('quien confirmó dice hace cuánto', () => {
    expect(detalleDeConfirmacion(persona('a', 'confirmo', 4))).toBe('Hace 4 minutos');
    expect(detalleDeConfirmacion(persona('a', 'confirmo'))).toBe('Confirmó');
  });

  it('quien no ha respondido: le llegó el aviso', () => {
    expect(detalleDeConfirmacion(persona('a', 'esperando'))).toBe('Le llegó el aviso');
  });

  it('quien dijo que no se dice sin rodeos', () => {
    expect(detalleDeConfirmacion(persona('a', 'rechazo', 2))).toBe('Hace 2 minutos');
    expect(detalleDeConfirmacion(persona('a', 'rechazo'))).toBe('No te reconoció');
  });

  it('las etiquetas', () => {
    expect(etiquetaDeConfirmacion('confirmo')).toBe('Confirmó');
    expect(etiquetaDeConfirmacion('esperando')).toBe('Esperando');
    expect(etiquetaDeConfirmacion('rechazo')).toBe('Dijo que no');
  });
});

describe('resumenDeConfirmaciones', () => {
  it('con una confirmación de tres falta una', () => {
    const resumen = resumenDeConfirmaciones([
      persona('a', 'confirmo', 4),
      persona('b', 'esperando'),
      persona('c', 'esperando'),
    ]);

    expect(resumen).toEqual({ confirmaron: 1, esperando: 2, rechazaron: 0, faltan: 1, completo: false });
  });

  it('con dos confirmaciones ya está completo, aunque falte una persona', () => {
    const resumen = resumenDeConfirmaciones([
      persona('a', 'confirmo', 4),
      persona('b', 'confirmo', 1),
      persona('c', 'esperando'),
    ]);

    expect(resumen).toMatchObject({ faltan: 0, completo: true });
  });

  it('sin ninguna confirmación faltan las dos', () => {
    const resumen = resumenDeConfirmaciones([
      persona('a', 'esperando'),
      persona('b', 'esperando'),
      persona('c', 'esperando'),
    ]);

    expect(resumen).toMatchObject({ faltan: 2, completo: false });
  });

  it('quien dijo que no no cuenta como confirmación', () => {
    const resumen = resumenDeConfirmaciones([
      persona('a', 'confirmo', 4),
      persona('b', 'rechazo', 2),
      persona('c', 'esperando'),
    ]);

    expect(resumen).toMatchObject({ confirmaron: 1, rechazaron: 1, faltan: 1, completo: false });
  });

  it('con más confirmaciones de las necesarias no pide menos de cero', () => {
    const resumen = resumenDeConfirmaciones([
      persona('a', 'confirmo'),
      persona('b', 'confirmo'),
      persona('c', 'confirmo'),
    ]);

    expect(resumen.faltan).toBe(0);
  });
});

describe('textoDeFaltantes', () => {
  it('singular y plural', () => {
    expect(textoDeFaltantes(1)).toBe('Falta una confirmación.');
    expect(textoDeFaltantes(2)).toBe('Faltan 2 confirmaciones.');
  });
});

describe('formatearHaceMeses', () => {
  it('meses, con singular y plural', () => {
    expect(formatearHaceMeses(4)).toBe('Hace 4 meses');
    expect(formatearHaceMeses(1)).toBe('Hace 1 mes');
  });

  it('menos de un mes no dice "0 meses"', () => {
    expect(formatearHaceMeses(0)).toBe('Hace menos de un mes');
    expect(formatearHaceMeses(0.6)).toBe('Hace menos de un mes');
    expect(formatearHaceMeses(-2)).toBe('Hace menos de un mes');
  });
});
