import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useApp, useColors } from '../AppContext';
import { calcStreak, dateKey } from '../storage';
import { cancelHabitReminder } from '../notifications';
import { SPACING, RADIUS } from '../theme';

export default function ManageScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const { habits, logs, darkMode } = state;
  const [showDevTools, setShowDevTools] = useState(false);
  const [pastDays, setPastDays] = useState(3);
  const s = getStyles(colors);

  const formatTime = (h, m) => {
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  const openCreate = () => {
    const parent = navigation.getParent();
    (parent || navigation).navigate('CreateHabit');
  };

  const openEdit = (habit) => {
    const parent = navigation.getParent();
    (parent || navigation).navigate('CreateHabit', { editHabit: habit });
  };

  const confirmDelete = (habit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Habit',
      `Remove "${habit.name}"? All history for this habit will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { dispatch({ type: 'DELETE_HABIT', id: habit.id }); cancelHabitReminder(habit.id).catch(() => {}); } },
      ]
    );
  };

  const toggleDark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  const openHowItWorks = () => {
    const parent = navigation.getParent();
    (parent || navigation).navigate('HowItWorks');
  };

  const devCompleteAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: 'COMPLETE_ALL_TODAY' });
  };

  const devResetToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: 'CLEAR_TODAY_LOGS' });
  };

  const devRestartChallenge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const challenge = {
      id: 'kickstart',
      name: '3-Day Kickstart',
      days: 3,
      startDate: dateKey(),
      habitIds: habits.map(h => h.id),
      completed: false,
    };
    dispatch({ type: 'SET_CHALLENGE', challenge });
  };

  const devResetOnboarding = () => {
    Alert.alert('Reset Onboarding', 'Clears all data. Close and reopen the app to see onboarding again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          dispatch({ type: 'WIPE_ALL' });
          await AsyncStorage.multiRemove(['onboarded', 'darkMode']);
          Alert.alert('Done', 'Restart the app to go through onboarding again.');
        },
      },
    ]);
  };

  const devCompletePastDays = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: 'COMPLETE_PAST_DAYS', days: pastDays });
  };

  const devWipeAll = () => {
    Alert.alert('Clear All Data', 'Deletes all habits, logs, and progress. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => dispatch({ type: 'WIPE_ALL' }) },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.title}>Manage</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate}>
          <Text style={s.addBtnText}>+ Add Habit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* App info */}
        <Text style={s.sectionLabel}>App</Text>
        <TouchableOpacity style={s.settingRow} onPress={openHowItWorks} activeOpacity={0.75}>
          <View style={s.settingLeft}>
            <Text style={s.settingEmoji}>❓</Text>
            <View>
              <Text style={s.settingTitle}>How it works</Text>
              <Text style={s.settingDesc}>A quick guide to using Antigravity</Text>
            </View>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* Appearance section */}
        <Text style={s.sectionLabel}>Appearance</Text>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Text style={s.settingEmoji}>{darkMode ? '🌙' : '☀️'}</Text>
            <View>
              <Text style={s.settingTitle}>{darkMode ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={s.settingDesc}>Switch the app theme</Text>
            </View>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleDark}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={darkMode ? '#fff' : '#fff'}
          />
        </View>

        {/* Habits section */}
        <Text style={s.sectionLabel}>My Habits</Text>
        {habits.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌱</Text>
            <Text style={s.emptyTitle}>No habits yet</Text>
            <Text style={s.emptyHint}>Add your first habit to get started.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openCreate}>
              <Text style={s.emptyBtnText}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.hint}>Tap ✏️ to edit · Tap 🗑️ to delete</Text>
            {habits.map((habit) => {
              const streak = calcStreak(logs, habit);
              return (
                <View key={habit.id} style={[s.card, { borderLeftColor: habit.color }]}>
                  <Text style={s.cardEmoji}>{habit.emoji}</Text>
                  <View style={s.cardInfo}>
                    <Text style={s.cardName} numberOfLines={1}>{habit.name}</Text>
                    <View style={s.cardMeta}>
                      <View style={[s.metaBadge, { backgroundColor: habit.color + '22' }]}>
                        <Text style={[s.metaBadgeText, { color: habit.color }]}>
                          {habit.type === 'volume' ? `${habit.targetCount}× daily` : 'Once daily'}
                        </Text>
                      </View>
                      {streak > 0 && (
                        <View style={s.streakBadge}>
                          <Text style={s.streakText}>🔥 {streak}d</Text>
                        </View>
                      )}
                      {habit.reminder?.enabled && (
                        <View style={s.reminderBadge}>
                          <Text style={s.reminderBadgeText}>🔔 {formatTime(habit.reminder.hour, habit.reminder.minute)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(habit)}>
                    <Text style={s.iconBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} onPress={() => confirmDelete(habit)}>
                    <Text style={s.iconBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Developer / Test Tools */}
        <TouchableOpacity style={s.devToggle} onPress={() => setShowDevTools(v => !v)} activeOpacity={0.7}>
          <Text style={s.devToggleText}>🛠 Test Tools {showDevTools ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showDevTools && (
          <View style={s.devSection}>
            <TouchableOpacity style={s.devBtn} onPress={devCompleteAll}>
              <Text style={s.devBtnText}>{'✅  Complete all habits today'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.devBtn} onPress={devResetToday}>
              <Text style={s.devBtnText}>{'↩️  Reset today\'s progress'}</Text>
            </TouchableOpacity>

            <View style={[s.devBtn, s.devBtnRow]}>
              <Text style={[s.devBtnText, { flex: 1 }]}>{'📅  Complete past days'}</Text>
              <View style={s.stepper}>
                <TouchableOpacity style={s.stepperBtn} onPress={() => setPastDays(d => Math.max(1, d - 1))}>
                  <Text style={s.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.stepperVal}>{pastDays}</Text>
                <TouchableOpacity style={s.stepperBtn} onPress={() => setPastDays(d => Math.min(30, d + 1))}>
                  <Text style={s.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.stepperRun} onPress={devCompletePastDays}>
                <Text style={s.stepperRunText}>Run</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.devBtn} onPress={devRestartChallenge}>
              <Text style={s.devBtnText}>{'🔄  Restart 3-day challenge'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.devBtn, s.devBtnDanger]} onPress={devWipeAll}>
              <Text style={[s.devBtnText, s.devBtnTextDanger]}>{'🗑️  Clear all data'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.devBtn, s.devBtnDanger]} onPress={devResetOnboarding}>
              <Text style={[s.devBtnText, s.devBtnTextDanger]}>{'🔁  Reset onboarding'}</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
      backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    addBtn: { backgroundColor: colors.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    content: { padding: SPACING.lg, paddingBottom: 100 },
    sectionLabel: {
      fontSize: 12, fontWeight: '700', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.6,
      marginBottom: SPACING.sm, marginTop: SPACING.md,
    },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md,
      marginBottom: SPACING.sm,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    settingEmoji: { fontSize: 24 },
    settingTitle: { fontWeight: '600', fontSize: 15, color: colors.text },
    settingDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    hint: { fontSize: 12, color: colors.textSecondary, marginBottom: SPACING.sm },
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md,
      marginBottom: SPACING.sm, borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
      gap: SPACING.sm,
    },
    cardEmoji: { fontSize: 26 },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
    cardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    metaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
    metaBadgeText: { fontSize: 11, fontWeight: '700' },
    streakBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: colors.darkMode ? '#2A1F00' : '#FFF3E0' },
    streakText: { fontSize: 11, fontWeight: '700', color: colors.warning },
    reminderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: colors.background },
    reminderBadgeText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    iconBtnText: { fontSize: 16 },
    devToggle: { marginTop: SPACING.xl, alignSelf: 'center', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
    devToggleText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    devSection: { gap: SPACING.sm, marginTop: SPACING.sm },
    devBtn: {
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
      borderWidth: 1, borderColor: colors.border,
    },
    devBtnRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    devBtnDanger: { borderColor: colors.danger + '44' },
    devBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
    devBtnTextDanger: { color: colors.danger },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    stepperBtnText: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 20 },
    stepperVal: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },
    stepperRun: { backgroundColor: colors.primary, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.md },
    stepperRunText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    empty: { alignItems: 'center', paddingTop: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm },
    emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    emptyBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
