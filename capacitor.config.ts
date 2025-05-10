
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.27db02e436bd4a37b80927bbd564e5c4',
  appName: 'task-wise-ai-flow',
  webDir: 'dist',
  server: {
    url: "https://27db02e4-36bd-4a37-b809-27bbd564e5c4.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    backgroundColor: "#FFFFFF",
  }
};

export default config;
