import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../AppContext';
import { setOnboarded, dateKey } from '../storage';
import { requestPermissions } from '../notifications';
import { HABIT_COLORS, SPACING, RADIUS } from '../theme';

// Step 0: explainer. Step 1: create habit. Step 2: challenge.
const TOTAL_STEPS = 3;

const HOW_IT_WORKS = [
  { emoji: '➕', title: 'Add your habits', desc: 'Pick anything you want to do every day — exercise, reading, drinking water, whatever matters to you.' },
  { emoji: '✅', title: 'Tap when done', desc: 'Each day, tap a habit to mark it complete. All done? You\'ll get a celebration and your streak grows.' },
  { emoji: '📊', title: 'Track your progress', desc: 'See your streaks, history and stats. Consistency is the goal — Antigravity keeps score for you.' },
];

const EMOJIS = ['💧','🏃','📚','🧘','😴','🥗','💪','🎯','✍️','🎸','🌿','🧠'];

export default function OnboardingScreen({ navigation }) {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [habitName, setHabitName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
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
        emoji,
        type,
        targetCount: type === 'volume' ? targetCount : 1,
        color: HABIT_COLORS[0],
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
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <LinearGradient colors={['#6C63FF', '#9B8FFF']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          <Animated.View style={[styles.content, { opacity: fade }]}>

            {/* ── Step 0: How it works ── */}
            {step === 0 && (
              <View style={styles.explainer}>
                <Text style={styles.appIcon}>🚀</Text>
                <Text style={styles.appName}>Antigravity</Text>
                <Text style={styles.appTagline}>Your daily habit tracker</Text>

                <View style={styles.howList}>
                  {HOW_IT_WORKS.map((item, i) => (
                    <View key={i} style={styles.howRow}>
                      <View style={styles.howIconWrap}>
                        <Text style={styles.howIcon}>{item.emoji}</Text>
                      </View>
                      <View style={styles.howText}>
                        <Text style={styles.howTitle}>{item.title}</Text>
                        <Text style={styles.howDesc}>{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.btn} onPress={nextStep}>
                  <Text style={styles.btnText}>Get Started →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Step 1: Create first habit ── */}
            {step === 1 && (
              <View style={styles.form}>
                <Text style={styles.title}>Your first habit</Text>
                <Text style={styles.subtitle}>What do you want to build consistency around?</Text>

                <Text style={styles.label}>Choose an emoji</Text>
                <View style={styles.emojiGrid}>
                  {EMOJIS.map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.emojiBtn, emoji === e && styles.emojiBtnSelected]}
                      onPress={() => setEmoji(e)}
                    >
                      <Text style={styles.emojiOption}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Habit name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Drink 8 glasses of water"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={habitName}
                  onChangeText={setHabitName}
                  returnKeyType="done"
                />

                <Text style={styles.label}>Type</Text>
                <View style={styles.typeRow}>
                  {[['once', 'Once per day'], ['volume', 'Multiple times']].map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.typeBtn, type === val && styles.typeBtnSelected]}
                      onPress={() => setType(val)}
                    >
                      <Text style={[styles.typeBtnText, type === val && styles.typeBtnTextSelected]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {type === 'volume' && (
                  <View style={styles.countRow}>
                    <Text style={styles.label}>Times per day: {targetCount}</Text>
                    <View style={styles.counter}>
                      <TouchableOpacity onPress={() => setTargetCount(Math.max(2, targetCount - 1))} style={styles.counterBtn}>
                        <Text style={styles.counterBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterVal}>{targetCount}</Text>
                      <TouchableOpacity onPress={() => setTargetCount(Math.min(20, targetCount + 1))} style={styles.counterBtn}>
                        <Text style={styles.counterBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.btn, !habitName.trim() && styles.btnDisabled]}
                  onPress={nextStep}
                  disabled={!habitName.trim()}
                >
                  <Text style={styles.btnText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Step 2: Challenge ── */}
            {step === 2 && (
              <View style={styles.introSlide}>
                <Text style={styles.slideEmoji}>🔥</Text>
                <Text style={styles.slideTitle}>3-Day Kickstart</Text>
                <Text style={styles.slideDesc}>
                  Complete your habits for 3 days in a row and claim your first achievement. Daily reminders will keep you on track.
                </Text>
                <View style={styles.challengeCard}>
                  <Text style={styles.challengeRow}>Day 1  · Complete all habits</Text>
                  <Text style={styles.challengeRow}>Day 2  · Keep the streak going</Text>
                  <Text style={styles.challengeRow}>Day 3  · Claim your reward 🏆</Text>
                </View>
                <TouchableOpacity style={styles.btn} onPress={finishOnboarding}>
                  <Text style={styles.btnText}>Start Challenge</Text>
                </TouchableOpacity>
              </View>
            )}

          </Animated.View>

          {/* Progress dots */}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center' },

  // Explainer screen
  explainer: { alignItems: 'center', paddingBottom: SPACING.md },
  appIcon: { fontSize: 64, marginBottom: SPACING.sm },
  appName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  appTagline: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: SPACING.xl, marginTop: 4 },
  howList: { width: '100%', gap: SPACING.md, marginBottom: SPACING.xl },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: RADIUS.lg, padding: SPACING.md },
  howIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  howIcon: { fontSize: 22 },
  howText: { flex: 1 },
  howTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  howDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },

  // Create habit form
  form: {},
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: SPACING.md },
  label: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: '#fff',
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  emojiBtn: { padding: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.15)' },
  emojiBtnSelected: { backgroundColor: 'rgba(255,255,255,0.4)' },
  emojiOption: { fontSize: 24 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.sm },
  typeBtn: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  typeBtnSelected: { backgroundColor: '#fff' },
  typeBtnText: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  typeBtnTextSelected: { color: '#6C63FF' },
  countRow: { marginBottom: SPACING.sm },
  counter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  counterBtn: { backgroundColor: 'rgba(255,255,255,0.25)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { color: '#fff', fontSize: 22, fontWeight: '600', lineHeight: 26 },
  counterVal: { color: '#fff', fontSize: 22, fontWeight: '700', minWidth: 32, textAlign: 'center' },

  // Challenge slide wrapper
  introSlide: { alignItems: 'center', paddingBottom: SPACING.xl },
  slideEmoji: { fontSize: 88, marginBottom: SPACING.lg },
  slideTitle: { fontSize: 34, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 42, marginBottom: SPACING.md },
  slideDesc: { fontSize: 17, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 26, marginBottom: SPACING.xl, paddingHorizontal: SPACING.sm },

  // Challenge card
  challengeCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  challengeRow: { color: '#fff', fontSize: 15, fontWeight: '500' },

  // Shared button
  btn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#6C63FF', fontWeight: '800', fontSize: 17 },

  // Progress dots
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: SPACING.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#fff', width: 24 },
});
