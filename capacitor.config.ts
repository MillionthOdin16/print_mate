import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.angusbeef334.print_mate',
  appName: 'PrintMate',
  webDir: 'out',
  plugins: {
    Preferences: {
      group: "PrintMateGroup"
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#1f2937' // Dark theme background
  },
  server: {
    cleartext: true,
    allowNavigation: [
      "*"
    ]
  }
};

export default config;
