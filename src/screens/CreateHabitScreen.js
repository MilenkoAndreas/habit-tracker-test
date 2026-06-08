import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp, useColors } from '../AppContext';
import { scheduleHabitReminder, requestPermissions } from '../notifications';
import { SPACING, RADIUS } from '../theme';
import { ICON_PICKER_ITEMS, ICON_MAP } from '../components/icons/index';

export default function CreateHabitScreen({ navigation, route }) {
  const editHabit = route.params?.editHabit ?? null;
  const isEdit = editHabit !== null;
  const { dispatch } = useApp();
  const colors = useColors();
  const s = useMemo(() => getStyles(colors), [colors]);

  const [name, setName] = useState(editHabit?.name ?? '');
  // Default icon key; fall back gracefully if editing a legacy emoji habit
  const defaultIcon = ICON_MAP[editHabit?.emoji] ? editHabit.emoji : 'run';
  const [iconKey, setIconKey] = useState(defaultIcon);
  const [type, setType] = useState(editHabit?.type ?? 'once');
  const [targetCount, setTargetCount] = useState(editHabit?.targetCount ?? 3);
  const [reminder, setReminder] = useState(editHabit?.reminder ?? { enabled: false, hour: 9, minute: 0 });

  const nextMinute = (m) => (Math.floor(m / 5) * 5 + 5) % 60;
  const prevMinute = (m) => ((Math.ceil(m / 5) * 5 - 5) + 60) % 60;
  const formatTime = (h, m) => {
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  const toggleReminder = async (val) => {
    if (val) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Notifications Blocked', 'Enable notifications in your device settings to use reminders.');
        return;
      }
    }
    setReminder(r => ({ ...r, enabled: val }));
  };

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please give your habit a name.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const habit = {
      id: isEdit ? editHabit.id : Date.now().toString(),
      name: name.trim(),
      emoji: iconKey,      // stores icon key e.g. 'run', 'book'
      type,
      targetCount: type === 'volume' ? targetCount : 1,
      color: '#111111',    // kept for sync compat; no longer displayed
      reminder,
      createdAt: isEdit ? editHabit.createdAt : new Date().toISOString(),
    };
    if (isEdit) {
      dispatch({ type: 'UPDATE_HABIT', habit });
    } else {
      dispatch({ type: 'ADD_HABIT', habit });
    }
    scheduleHabitReminder(habit).catch(() => {});
    navigation.goBack();
  };

  const SelectedIconComponent = ICON_MAP[iconKey];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.title}>{isEdit ? 'Edit Habit' : 'New Habit'}</Text>
          <TouchableOpacity onPress={save}>
            <Text style={[s.save, !name.trim() && s.saveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {/* Icon picker */}
          <Text style={s.label}>Icon</Text>
          <View style={s.iconGrid}>
            {ICON_PICKER_ITEMS.map(({ key, label, Component }) => {
              const selected = iconKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.iconGridItem, selected && s.iconGridItemSelected]}
                  onPress={() => { setIconKey(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Component color={selected ? '#ffffff' : colors.text} size={26} />
                  <Text style={[s.iconLabel, selected && s.iconLabelSelected]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Name */}
          <Text style={s.label}>Name</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Morning run, Drink water…"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            autoFocus={!isEdit}
          />

          {/* Type */}
          <Text style={s.label}>Type</Text>
          <View style={s.typeRow}>
            {[
              ['once', 'Once per day', 'Tap once to complete'],
              ['volume', 'Volume', 'Tap multiple times'],
            ].map(([val, label, hint]) => (
              <TouchableOpacity
                key={val}
                style={[s.typeCard, type === val && s.typeCardSelected]}
                onPress={() => setType(val)}
              >
                <Text style={[s.typeCardLabel, type === val && s.typeCardLabelSelected]}>{label}</Text>
                <Text style={s.typeCardHint}>{hint}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Volume count */}
          {type === 'volume' && (
            <View>
              <Text style={s.label}>Times per day</Text>
              <View style={s.counter}>
                <TouchableOpacity onPress={() => setTargetCount(Math.max(2, targetCount - 1))} style={s.counterBtn}>
                  <Text style={s.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{targetCount}</Text>
                <TouchableOpacity onPress={() => setTargetCount(Math.min(30, targetCount + 1))} style={s.counterBtn}>
                  <Text style={s.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reminder */}
          <Text style={s.label}>Reminder</Text>
          <View style={s.reminderCard}>
            <View style={s.reminderRow}>
              <View>
                <Text style={s.reminderTitle}>Daily Reminder</Text>
                <Text style={s.reminderDesc}>{reminder.enabled ? formatTime(reminder.hour, reminder.minute) : 'Off'}</Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={toggleReminder}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            {reminder.enabled && (
              <View style={s.timePicker}>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, hour: (r.hour + 23) % 24 }))}>
                  <Text style={s.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.timeUnit}>{reminder.hour.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, hour: (r.hour + 1) % 24 }))}>
                  <Text style={s.stepBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={s.timeSep}>:</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, minute: prevMinute(r.minute) }))}>
                  <Text style={s.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.timeUnit}>{reminder.minute.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, minute: nextMinute(r.minute) }))}>
                  <Text style={s.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Preview */}
          <Text style={s.label}>Preview</Text>
          <View style={s.preview}>
            <View style={s.previewTile}>
              {SelectedIconComponent && <SelectedIconComponent color="#ffffff" size={20} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.previewName}>{name || 'Your habit name'}</Text>
              <Text style={s.previewType}>{type === 'volume' ? `${targetCount}× per day` : 'Once per day'}</Text>
            </View>
            <View style={s.previewCheck} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
      backgroundColor: colors.card, borderBottomWidth: 1.5, borderBottomColor: colors.border,
    },
    cancel: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
    title: { fontWeight: '800', fontSize: 17, color: colors.text },
    save: { color: colors.primary, fontWeight: '800', fontSize: 16 },
    saveDisabled: { opacity: 0.35 },
    form: { padding: SPACING.lg, paddingBottom: 60 },
    label: {
      fontWeight: '700', color: colors.textSecondary, fontSize: 10,
      marginBottom: SPACING.sm, marginTop: SPACING.md,
      textTransform: 'uppercase', letterSpacing: 1.5,
    },
    iconGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm,
    },
    iconGridItem: {
      width: '18%', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12,
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', gap: 5,
    },
    iconGridItemSelected: {
      backgroundColor: colors.primary, borderColor: colors.primary,
    },
    iconLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary },
    iconLabelSelected: { color: '#fff' },
    input: {
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
      fontSize: 16, fontWeight: '600', color: colors.text,
      borderWidth: 1.5, borderColor: colors.border, marginBottom: SPACING.sm,
    },
    typeRow: { flexDirection: 'row', gap: SPACING.sm },
    typeCard: {
      flex: 1, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: colors.card,
    },
    typeCardSelected: { borderColor: colors.text, backgroundColor: colors.background },
    typeCardLabel: { fontWeight: '700', fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
    typeCardLabelSelected: { color: colors.text },
    typeCardHint: { fontSize: 11, color: colors.textSecondary },
    counter: {
      flexDirection: 'row', alignItems: 'center',
      gap: SPACING.xl, marginBottom: SPACING.sm,
    },
    counterBtn: {
      width: 40, height: 40, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    counterBtnText: { fontSize: 22, fontWeight: '600', color: colors.text, lineHeight: 26 },
    counterVal: { fontSize: 28, fontWeight: '900', color: colors.text, minWidth: 40, textAlign: 'center' },
    reminderCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.md,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
    },
    reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reminderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    reminderDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
    timePicker: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, marginTop: SPACING.md, paddingTop: SPACING.md,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    stepBtn: {
      width: 36, height: 36, borderRadius: 18,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    stepBtnText: { fontSize: 20, fontWeight: '600', color: colors.text, lineHeight: 24 },
    timeUnit: { fontSize: 22, fontWeight: '900', color: colors.text, minWidth: 36, textAlign: 'center' },
    timeSep: { fontSize: 22, fontWeight: '700', color: colors.textSecondary },
    preview: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border, gap: SPACING.sm,
    },
    previewTile: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: '#111111',
      alignItems: 'center', justifyContent: 'center',
    },
    previewName: { fontSize: 15, fontWeight: '700', color: colors.text },
    previewType: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
    previewCheck: {
      width: 24, height: 24, borderRadius: 7,
      borderWidth: 2, borderColor: colors.border,
    },
  });
}
