import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.radhikaarasu.smilepatrol',
  appName: 'Smile Patrol',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
};

export default config;
