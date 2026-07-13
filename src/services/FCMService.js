import { Capacitor } from '@capacitor/core';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

let PushNotifications = null;

const getPlugin = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  if (!PushNotifications) {
    const mod = await import('@capacitor/push-notifications');
    PushNotifications = mod.PushNotifications;
  }
  return PushNotifications;
};

export const registerFCMToken = async () => {
  const plugin = await getPlugin();
  if (!plugin) return;

  try {
    const { receive } = await plugin.requestPermissions();
    if (receive !== 'granted') return;

    await plugin.register();

    plugin.addListener('registration', async (token) => {
      const user = auth.currentUser;
      if (!user || !token.value) return;
      await setDoc(doc(db, 'fcmTokens', user.uid), {
        token: token.value,
        updatedAt: new Date(),
        userId: user.uid,
      });
    });

    plugin.addListener('registrationError', (err) => {
      console.error('FCM registration error:', err);
    });
  } catch (e) {
    console.error('FCM setup error:', e);
  }
};
