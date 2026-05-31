import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleHabitReminder(habit) {
  const notifId = `habit-${habit.id}`;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch {}
  if (!habit.reminder?.enabled) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: `${habit.emoji} ${habit.name}`,
        body: "Time to log your habit and keep the streak going 🔥",
      },
      trigger: { hour: habit.reminder.hour, minute: habit.reminder.minute, repeats: true },
    });
  } catch {}
}

export async function cancelHabitReminder(habitId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`);
  } catch {}
}

export async function cancelReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
