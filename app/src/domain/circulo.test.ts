import { boteDelCirculo, exposicionNeta } from './circulo';
import type { Circulo, Integrante } from './circulo';

// Arma un círculo de prueba con `cuantos` integrantes, todos al día.
function circuloDePrueba(cuantos: number, cuotaSemanal: number): Circulo {
  const integrantes: Integrante[] = Array.from({ length: cuantos }, (_, i) => ({
    id: `integrante-${i + 1}`,
    nombre: `Integrante ${i + 1}`,
    turno: i + 1,
    estado: 'alDia',
  }));

  return {
    id: 'circulo-de-prueba',
    nombre: 'Los del mercado',
    moneda: 'pesos',
    cuotaSemanal,
    integrantes,
    semanaActual: 1,
  };
}

describe('boteDelCirculo', () => {
  it('es la cuota por el número de integrantes', () => {
    // 15 personas x $600 = lo que recibe quien cobra: $9,000
    expect(boteDelCirculo(circuloDePrueba(15, 600))).toBe(9000);
  });

  it('funciona con un círculo chico', () => {
    // 5 personas x $300 = $1,500
    expect(boteDelCirculo(circuloDePrueba(5, 300))).toBe(1500);
  });
});

describe('exposicionNeta', () => {
  // exposición neta = recibido − aportado − garantía
  //
  // Los números salen del plan: círculo de 15 x $600, bote de $9,000.

  it('un usuario nuevo que cobra primero necesita $8,100 de garantía', () => {
    // Cobra la semana 1: recibe $9,000 y solo ha aportado una cuota ($600).
    // El límite de un usuario nuevo es media cuota: $300.
    // 9,000 − 600 − 8,100 = 300  →  justo en su límite.
    expect(exposicionNeta(9000, 600, 8100)).toBe(300);
  });

  it('sin garantía, quien cobra primero se lleva casi todo el bote', () => {
    expect(exposicionNeta(9000, 600, 0)).toBe(8400);
  });

  it('es cero cuando ya aportó tanto como recibió', () => {
    // Al terminar el círculo: recibió $9,000 y aportó $9,000.
    expect(exposicionNeta(9000, 9000, 0)).toBe(0);
  });

  it('quien aún no cobra no tiene exposición: aportó y no ha recibido', () => {
    // Nada recibido, $1,800 aportados: el resultado es negativo, es decir,
    // el círculo le debe a él, no al revés.
    expect(exposicionNeta(0, 1800, 0)).toBe(-1800);
  });

  it('la garantía reduce la exposición peso por peso', () => {
    const sinGarantia = exposicionNeta(9000, 1200, 0);
    const conGarantia = exposicionNeta(9000, 1200, 500);
    expect(sinGarantia - conGarantia).toBe(500);
  });
});
