import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../AppContext';
import { useAuth } from '../AuthContext';
import { useColors } from '../AppContext';
import { setOnboarded, dateKey } from '../storage';
import { requestPermissions } from '../notifications';
import { pushSettings } from '../sync';
import { SPACING, RADIUS } from '../theme';
import { ICON_PICKER_ITEMS, ICON_MAP } from '../components/icons/index';

// Step 0: explainer. Step 1: create habit. Step 2: challenge.
const TOTAL_STEPS = 3;

const HOW_IT_WORKS = [
  { num: '1', title: 'Add your habits', desc: 'Pick anything you want to do every day — exercise, reading, drinking water, whatever matters to you.' },
  { num: '2', title: 'Tap when done', desc: 'Each day, tap a habit to mark it complete. All done? You\'ll get a celebration and your streak grows.' },
  { num: '3', title: 'Track your progress', desc: 'See your streaks, history and stats. Consistency is the goal — Habit Tracker keeps score for you.' },
];

export default function OnboardingScreen({ navigation }) {
  const { dispatch } = useApp();
  const { session } = useAuth();
  const colors = useColors();
  const s = getStyles(colors);

  const [step, setStep] = useState(0);
  const [habitName, setHabitName] = useState('');
  const [iconKey, setIconKey] = useState('run');
  const [type, setType] = useState('once');
  const [targetCount, setTargetCount] = useState(1);
  const fade = useRef(new Animated.Value(1)).current;

  const transition = (fn) => {
    Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    transition(() => setStep(s => s + 1));
  };

  const finishOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (habitName.trim()) {
      const habit = {
        id: Date.now().toString(),
        name: habitName.trim(),
        emoji: iconKey,
        type,
        targetCount: type === 'volume' ? targetCount : 1,
        color: '#111111',
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_HABIT', habit });

      const challenge = {
        id: 'kickstart',
        name: '3-Day Kickstart',
        days: 3,
        startDate: dateKey(),
        habitIds: [habit.id],
        completed: false,
      };
      dispatch({ type: 'SET_CHALLENGE', challenge });

      requestPermissions().catch(() => {});
    }

    await setOnboarded();
    if (session?.user?.id) {
      pushSettings({ onboarded: true }, session.user.id).catch(() => {});
    }
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>

        <Animated.View style={[s.content, { opacity: fade }]}>

          {/* ── Step 0: How it works ── */}
          {step === 0 && (
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text style={s.stepLabel}>Welcome</Text>
                <Text style={s.heading}>Build habits that stick.</Text>
                <Text style={s.subheading}>Three simple steps to a consistent routine.</Text>

                <View>
                  {HOW_IT_WORKS.map((item, i) => (
                    <View key={i} style={s.howCard}>
                      <View style={s.howCardNum}>
                        <Text style={s.howCardNumText}>{item.num}</Text>
                      </View>
                      <Text style={s.howCardTitle}>{item.title}</Text>
                      <Text style={s.howCardDesc}>{item.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <TouchableOpacity style={s.primaryBtn} onPress={nextStep}>
                  <Text style={s.primaryBtnText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Step 1: Create first habit ── */}
          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
              <Text style={s.stepLabel}>Step 1 of 2</Text>
              <Text style={s.heading}>Your first habit</Text>
              <Text style={s.subheading}>What do you want to build consistency around?</Text>

              <Text style={[s.stepLabel, { marginBottom: SPACING.sm }]}>Choose an icon</Text>
              <View style={s.iconGrid}>
                {ICON_PICKER_ITEMS.map(({ key, label, Component }) => {
                  const selected = iconKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[s.iconGridItem, selected && s.iconGridItemSelected]}
                      onPress={() => setIconKey(key)}
                    >
                      <Component color={selected ? colors.card : colors.text} size={20} />
                      <Text style={[s.iconLabel, selected && s.iconLabelSelected]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.stepLabel, { marginBottom: SPACING.sm }]}>Habit name</Text>
              <TextInput
                style={s.nameInput}
                placeholder="e.g. Drink 8 glasses of water"
                placeholderTextColor={colors.textSecondary}
                value={habitName}
                onChangeText={setHabitName}
                returnKeyType="done"
              />

              <Text style={[s.stepLabel, { marginBottom: SPACING.sm }]}>Type</Text>
              <View style={s.typeRow}>
                {[['once', 'Once per day', 'Simple done / not done'], ['volume', 'Multiple times', 'Track a count goal']].map(([val, label, hint]) => (
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

              {type === 'volume' && (
                <View style={{ marginBottom: SPACING.md }}>
                  <Text style={[s.stepLabel, { marginBottom: SPACING.sm }]}>Times per day: {targetCount}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                    <TouchableOpacity
                      onPress={() => setTargetCount(Math.max(2, targetCount - 1))}
                      style={{ backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', minWidth: 32, textAlign: 'center' }}>{targetCount}</Text>
                    <TouchableOpacity
                      onPress={() => setTargetCount(Math.min(20, targetCount + 1))}
                      style={{ backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[s.primaryBtn, !habitName.trim() && { opacity: 0.4 }]}
                onPress={nextStep}
                disabled={!habitName.trim()}
              >
                <Text style={s.primaryBtnText}>Next</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── Step 2: Challenge ── */}
          {step === 2 && (
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text style={s.stepLabel}>Step 2 of 2</Text>
                <Text style={s.heading}>3-Day Kickstart</Text>
                <Text style={s.subheading}>
                  Complete your habits for 3 days in a row and claim your first achievement. Daily reminders will keep you on track.
                </Text>

                <View style={s.howCard}>
                  <Text style={[s.howCardTitle, { marginBottom: SPACING.sm }]}>Your challenge</Text>
                  {['Day 1  · Complete all habits', 'Day 2  · Keep the streak going', 'Day 3  · Claim your reward'].map((row, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: i < 2 ? SPACING.sm : 0 }}>
                      <View style={s.howCardNum}>
                        <Text style={s.howCardNumText}>{i + 1}</Text>
                      </View>
                      <Text style={s.howCardDesc}>{row.split('  · ')[1]}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <TouchableOpacity style={s.primaryBtn} onPress={finishOnboarding}>
                  <Text style={s.primaryBtnText}>Start Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.skipBtn} onPress={finishOnboarding}>
                  <Text style={s.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </Animated.View>

        {/* Progress dots */}
        <View style={s.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive]} />
          ))}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: {
      flex: 1, padding: SPACING.lg, paddingTop: SPACING.xl,
      justifyContent: 'space-between',
    },

    stepLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', color: colors.textSecondary, marginBottom: SPACING.md,
    },
    heading: {
      fontSize: 28, fontWeight: '900', color: colors.text,
      letterSpacing: -0.5, lineHeight: 34, marginBottom: SPACING.sm,
    },
    subheading: {
      fontSize: 16, color: colors.textSecondary, lineHeight: 24, fontWeight: '500',
      marginBottom: SPACING.xl,
    },

    howCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
      marginBottom: SPACING.sm,
    },
    howCardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 3 },
    howCardDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, fontWeight: '500' },
    howCardNum: {
      width: 28, height: 28, borderRadius: 8,
      backgroundColor: colors.text,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: SPACING.sm,
    },
    howCardNumText: { fontSize: 13, fontWeight: '900', color: colors.card },

    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
    iconGridItem: {
      width: '18%', aspectRatio: 1, borderRadius: 12,
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', gap: 3,
    },
    iconGridItemSelected: { backgroundColor: colors.text, borderColor: colors.text },
    iconLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary },
    iconLabelSelected: { color: colors.card },

    nameInput: {
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
      fontSize: 18, fontWeight: '700', color: colors.text,
      borderWidth: 1.5, borderColor: colors.border, marginBottom: SPACING.md,
    },

    typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    typeCard: {
      flex: 1, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: colors.card,
    },
    typeCardSelected: { borderColor: colors.text },
    typeCardLabel: { fontWeight: '700', fontSize: 14, color: colors.textSecondary, marginBottom: 3 },
    typeCardLabelSelected: { color: colors.text },
    typeCardHint: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },

    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.lg },
    dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: colors.border },
    dotActive: { backgroundColor: colors.text, borderColor: colors.text },

    primaryBtn: {
      backgroundColor: colors.text, paddingVertical: 16,
      borderRadius: RADIUS.full, alignItems: 'center', marginBottom: SPACING.md,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '800', color: colors.card },
    skipBtn: { alignItems: 'center', paddingVertical: 8 },
    skipBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  });
}
