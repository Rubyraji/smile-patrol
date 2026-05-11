import type { CapacitorConfig } from '@capacitor/cli';

// When REPLIT_DEV_DOMAIN is set (i.e. running inside Replit) we point the
// Android app at the live dev-server so changes appear instantly on the
// device without a rebuild.  In production / local builds the app uses the
// bundled web assets from `dist/`.
const devDomain = process.env.REPLIT_DEV_DOMAIN;
const isReplit  = !!devDomain;

const config: CapacitorConfig = {
  appId: 'com.radhikaarasu.smilepatrol',
  appName: 'Smile Patrol',
  webDir: 'dist',
  server: isReplit
    ? {
        // Load directly from the Replit preview URL — live reload works
        // automatically because Vite HMR runs over the same connection.
        url: `https://${devDomain}/`,
        cleartext: false,
        androidScheme: 'https',
      }
    : {
        androidScheme: 'https',
      },
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },
};

export default config;
