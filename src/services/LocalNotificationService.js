import { Capacitor } from '@capacitor/core';

let LocalNotifications = null;

const getPlugin = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  if (!LocalNotifications) {
    const mod = await import('@capacitor/local-notifications');
    LocalNotifications = mod.LocalNotifications;
  }
  return LocalNotifications;
};

const requestPermission = async () => {
  const plugin = await getPlugin();
  if (!plugin) return false;
  const { display } = await plugin.requestPermissions();
  return display === 'granted';
};

// Cancel all previously scheduled HarmonyHub notifications
const cancelAll = async () => {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    const pending = await plugin.getPending();
    if (pending.notifications.length > 0) {
      await plugin.cancel({ notifications: pending.notifications });
    }
  } catch (e) {
    console.error('Error cancelling notifications:', e);
  }
};

// Build a stable integer ID from a string key
const makeId = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
};

const scheduleAt = (date, title, body, id) => {
  // Only schedule future notifications
  if (date <= new Date()) return null;
  return { id: makeId(id), title, body, schedule: { at: date }, smallIcon: 'ic_stat_icon_config_sample', sound: null };
};

export const scheduleAllNotifications = async ({ events = [], custodySchedule = null }) => {
  const plugin = await getPlugin();
  if (!plugin) return;

  const granted = await requestPermission();
  if (!granted) return;

  await cancelAll();

  const notifications = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- Event reminders: morning of each event at 8am ---
  events.forEach(event => {
    if (!event.date) return;
    const eventDate = new Date(event.date + 'T08:00:00');
    const n = scheduleAt(
      eventDate,
      `📅 Today: ${event.title}`,
      event.time ? `Starts at ${event.time}${event.location ? ' • ' + event.location : ''}` : event.location || 'Check your schedule!',
      `event-${event.id}`
    );
    if (n) notifications.push(n);
  });

  // --- Custody transition reminders ---
  if (custodySchedule) {
    const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;

    const getParentForDate = (date) => {
      const start = new Date(startDate);
      const daysDiff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
      if (pattern === 'alternating-weeks') {
        return Math.floor(daysDiff / 7) % 2 === 0 ? parent1Name : parent2Name;
      } else if (pattern === '2-2-3') {
        const cycle = ((daysDiff % 7) + 7) % 7;
        if (cycle < 2) return parent1Name;
        if (cycle < 4) return parent2Name;
        return parent1Name;
      } else if (pattern === 'weekday-weekend') {
        return (date.getDay() === 0 || date.getDay() === 6) ? parent2Name : parent1Name;
      }
      return parent1Name;
    };

    const todayParent = getParentForDate(today);

    // Check next 30 days for transitions
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const checkParent = getParentForDate(checkDate);

      if (checkParent !== todayParent || i === 1) {
        // Find the actual transition day
        const prevDate = new Date(checkDate);
        prevDate.setDate(checkDate.getDate() - 1);
        const prevParent = getParentForDate(prevDate);

        if (checkParent !== prevParent) {
          // Transition happens on checkDate
          // Notify the night before at 7pm
          const nightBefore = new Date(checkDate);
          nightBefore.setDate(checkDate.getDate() - 1);
          nightBefore.setHours(19, 0, 0, 0);

          const n1 = scheduleAt(
            nightBefore,
            '🏡 Transition Tomorrow',
            `Tomorrow you go to ${checkParent}'s. Don't forget to pack!`,
            `transition-night-${i}`
          );
          if (n1) notifications.push(n1);

          // Pack reminder 2 days before at 5pm
          const twoDaysBefore = new Date(checkDate);
          twoDaysBefore.setDate(checkDate.getDate() - 2);
          twoDaysBefore.setHours(17, 0, 0, 0);

          const n2 = scheduleAt(
            twoDaysBefore,
            '🎒 Time to Pack!',
            `You go to ${checkParent}'s in 2 days. Start getting your bag ready!`,
            `transition-pack-${i}`
          );
          if (n2) notifications.push(n2);

          // Day-of reminder at 8am
          const dayOf = new Date(checkDate);
          dayOf.setHours(8, 0, 0, 0);

          const n3 = scheduleAt(
            dayOf,
            `🏡 Today is Transition Day`,
            `Today you go to ${checkParent}'s. Have a great time!`,
            `transition-day-${i}`
          );
          if (n3) notifications.push(n3);

          break; // Only schedule for the next transition
        }
      }
    }
  }

  if (notifications.length === 0) return;

  try {
    await plugin.schedule({ notifications });
    console.log(`Scheduled ${notifications.length} local notifications`);
  } catch (e) {
    console.error('Error scheduling notifications:', e);
  }
};
