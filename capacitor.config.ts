import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.angusbeef334.print_mate',
  appName: 'PrintMate',
  webDir: 'out',
  plugins: {
    Preferences: {
      group: "PrintMateGroup"
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1f2937',
      overlay: false
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
      "*",
      "https://api.bambulab.com",
      "https://api.bambulab.com/*"
    ]
  }
};

export default config;
