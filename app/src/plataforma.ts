import { Platform } from 'react-native';

/**
 * La plataforma, para lo único que cambia entre una y otra: cómo se llama el
 * gesto biométrico (Face ID en iOS, huella en Android). Todo lo demás es igual.
 * Cualquier otra cosa (la vista web de desarrollo, por ejemplo) se trata como
 * Android, el mercado principal.
 */
export type Plataforma = 'ios' | 'android';

export function plataformaActual(): Plataforma {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}
