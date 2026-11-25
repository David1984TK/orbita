// Mandar un texto por WhatsApp (o por la aplicación que la persona elija) con el
// cuadro de compartir del sistema. No depende del servidor: funciona igual en
// desarrollo y en una versión instalable.

import { Share } from 'react-native';

export type ResultadoDeCompartir = 'compartido' | 'cancelado';

export type Compartir = {
  /**
   * Abre el cuadro de compartir con el texto. Devuelve `cancelado` si la persona
   * lo cerró sin mandar nada; lanza un error si no se pudo abrir.
   */
  compartir(texto: string): Promise<ResultadoDeCompartir>;
};

export function crearCompartir(): Compartir {
  return {
    async compartir(texto) {
      const resultado = await Share.share({ message: texto });
      return resultado.action === Share.dismissedAction ? 'cancelado' : 'compartido';
    },
  };
}
