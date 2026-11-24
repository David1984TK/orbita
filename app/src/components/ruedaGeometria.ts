// Geometría de la rueda: el trazo de cada segmento. Vive aparte del componente
// para poder probar los números sin dibujar nada.

function punto(cx: number, cy: number, radio: number, grados: number) {
  // 0° es arriba y crece hacia la derecha (como las manecillas del reloj).
  const radianes = (grados * Math.PI) / 180;
  return { x: cx + radio * Math.sin(radianes), y: cy - radio * Math.cos(radianes) };
}

const redondear = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Trazo SVG (un arco) del segmento `indice` de `total`, empezando arriba y
 * siguiendo el sentido del reloj. `hueco` son los grados que se dejan libres
 * entre un segmento y el siguiente.
 */
export function trazoDeSegmento(
  indice: number,
  total: number,
  cx: number,
  cy: number,
  radio: number,
  hueco: number,
): string {
  const porSegmento = 360 / total;
  const inicio = punto(cx, cy, radio, indice * porSegmento + hueco / 2);
  const fin = punto(cx, cy, radio, (indice + 1) * porSegmento - hueco / 2);
  // Un segmento nunca llega a media vuelta, salvo con un solo segmento.
  const arcoGrande = porSegmento - hueco > 180 ? 1 : 0;
  return (
    `M ${redondear(inicio.x)} ${redondear(inicio.y)} ` +
    `A ${radio} ${radio} 0 ${arcoGrande} 1 ${redondear(fin.x)} ${redondear(fin.y)}`
  );
}
