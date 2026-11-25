import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarraPestanas } from '../components/BarraPestanas';
import type { Pestana } from '../components/BarraPestanas';
import { registrarAporte, registrarRetiro } from '../domain';
import type { MiCirculo } from '../domain';
import type { Aportes } from '../servicios/aportes';
import type { Circulos } from '../servicios/circulos';
import type { Historiales } from '../servicios/historial';
import type { Retiros } from '../servicios/retiros';
import { colors } from '../theme';
import { AportarScreen } from './AportarScreen';
import { GrupoScreen } from './GrupoScreen';
import { InicioScreen } from './InicioScreen';
import { PerfilScreen } from './PerfilScreen';
import { RetirarScreen } from './RetirarScreen';

type Props = {
  circulos: Circulos;
  aportes: Aportes;
  retiros: Retiros;
  historiales: Historiales;
};

/** Dentro de "Círculo": la pantalla de siempre o uno de los pasos cortos. */
type Vista = 'inicio' | 'aportar' | 'retirar';

type Carga =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; miCirculo: MiCirculo }
  | { tipo: 'error' };

const MENSAJE_ERROR = 'No pudimos cargar tu círculo. Revisa tu conexión e inténtalo de nuevo.';

/**
 * La app una vez dentro: la barra de pestañas y la pantalla de cada una.
 *
 * Existen "Círculo" (con "Aportar" y "Tu turno" dentro), "Grupo" y "Perfil" (mi
 * historial). "Círculo" y "Grupo" leen el mismo círculo, así que comparten la
 * carga y sus avisos; "Perfil" pide su propio historial. Mientras se aporta o se retira no se ve la
 * barra de pestañas: son pasos cortos que se confirman o se cancelan.
 */
export function PrincipalScreen({ circulos, aportes, retiros, historiales }: Props) {
  const [pestana, setPestana] = useState<Pestana>('circulo');
  const [vista, setVista] = useState<Vista>('inicio');
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });

  const cargar = useCallback(() => {
    let cancelado = false;
    setCarga({ tipo: 'cargando' });
    circulos
      .obtenerMiCirculo()
      .then((miCirculo) => {
        if (!cancelado) {
          setCarga({ tipo: 'listo', miCirculo });
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCarga({ tipo: 'error' });
        }
      });
    return () => {
      cancelado = true;
    };
  }, [circulos]);

  useEffect(() => cargar(), [cargar]);

  // En Android el botón de atrás cierra "Aportar" o "Tu turno" en vez de salirse
  // de la app.
  useEffect(() => {
    if (vista === 'inicio') {
      return undefined;
    }
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      setVista('inicio');
      return true;
    });
    return () => suscripcion.remove();
  }, [vista]);

  // "Círculo" y "Grupo" se alimentan del mismo círculo.
  const necesitaCirculo = pestana === 'circulo' || pestana === 'grupo';

  // Solo se llega a "Aportar" y a "Tu turno" con el círculo ya cargado.
  const enPasoAparte = pestana === 'circulo' && vista !== 'inicio' && carga.tipo === 'listo';

  async function confirmarAporte(total: number) {
    if (carga.tipo !== 'listo') {
      return { ok: false, motivo: 'error' } as const;
    }
    const { circulo, yoId } = carga.miCirculo;
    const resultado = await aportes.aportar(circulo.id, total);
    if (resultado.ok) {
      setCarga({ tipo: 'listo', miCirculo: { circulo: registrarAporte(circulo, yoId), yoId } });
      setVista('inicio');
    }
    return resultado;
  }

  async function confirmarRetiro(recibes: number) {
    if (carga.tipo !== 'listo') {
      return { ok: false, motivo: 'error' } as const;
    }
    const { circulo, yoId } = carga.miCirculo;
    const resultado = await retiros.retirar(circulo.id, recibes);
    if (resultado.ok) {
      setCarga({ tipo: 'listo', miCirculo: { circulo: registrarRetiro(circulo, yoId), yoId } });
      setVista('inicio');
    }
    return resultado;
  }

  function cambiarPestana(nueva: Pestana) {
    setPestana(nueva);
    setVista('inicio');
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.contenido}>
        {enPasoAparte && vista === 'aportar' && carga.tipo === 'listo' && (
          <AportarScreen
            miCirculo={carga.miCirculo}
            onConfirmar={confirmarAporte}
            onVolver={() => setVista('inicio')}
          />
        )}

        {enPasoAparte && vista === 'retirar' && carga.tipo === 'listo' && (
          <RetirarScreen
            miCirculo={carga.miCirculo}
            onConfirmar={confirmarRetiro}
            onVolver={() => setVista('inicio')}
          />
        )}

        {necesitaCirculo && !enPasoAparte && carga.tipo === 'cargando' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <ActivityIndicator color={colors.cobalto} />
            <Text style={estilos.mensaje}>Cargando tu círculo…</Text>
          </SafeAreaView>
        )}

        {necesitaCirculo && !enPasoAparte && carga.tipo === 'error' && (
          <SafeAreaView edges={['top']} style={estilos.centro}>
            <Text style={estilos.mensaje} accessibilityRole="alert">
              {MENSAJE_ERROR}
            </Text>
            <Pressable onPress={cargar} accessibilityRole="button" style={estilos.reintentar}>
              <Text style={estilos.reintentarTexto}>Reintentar</Text>
            </Pressable>
          </SafeAreaView>
        )}

        {pestana === 'circulo' && !enPasoAparte && carga.tipo === 'listo' && (
          <InicioScreen
            miCirculo={carga.miCirculo}
            onAportar={() => setVista('aportar')}
            onRetirar={() => setVista('retirar')}
          />
        )}

        {pestana === 'grupo' && carga.tipo === 'listo' && <GrupoScreen miCirculo={carga.miCirculo} />}

        {pestana === 'perfil' && <PerfilScreen historiales={historiales} />}
      </View>

      {!enPasoAparte && <BarraPestanas activa={pestana} onCambiar={cambiarPestana} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    flex: 1,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  mensaje: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textoSecundario,
  },
  reintentar: {
    padding: 8,
  },
  reintentarTexto: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.cobalto,
  },
});
