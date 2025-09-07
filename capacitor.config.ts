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
    captureInput: true
  }
};

export default config;
