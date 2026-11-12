import type { CapacitorConfig } from '@capacitor/cli';
import { config as loadEnv } from 'dotenv';

// capacitor.config corre en Node (CLI de Capacitor), fuera de Next: cargar el .env a mano.
// CAP_ENV_FILE permite elegir el archivo (default .env.capacitor.local, gitignored).
loadEnv({ path: process.env.CAP_ENV_FILE || '.env.capacitor.local' });

// Dominio que carga la WebView nativa. Default PROD; para QA/local se sobreescribe por env.
//   PROD (tienda):  https://paw.elevateapp.co
//   QA (device):    https://paw-dev.elevateapp.co
//   Local:          http://<ip-LAN>:3004
const SERVER_URL = process.env.PAW_NATIVE_SERVER_URL || 'https://paw.elevateapp.co';

const config: CapacitorConfig = {
  appId: 'com.elevate.paw',
  appName: 'Paw',
  // En modo server.url el sitio se carga en vivo; webDir solo necesita un fallback sin red.
  webDir: 'public',
  server: {
    url: SERVER_URL,
    // cleartext solo para builds locales contra http://; en PROD/QA (https) queda en false.
    cleartext: SERVER_URL.startsWith('http://'),
    // Dominios a los que la WebView puede navegar sin abrir el navegador externo.
    allowNavigation: ['paw.elevateapp.co', 'paw-dev.elevateapp.co'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0b1220',
      showSpinner: false,
    },
  },
};

export default config;
