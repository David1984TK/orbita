import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CodigoScreen } from './src/screens/CodigoScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { crearVerificacion } from './src/servicios/verificacion';
import { colors } from './src/theme';

// Pasos de la entrada. Con tres pantallas basta un estado; cuando la app tenga
// más pasos se cambia por una librería de navegación.
type Paso =
  | { nombre: 'telefono' }
  | { nombre: 'codigo'; telefono: string }
  | { nombre: 'llave' };

export default function App() {
  const verificacion = useMemo(() => crearVerificacion(), []);
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
              setPaso({ nombre: 'llave' });
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
        // Provisional: la pantalla "Tu llave" (crear la passkey) aún no existe.
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 17, textAlign: 'center', color: colors.tinta }}>
            Código verificado. Sigue la pantalla «Tu llave».
          </Text>
        </View>
      )}

      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
