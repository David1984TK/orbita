// Un círculo en formación: ya se creó, pero todavía no se llena. Quien lo creó
// manda el enlace por WhatsApp y las demás personas van entrando. Cuando entra la
// última, el círculo arranca y pasa a ser el "Mi círculo" de siempre.
//
// Es un tipo aparte de `Circulo` a propósito: un círculo en curso siempre tiene a
// todas sus integrantes y su semana en marcha, y uno en formación todavía no.

import type { Moneda } from './circulo';
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
