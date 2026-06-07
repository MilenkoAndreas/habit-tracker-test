import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useApp, useColors } from '../AppContext';
import { useAuth } from '../AuthContext';
import { calcStreak, dateKey } from '../storage';
import { cancelHabitReminder } from '../notifications';
import { SPACING, RADIUS } from '../theme';
import { ICON_MAP } from '../components/icons/index';

export default function ManageScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const { signOut } = useAuth();
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

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Appearance section */}
        <Text style={s.sectionLabel}>Appearance</Text>
        <View style={s.settingRow}>
          <Text style={s.settingLabel}>{darkMode ? 'Dark Mode' : 'Light Mode'}</Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDark}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={darkMode ? '#fff' : '#fff'}
          />
        </View>

        {/* App info */}
        <Text style={s.sectionLabel}>App</Text>
        <TouchableOpacity style={s.settingRow} onPress={openHowItWorks} activeOpacity={0.75}>
          <Text style={s.settingLabel}>How it works</Text>
          <Text style={s.settingValue}>›</Text>
        </TouchableOpacity>

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
            {habits.map((habit) => {
              const IconComp = ICON_MAP[habit.emoji];
              return (
                <View key={habit.id} style={s.habitRow}>
                  <View style={s.habitIconTile}>
                    {IconComp
                      ? <IconComp color={colors.card} size={18} />
                      : <Text style={{ fontSize: 18 }}>{habit.emoji}</Text>}
                  </View>
                  <Text style={s.habitName} numberOfLines={1}>{habit.name}</Text>
                  <Text style={s.habitStreak}>{calcStreak(logs, habit)} day streak</Text>
                  <View style={s.habitActions}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(habit)}>
                      <Text style={s.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => confirmDelete(habit)}>
                      <Text style={[s.actionBtnText, s.deleteBtnText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={s.addRow}>
              <View style={s.addIcon}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>+</Text>
              </View>
              <TouchableOpacity onPress={openCreate}>
                <Text style={s.addText}>Add Habit</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.75}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Developer / Test Tools */}
        <View style={s.devSection}>
        <TouchableOpacity style={s.devToggle} onPress={() => setShowDevTools(v => !v)} activeOpacity={0.7}>
          <Text style={s.devToggleText}>Test Tools {showDevTools ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showDevTools && (
          <>
            <TouchableOpacity style={s.devBtn} onPress={devCompleteAll}>
              <Text style={s.devBtnText}>{'Complete all habits today'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.devBtn} onPress={devResetToday}>
              <Text style={s.devBtnText}>{"Reset today's progress"}</Text>
            </TouchableOpacity>

            <View style={[s.devBtn, s.devBtnRow]}>
              <Text style={[s.devBtnText, { flex: 1 }]}>{'Complete past days'}</Text>
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
              <Text style={s.devBtnText}>{'Restart 3-day challenge'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.devBtn, s.devBtnDanger]} onPress={devWipeAll}>
              <Text style={[s.devBtnText, s.devBtnTextDanger]}>{'Clear all data'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.devBtn, s.devBtnDanger]} onPress={devResetOnboarding}>
              <Text style={[s.devBtnText, s.devBtnTextDanger]}>{'Reset onboarding'}</Text>
            </TouchableOpacity>
          </>
        )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 100 },

    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
      backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    addBtn: { backgroundColor: colors.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    sectionLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', color: colors.textSecondary,
      paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
    },

    settingRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: SPACING.lg, paddingVertical: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    settingLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
    settingValue: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

    habitRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      paddingHorizontal: SPACING.lg, paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    habitIconTile: {
      width: 36, height: 36, borderRadius: 9,
      backgroundColor: colors.text,
      alignItems: 'center', justifyContent: 'center',
    },
    habitName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
    habitStreak: { fontSize: 12, fontWeight: '700', color: colors.primary },
    habitActions: { flexDirection: 'row', gap: SPACING.sm },
    actionBtn: {
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: colors.border,
    },
    actionBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    deleteBtn: { borderColor: colors.danger },
    deleteBtnText: { color: colors.danger },

    addRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      paddingHorizontal: SPACING.lg, paddingVertical: 14,
      backgroundColor: colors.card,
    },
    addIcon: {
      width: 36, height: 36, borderRadius: 9,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    addText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },

    signOutBtn: {
      marginHorizontal: SPACING.lg, marginTop: SPACING.xl,
      paddingVertical: 14, borderRadius: RADIUS.full,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center',
    },
    signOutText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },

    devSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg },
    devToggle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    devToggleText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    devBtn: {
      paddingVertical: 10, borderRadius: RADIUS.md,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', marginBottom: SPACING.sm,
    },
    devBtnRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    devBtnDanger: { borderColor: colors.danger + '44' },
    devBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    devBtnTextDanger: { color: colors.danger },

    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    stepperBtnText: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 20 },
    stepperVal: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },
    stepperRun: { backgroundColor: colors.primary, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.md },
    stepperRunText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: SPACING.lg },
    emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm },
    emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    emptyBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
