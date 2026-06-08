import { supabase } from './supabase';

// ── Format converters ──────────────────────────────────────────────────────

function habitToDb(habit, userId) {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    emoji: habit.emoji,
    type: habit.type,
    target_count: habit.targetCount,
    color: habit.color,
    reminder: habit.reminder ?? { enabled: false, hour: 9, minute: 0 },
    created_at: habit.createdAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function dbToHabit(row) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    type: row.type,
    targetCount: row.target_count,
    color: row.color,
    reminder: row.reminder,
    createdAt: row.created_at,
  };
}

function logToDb(log, userId) {
  return {
    id: log.id,
    user_id: userId,
    habit_id: log.habitId,
    date: log.date,
    completed_at: log.completedAt ?? new Date().toISOString(),
  };
}

function dbToLog(row) {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedAt: row.completed_at,
  };
}

// ── Push (local → Supabase) ────────────────────────────────────────────────

export async function pushHabit(habit, userId) {
  const { error } = await supabase.from('habits').upsert(habitToDb(habit, userId));
  if (error) throw error;
}

export async function softDeleteHabit(habitId) {
  const { error } = await supabase
    .from('habits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', habitId);
  if (error) throw error;
}

export async function pushLog(log, userId) {
  const { error } = await supabase.from('completions').upsert(logToDb(log, userId));
  if (error) throw error;
}

export async function deleteLog(logId) {
  const { error } = await supabase.from('completions').delete().eq('id', logId);
  if (error) throw error;
}

export async function pushChallenge(challenge, userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ challenge, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function pushSettings(settings, userId) {
  const update = { updated_at: new Date().toISOString() };
  if (settings.darkMode !== undefined) update.dark_mode = settings.darkMode;
  if (settings.notificationPrefs !== undefined) update.notification_prefs = settings.notificationPrefs;
  if (settings.onboarded !== undefined) update.onboarded = settings.onboarded;

  const { error } = await supabase.from('profiles').update(update).eq('id', userId);
  if (error) throw error;
}

// ── Pull (Supabase → local) ────────────────────────────────────────────────

export async function pullAll(userId) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 400); // covers the full 365-day streak loop window
  const cutoffKey = cutoff.toISOString().split('T')[0];

  const [habitsRes, completionsRes, profileRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId).is('deleted_at', null),
    supabase.from('completions').select('*').eq('user_id', userId).gte('date', cutoffKey),
    supabase.from('profiles').select('*').eq('id', userId).single(),
  ]);

  if (habitsRes.error || completionsRes.error || profileRes.error) return null;

  const habits = (habitsRes.data ?? []).map(dbToHabit);
  const logs = (completionsRes.data ?? []).map(dbToLog);
  const challenge = profileRes.data?.challenge ?? null;
  const darkMode = profileRes.data?.dark_mode ?? false;
  const notificationPrefs = profileRes.data?.notification_prefs ?? null;
  const onboarded = profileRes.data?.onboarded ?? false;

  return { habits, logs, challenge, darkMode, notificationPrefs, onboarded };
}
