import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.serlog.app',
  appName: 'Serlog Logistics',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
