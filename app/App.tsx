import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CodigoScreen } from './src/screens/CodigoScreen';
import { IdentidadScreen } from './src/screens/IdentidadScreen';
import { LlaveScreen } from './src/screens/LlaveScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { PrincipalScreen } from './src/screens/PrincipalScreen';
import { crearAportes } from './src/servicios/aportes';
import { crearCirculos } from './src/servicios/circulos';
import { crearHistoriales } from './src/servicios/historial';
import { crearIdentidad } from './src/servicios/identidad';
import { crearLlave } from './src/servicios/llave';
import { crearRetiros } from './src/servicios/retiros';
import { crearVerificacion } from './src/servicios/verificacion';

// Pasos de la app. Con pocas pantallas basta un estado; cuando la app tenga
// más pasos se cambia por una librería de navegación.
type Paso =
  | { nombre: 'telefono' }
  | { nombre: 'codigo'; telefono: string }
  | { nombre: 'llave'; telefono: string }
  | { nombre: 'identidad' }
  | { nombre: 'principal' };

export default function App() {
  const verificacion = useMemo(() => crearVerificacion(), []);
  const llave = useMemo(() => crearLlave(), []);
  const identidad = useMemo(() => crearIdentidad(), []);
  const circulos = useMemo(() => crearCirculos(), []);
  const aportes = useMemo(() => crearAportes(), []);
  const retiros = useMemo(() => crearRetiros(), []);
  const historiales = useMemo(() => crearHistoriales(), []);
  const [paso, setPaso] = useState<Paso>({ nombre: 'telefono' });

  return (
    <SafeAreaProvider>
      {paso.nombre === 'telefono' && (
        <LoginScreen
          onContinuar={(telefono) => {
            // Pendiente: avisar si el envío falla. Por ahora la persona puede
            // pedir otro código desde la pantalla siguiente.
            verificacion.enviarCodigo(telefono).catch(() => {});
            setPaso({ nombre: 'codigo', telefono });
          }}
        />
      )}

      {paso.nombre === 'codigo' && (
        <CodigoScreen
          telefono={paso.telefono}
          onVerificar={async (codigo) => {
            const correcto = await verificacion.verificarCodigo(paso.telefono, codigo);
            if (correcto) {
              setPaso({ nombre: 'llave', telefono: paso.telefono });
            }
            return correcto;
          }}
          onReenviar={() => {
            verificacion.enviarCodigo(paso.telefono).catch(() => {});
          }}
          onCambiarNumero={() => setPaso({ nombre: 'telefono' })}
        />
      )}

      {paso.nombre === 'llave' && (
        <LlaveScreen
          onCrear={async () => {
            const resultado = await llave.crearLlave(paso.telefono);
            if (resultado.ok) {
              setPaso({ nombre: 'identidad' });
            }
            return resultado;
          }}
        />
      )}

      {paso.nombre === 'identidad' && (
        <IdentidadScreen
          onTomarFoto={() => {
            // Hoy este botón da por hecha toda la verificación (versión simulada).
            // Pendiente: las pantallas de captura de la INE, la selfie y el
            // domicilio, y avisar si la verificación falla.
            identidad
              .verificar()
              .then(() => setPaso({ nombre: 'principal' }))
              .catch(() => {});
          }}
        />
      )}

      {paso.nombre === 'principal' && <PrincipalScreen
          circulos={circulos}
          aportes={aportes}
          retiros={retiros}
          historiales={historiales}
        />}

      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
