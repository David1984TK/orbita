import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <LoginScreen
        onContinuar={() => {
          // Pendiente: el código por WhatsApp (segunda pantalla de entrada).
          // Hasta que exista, el botón no lleva a ningún lado.
        }}
      />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
