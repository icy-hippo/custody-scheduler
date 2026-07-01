import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.harmonyhub.app',
  appName: 'HarmonyHub',
  webDir: 'build',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#667EEA',
      sound: 'beep.wav'
    }
  }
};

export default config;
