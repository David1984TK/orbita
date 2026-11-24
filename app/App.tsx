import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CodigoScreen } from './src/screens/CodigoScreen';
import { IdentidadScreen } from './src/screens/IdentidadScreen';
import { LlaveScreen } from './src/screens/LlaveScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { crearLlave } from './src/servicios/llave';
import { crearVerificacion } from './src/servicios/verificacion';
import { colors } from './src/theme';

// Pasos de la entrada. Con pocas pantallas basta un estado; cuando la app tenga
// más pasos se cambia por una librería de navegación.
type Paso =
  | { nombre: 'telefono' }
  | { nombre: 'codigo'; telefono: string }
  | { nombre: 'llave'; telefono: string }
  | { nombre: 'identidad' }
  | { nombre: 'foto-ine' };

export default function App() {
  const verificacion = useMemo(() => crearVerificacion(), []);
  const llave = useMemo(() => crearLlave(), []);
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
        <IdentidadScreen onTomarFoto={() => setPaso({ nombre: 'foto-ine' })} />
      )}

      {paso.nombre === 'foto-ine' && (
        // Provisional: la captura de la INE necesita el proveedor de KYC (Etapa 3).
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 17, textAlign: 'center', color: colors.tinta }}>
            Aquí va la foto de tu INE. Todavía no existe.
          </Text>
        </View>
      )}

      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
