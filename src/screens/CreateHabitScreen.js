import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp, useColors } from '../AppContext';
import { scheduleHabitReminder, requestPermissions } from '../notifications';
import { HABIT_COLORS, SPACING, RADIUS } from '../theme';

const EMOJIS = ['🎯','💧','🏃','📚','🧘','😴','🥗','💪','✍️','🎸','🌿','🧠','🚴','🏊','🧗','🎨','🧹','📝','🥤','🌅'];

export default function CreateHabitScreen({ navigation, route }) {
  const editHabit = route.params?.editHabit ?? null;
  const isEdit = editHabit !== null;
  const { state, dispatch } = useApp();
  const colors = useColors();
  const s = getStyles(colors);

  const [name, setName] = useState(editHabit?.name ?? '');
  const [emoji, setEmoji] = useState(editHabit?.emoji ?? '🎯');
  const [type, setType] = useState(editHabit?.type ?? 'once');
  const [targetCount, setTargetCount] = useState(editHabit?.targetCount ?? 3);
  const [color, setColor] = useState(editHabit?.color ?? HABIT_COLORS[0]);
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
      emoji,
      type,
      targetCount: type === 'volume' ? targetCount : 1,
      color,
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

          <Text style={s.label}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.emojiScroll}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[s.emojiBtn, emoji === e && { backgroundColor: color + '33', borderColor: color }]}
                onPress={() => setEmoji(e)}
              >
                <Text style={{ fontSize: 26 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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

          <Text style={s.label}>Type</Text>
          <View style={s.typeRow}>
            {[['once', '☑️ Once per day', 'Tap once to complete'], ['volume', '🔢 Volume', 'Tap multiple times']].map(([val, label, hint]) => (
              <TouchableOpacity
                key={val}
                style={[s.typeCard, type === val && { borderColor: color, backgroundColor: color + '11' }]}
                onPress={() => setType(val)}
              >
                <Text style={[s.typeCardLabel, type === val && { color }]}>{label}</Text>
                <Text style={s.typeCardHint}>{hint}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'volume' && (
            <View>
              <Text style={s.label}>Times per day</Text>
              <View style={s.counter}>
                <TouchableOpacity onPress={() => setTargetCount(Math.max(2, targetCount - 1))} style={[s.counterBtn, { borderColor: color }]}>
                  <Text style={[s.counterBtnText, { color }]}>−</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{targetCount}</Text>
                <TouchableOpacity onPress={() => setTargetCount(Math.min(30, targetCount + 1))} style={[s.counterBtn, { borderColor: color }]}>
                  <Text style={[s.counterBtnText, { color }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={s.label}>Color</Text>
          <View style={s.colorRow}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotSelected]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <Text style={s.label}>Reminder</Text>
          <View style={s.reminderCard}>
            <View style={s.reminderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={{ fontSize: 22 }}>🔔</Text>
                <View>
                  <Text style={s.reminderTitle}>Daily Reminder</Text>
                  <Text style={s.reminderDesc}>{reminder.enabled ? formatTime(reminder.hour, reminder.minute) : 'Off'}</Text>
                </View>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={toggleReminder}
                trackColor={{ false: colors.border, true: color }}
                thumbColor='#fff'
              />
            </View>
            {reminder.enabled && (
              <View style={s.timePicker}>
                <TouchableOpacity style={[s.stepBtn, { borderColor: color }]} onPress={() => setReminder(r => ({ ...r, hour: (r.hour + 23) % 24 }))}>
                  <Text style={[s.stepBtnText, { color }]}>−</Text>
                </TouchableOpacity>
                <Text style={s.timeUnit}>{reminder.hour.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={[s.stepBtn, { borderColor: color }]} onPress={() => setReminder(r => ({ ...r, hour: (r.hour + 1) % 24 }))}>
                  <Text style={[s.stepBtnText, { color }]}>+</Text>
                </TouchableOpacity>
                <Text style={s.timeSep}>:</Text>
                <TouchableOpacity style={[s.stepBtn, { borderColor: color }]} onPress={() => setReminder(r => ({ ...r, minute: prevMinute(r.minute) }))}>
                  <Text style={[s.stepBtnText, { color }]}>−</Text>
                </TouchableOpacity>
                <Text style={s.timeUnit}>{reminder.minute.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={[s.stepBtn, { borderColor: color }]} onPress={() => setReminder(r => ({ ...r, minute: nextMinute(r.minute) }))}>
                  <Text style={[s.stepBtnText, { color }]}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={s.label}>Preview</Text>
          <View style={[s.preview, { borderLeftColor: color }]}>
            <Text style={{ fontSize: 26 }}>{emoji}</Text>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={s.previewName}>{name || 'Your habit name'}</Text>
              <Text style={s.previewType}>{type === 'volume' ? `${targetCount}× per day` : 'Once per day'}</Text>
            </View>
            <View style={[s.previewCheck, { borderColor: color }]} />
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
      backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    cancel: { color: colors.textSecondary, fontSize: 16 },
    title: { fontWeight: '700', fontSize: 17, color: colors.text },
    save: { color: colors.primary, fontWeight: '700', fontSize: 16 },
    saveDisabled: { opacity: 0.35 },
    form: { padding: SPACING.lg, paddingBottom: 60 },
    label: {
      fontWeight: '600', color: colors.textSecondary, fontSize: 13,
      marginBottom: SPACING.sm, marginTop: SPACING.md,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    emojiScroll: { marginBottom: SPACING.sm },
    emojiBtn: {
      marginRight: SPACING.sm, padding: 8, borderRadius: RADIUS.md,
      borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.card,
    },
    input: {
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
      fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border,
      marginBottom: SPACING.sm,
    },
    typeRow: { flexDirection: 'row', gap: SPACING.sm },
    typeCard: {
      flex: 1, borderWidth: 2, borderColor: colors.border,
      borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: colors.card,
    },
    typeCardLabel: { fontWeight: '600', fontSize: 14, color: colors.text, marginBottom: 4 },
    typeCardHint: { fontSize: 12, color: colors.textSecondary },
    counter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl, marginBottom: SPACING.sm },
    counterBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    counterBtnText: { fontSize: 22, fontWeight: '600', lineHeight: 26 },
    counterVal: { fontSize: 28, fontWeight: '800', color: colors.text, minWidth: 40, textAlign: 'center' },
    colorRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.sm },
    colorDot: { width: 32, height: 32, borderRadius: 16 },
    colorDotSelected: {
      borderWidth: 3, borderColor: '#fff',
      shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 }, elevation: 4,
    },
    reminderCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.md,
      padding: SPACING.md, borderWidth: 1, borderColor: colors.border,
    },
    reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reminderTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    reminderDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    timePicker: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, marginTop: SPACING.md, paddingTop: SPACING.md,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    stepBtnText: { fontSize: 20, fontWeight: '600', lineHeight: 24 },
    timeUnit: { fontSize: 22, fontWeight: '700', color: colors.text, minWidth: 36, textAlign: 'center' },
    timeSep: { fontSize: 22, fontWeight: '700', color: colors.textSecondary },
    preview: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    previewName: { fontSize: 16, fontWeight: '600', color: colors.text },
    previewType: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    previewCheck: { width: 26, height: 26, borderRadius: 8, borderWidth: 2 },
  });
}
