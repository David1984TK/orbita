// Un círculo en formación: ya se creó, pero todavía no se llena. Quien lo creó
// manda el enlace por WhatsApp y las demás personas van entrando. Cuando entra la
// última, el círculo arranca y pasa a ser el "Mi círculo" de siempre.
//
// Es un tipo aparte de `Circulo` a propósito: un círculo en curso siempre tiene a
// todas sus integrantes y su semana en marcha, y uno en formación todavía no.

import type { Circulo, Integrante, MiCirculo, Moneda } from './circulo';
import { formatearMonto } from './formato';

export type Participante = {
  id: string;
  nombre: string;
};

export type CirculoEnFormacion = {
  id: string;
  nombre: string;
  moneda: Moneda;
  /** Lo que cada integrante aportará por semana. */
  cuotaSemanal: number;
  /** Cuántas personas tendrá el círculo cuando esté lleno. */
  integrantes: number;
  /** Quienes ya entraron. Quien lo creó va primero. */
  participantes: Participante[];
  /** El enlace que se manda para invitar. Lo entrega el servidor. */
  enlace: string;
  /** Quién creó el círculo. */
  organizadorId: string;
};

/** Cuántas personas faltan por entrar. */
export function faltanPorEntrar(circulo: CirculoEnFormacion): number {
  return Math.max(0, circulo.integrantes - circulo.participantes.length);
}

/** `true` cuando ya entraron todas y el círculo puede arrancar. */
export function estaLleno(circulo: CirculoEnFormacion): boolean {
  return faltanPorEntrar(circulo) === 0;
}

/** "Faltan 6 personas", "Falta 1 persona" o "Ya entraron todas". */
export function textoDeFaltantes(circulo: CirculoEnFormacion): string {
  const faltan = faltanPorEntrar(circulo);
  if (faltan === 0) {
    return 'Ya entraron todas';
  }
  return faltan === 1 ? 'Falta 1 persona' : `Faltan ${faltan} personas`;
}

export type Lugar =
  | { tipo: 'entro'; participante: Participante }
  | { tipo: 'libre' };

/** Un lugar por cada integrante: los que ya tienen dueña y los que siguen libres. */
export function lugaresDelCirculo(circulo: CirculoEnFormacion): Lugar[] {
  return Array.from({ length: circulo.integrantes }, (_, i): Lugar => {
    const participante = circulo.participantes[i];
    return participante === undefined ? { tipo: 'libre' } : { tipo: 'entro', participante };
  });
}

/** El mensaje que se manda por WhatsApp junto con el enlace. */
export function mensajeDeInvitacion(circulo: CirculoEnFormacion): string {
  const cuota = formatearMonto(circulo.cuotaSemanal, circulo.moneda);
  const bote = formatearMonto(circulo.cuotaSemanal * circulo.integrantes, circulo.moneda);
  return (
    `Te invito a «${circulo.nombre}» en Órbita: ${circulo.integrantes} personas que ahorran ` +
    `juntas, con ${cuota} cada semana, y cada quien recibe ${bote} en su turno. ` +
    `Entra aquí: ${circulo.enlace}`
  );
}

/**
 * El círculo ya en curso, a partir de uno que se llenó. Cuando entra la última
 * persona el círculo arranca: empieza en la semana 1, cada integrante tiene su
 * turno y debe su primera cuota.
 *
 * Los turnos no los decide la app: los asigna el contrato (la regla del plan los
 * liga al historial y al riesgo). Esta función solo convierte lo que llegó, y por
 * eso revisa que sea coherente: que el círculo esté lleno y que cada persona
 * tenga un turno distinto del 1 al total. Lanza un error si no.
 *
 * `inicio` es el día en que vence la cuota de la semana 1 ("AAAA-MM-DD").
 */
export function arrancarCirculo(
  formacion: CirculoEnFormacion,
  turnos: Record<string, number>,
  inicio: string,
): MiCirculo {
  if (!estaLleno(formacion)) {
    throw new Error(`El círculo "${formacion.id}" todavía no se llena: no puede arrancar.`);
  }
  const total = formacion.participantes.length;
  const usados = new Set<number>();
  const integrantes: Integrante[] = formacion.participantes.map((participante) => {
    const turno = turnos[participante.id];
    if (!Number.isInteger(turno) || turno < 1 || turno > total) {
      throw new Error(`"${participante.id}" no tiene un turno válido (del 1 al ${total}).`);
    }
    if (usados.has(turno)) {
      throw new Error(`El turno ${turno} está repetido.`);
    }
    usados.add(turno);
    return {
      id: participante.id,
      nombre: participante.nombre,
      turno,
      estado: 'pendiente',
      cuotasPagadas: 0,
    };
  });

  const circulo: Circulo = {
    id: formacion.id,
    nombre: formacion.nombre,
    moneda: formacion.moneda,
    cuotaSemanal: formacion.cuotaSemanal,
    integrantes,
    semanaActual: 1,
    inicio,
  };
  return { circulo, yoId: formacion.organizadorId };
}
