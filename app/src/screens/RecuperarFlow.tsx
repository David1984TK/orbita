import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import type { Llave } from '../servicios/llave';
import type { Recuperacion, ResumenDeRecuperacion } from '../servicios/recuperacion';
import type { Verificacion } from '../servicios/verificacion';
import { CodigoScreen } from './CodigoScreen';
import { GrupoConfirmaScreen } from './GrupoConfirmaScreen';
import { LlaveScreen } from './LlaveScreen';
import { RecuperadoScreen } from './RecuperadoScreen';
import { RecuperarScreen } from './RecuperarScreen';
import { SelfieScreen } from './SelfieScreen';

type Props = {
  verificacion: Verificacion;
  llave: Llave;
  recuperacion: Recuperacion;
  /** La persona dejó la recuperación y regresa a la pantalla de inicio. */
  onCancelar: () => void;
  /** La persona recuperó su acceso y entra a la app. */
  onTerminar: (resumen: ResumenDeRecuperacion) => void;
};

type Paso =
  | { nombre: 'telefono' }
  | { nombre: 'codigo'; telefono: string }
  | { nombre: 'selfie'; telefono: string }
  | { nombre: 'grupo'; telefono: string }
  | { nombre: 'llave'; telefono: string }
  | { nombre: 'recuperado'; resumen: ResumenDeRecuperacion };

/**
 * "Perdí mi teléfono": las pantallas de la recuperación, una tras otra. Reutiliza
 * el código de WhatsApp y la creación de la llave de la entrada.
 *
 *   teléfono → código → selfie → el grupo confirma → llave nueva → recuperado
 */
export function RecuperarFlow({ verificacion, llave, recuperacion, onCancelar, onTerminar }: Props) {
  const [paso, setPaso] = useState<Paso>({ nombre: 'telefono' });

  // En Android el botón de atrás deshace los dos primeros pasos. Más adelante la
  // persona ya confirmó cosas y no se puede volver atrás.
  useEffect(() => {
    if (paso.nombre !== 'telefono' && paso.nombre !== 'codigo') {
      return undefined;
    }
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      if (paso.nombre === 'telefono') {
        onCancelar();
      } else {
        setPaso({ nombre: 'telefono' });
      }
      return true;
    });
    return () => suscripcion.remove();
  }, [paso.nombre, onCancelar]);

  switch (paso.nombre) {
    case 'telefono':
      return (
        <RecuperarScreen
          onCancelar={onCancelar}
          onContinuar={(telefono) => {
            // Pendiente: avisar si el envío falla. La persona puede pedir otro
            // código desde la pantalla siguiente.
            verificacion.enviarCodigo(telefono).catch(() => {});
            setPaso({ nombre: 'codigo', telefono });
          }}
        />
      );

    case 'codigo':
      return (
        <CodigoScreen
          telefono={paso.telefono}
          onVerificar={async (codigo) => {
            const correcto = await verificacion.verificarCodigo(paso.telefono, codigo);
            if (correcto) {
              setPaso({ nombre: 'selfie', telefono: paso.telefono });
            }
            return correcto;
          }}
          onReenviar={() => {
            verificacion.enviarCodigo(paso.telefono).catch(() => {});
          }}
          onCambiarNumero={() => setPaso({ nombre: 'telefono' })}
        />
      );

    case 'selfie':
      return (
        <SelfieScreen
          onEmpezar={async () => {
            const resultado = await recuperacion.verificarSelfie();
            if (resultado.ok) {
              setPaso({ nombre: 'grupo', telefono: paso.telefono });
            }
            return resultado;
          }}
        />
      );

    case 'grupo':
      return (
        <GrupoConfirmaScreen
          obtener={() => recuperacion.obtenerConfirmaciones()}
          onAvisar={() => recuperacion.avisarAlGrupo()}
          onConfirmado={() => setPaso({ nombre: 'llave', telefono: paso.telefono })}
        />
      );

    case 'llave':
      return (
        <LlaveScreen
          onCrear={async () => {
            const resultado = await llave.crearLlave(paso.telefono);
            if (resultado.ok) {
              const resumen = await recuperacion.completar();
              setPaso({ nombre: 'recuperado', resumen });
            }
            return resultado;
          }}
        />
      );

    case 'recuperado':
      return <RecuperadoScreen resumen={paso.resumen} onEntrar={() => onTerminar(paso.resumen)} />;
  }
}
