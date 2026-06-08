import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  habits: 'habits',
  logs: 'logs',
  challenge: 'challenge',
  onboarded: 'onboarded',
};

export async function loadHabits() {
  const raw = await AsyncStorage.getItem(KEYS.habits);
  return raw ? JSON.parse(raw) : [];
}

export async function saveHabits(habits) {
  await AsyncStorage.setItem(KEYS.habits, JSON.stringify(habits));
}

export async function loadLogs() {
  const raw = await AsyncStorage.getItem(KEYS.logs);
  return raw ? JSON.parse(raw) : [];
}

export async function saveLogs(logs) {
  await AsyncStorage.setItem(KEYS.logs, JSON.stringify(logs));
}

export async function loadChallenge() {
  const raw = await AsyncStorage.getItem(KEYS.challenge);
  return raw ? JSON.parse(raw) : null;
}

export async function saveChallenge(challenge) {
  await AsyncStorage.setItem(KEYS.challenge, JSON.stringify(challenge));
}

export async function isOnboarded() {
  const val = await AsyncStorage.getItem(KEYS.onboarded);
  return val === 'true';
}

export async function setOnboarded() {
  await AsyncStorage.setItem(KEYS.onboarded, 'true');
}

// Returns YYYY-MM-DD for a date
export function dateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Count completions for a habit on a given date
export function countForDate(logs, habitId, date) {
  return logs.filter(l => l.habitId === habitId && l.date === date).length;
}

// Calculate current streak (consecutive days with target met)
export function calcStreak(logs, habit) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const count = countForDate(logs, habit.id, key);
    if (count >= habit.targetCount) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

const DEFAULT_NOTIFICATION_PREFS = {
  enabled: true,
  morning: { enabled: true, hour: 9, minute: 0 },
  evening: { enabled: true, hour: 19, minute: 0 },
};

export async function loadNotificationPrefs() {
  const raw = await AsyncStorage.getItem('notificationPrefs');
  return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATION_PREFS;
}

export async function saveNotificationPrefs(prefs) {
  await AsyncStorage.setItem('notificationPrefs', JSON.stringify(prefs));
}

// Get completion % for each of last N days across all habits
// Overall streak: consecutive days where ALL habits were completed.
// Today gets a grace period (i === 0 doesn't break) so the streak reads as
// "still alive" while the day is in progress.
export function calcOverallStreak(logs, habits) {
  if (habits.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const allDone = habits.every(h => countForDate(logs, h.id, key) >= h.targetCount);
    if (allDone) streak++;
    else if (i > 0) break;
  }
  return streak;
}

// Best ever streak across the last 365 days.
export function calcBestStreak(logs, habits) {
  if (habits.length === 0) return 0;
  let best = 0, cur = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const allDone = habits.every(h => countForDate(logs, h.id, key) >= h.targetCount);
    if (allDone) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

export function weeklyStats(logs, habits, days = 7) {
  const stats = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const completed = habits.filter(h => countForDate(logs, h.id, key) >= h.targetCount).length;
    stats.push({ date: key, pct: habits.length > 0 ? completed / habits.length : 0, label: d.toLocaleDateString('en-US', { weekday: 'short' }) });
  }
  return stats;
}
