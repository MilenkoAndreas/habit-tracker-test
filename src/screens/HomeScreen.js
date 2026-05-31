import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import HabitCard from '../components/HabitCard';
import ConfettiOverlay from '../components/ConfettiOverlay';
import { useApp, useColors } from '../AppContext';
import { countForDate, dateKey } from '../storage';
import { SPACING, RADIUS } from '../theme';

export default function HomeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const { habits, logs, challenge, loading } = state;
  const today = dateKey();
  const [showAllDone, setShowAllDone] = useState(false);
  const [showChallengeWin, setShowChallengeWin] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const celebrateScale = useRef(new Animated.Value(0)).current;
  const prevAllDone = useRef(false);
  const hydrated = useRef(false);

  const completedHabits = habits.filter(h => countForDate(logs, h.id, today) >= h.targetCount);
  const allDone = habits.length > 0 && completedHabits.length === habits.length;

  useEffect(() => {
    if (loading) return;
    // Seed prevAllDone on first post-hydration render so we don't
    // celebrate habits that were already done before the app opened.
    if (!hydrated.current) {
      hydrated.current = true;
      prevAllDone.current = allDone;
      return;
    }

    if (allDone && !prevAllDone.current && habits.length > 0) {
      prevAllDone.current = true;
      setShowAllDone(true);
      setConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(celebrateScale, { toValue: 1, useNativeDriver: true, tension: 50 }).start();
      setTimeout(() => { setShowAllDone(false); setConfetti(false); }, 3500);

      if (challenge && !challenge.completed) {
        let streak = 0;
        for (let i = 0; i < challenge.days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = dateKey(d);
          const done = challenge.habitIds.every(hid => {
            const h = habits.find(h => h.id === hid);
            return h && countForDate(logs, hid, key) >= h.targetCount;
          });
          if (done) streak++;
          else break;
        }
        if (streak >= challenge.days) {
          dispatch({ type: 'COMPLETE_CHALLENGE' });
          setTimeout(() => setShowChallengeWin(true), 800);
        }
      }
    } else if (!allDone) {
      prevAllDone.current = false;
    }
  }, [allDone, loading, challenge, habits, logs, dispatch]);

  const handleHabitPress = (habit) => {
    const count = countForDate(logs, habit.id, today);
    if (habit.type === 'once') {
      if (count === 0) dispatch({ type: 'LOG_HABIT', habitId: habit.id });
      else dispatch({ type: 'UNLOG_HABIT', habitId: habit.id });
    } else {
      if (count < habit.targetCount) dispatch({ type: 'LOG_HABIT', habitId: habit.id });
      else dispatch({ type: 'UNLOG_HABIT', habitId: habit.id });
    }
  };

  const handleHabitLongPress = (habit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Habit',
      `Remove "${habit.name}"? This will also delete all its history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_HABIT', id: habit.id }) },
      ]
    );
  };

  const openCreate = () => {
    const parent = navigation.getParent();
    (parent || navigation).navigate('CreateHabit');
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const progress = habits.length > 0 ? completedHabits.length / habits.length : 0;

  const challengeDaysPassed = challenge ? (() => {
    const [y, mo, day] = challenge.startDate.split('-').map(Number);
    const start = Date.UTC(y, mo - 1, day);
    const todayUTC = Date.UTC(...today.split('-').map(Number));
    return Math.min(Math.floor((todayUTC - start) / 86400000) + 1, challenge.days);
  })() : 0;

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={['#6C63FF', '#9B8FFF']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.greeting}>{greeting()} 👋</Text>
              <Text style={s.date}>{todayLabel}</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={openCreate}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={s.progressArea}>
            <View style={s.progressRow}>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={s.progressLabel}>{completedHabits.length}/{habits.length}</Text>
            </View>
            <Text style={s.progressHint}>
              {habits.length === 0 ? 'Add your first habit below'
                : allDone ? '🎉 All done today!'
                : `${habits.length - completedHabits.length} remaining`}
            </Text>
          </View>
        </LinearGradient>

        {challenge && !challenge.completed && (
          <View style={s.challengeCard}>
            <Text style={s.challengeTitle}>🔥 3-Day Kickstart</Text>
            <View style={s.challengeDays}>
              {Array.from({ length: challenge.days }).map((_, i) => {
                // Build UTC date from the stored YYYY-MM-DD string to avoid
                // timezone shifts (midnight local != midnight UTC on non-UTC zones).
                const [y, mo, day] = challenge.startDate.split('-').map(Number);
                const d = new Date(Date.UTC(y, mo - 1, day + i));
                const key = dateKey(d);
                const done = challenge.habitIds.every(hid => {
                  const h = habits.find(h => h.id === hid);
                  return h && countForDate(logs, hid, key) >= h.targetCount;
                });
                const isFuture = i + 1 > challengeDaysPassed;
                return (
                  <View key={i} style={[s.dayDot, done && s.dayDotDone, isFuture && s.dayDotFuture]}>
                    <Text style={[s.dayDotText, done && s.dayDotTextDone]}>{done ? '✓' : `D${i + 1}`}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={s.challengeHint}>Complete all habits each day to finish</Text>
          </View>
        )}

        {challenge?.completed && (
          <View style={[s.challengeCard, s.challengeCardDone]}>
            <Text style={s.challengeTitle}>🏆 Kickstart Complete!</Text>
            <Text style={s.challengeHint}>You built the habit of building habits. Legend.</Text>
          </View>
        )}

        {habits.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌱</Text>
            <Text style={s.emptyTitle}>No habits yet</Text>
            <Text style={s.emptyHint}>Tap + to add your first habit and start building momentum.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openCreate}>
              <Text style={s.emptyBtnText}>Add First Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                count={countForDate(logs, habit.id, today)}
                onPress={() => handleHabitPress(habit)}
                onLongPress={() => handleHabitLongPress(habit)}
              />
            ))}
            <TouchableOpacity style={s.addHabitRow} onPress={openCreate}>
              <Text style={s.addHabitPlus}>+</Text>
              <Text style={s.addHabitText}>Add another habit</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      <Modal transparent visible={showAllDone} animationType="fade">
        <View style={s.overlay}>
          <Animated.View style={[s.celebrateBox, { transform: [{ scale: celebrateScale }] }]}>
            <Text style={{ fontSize: 56, marginBottom: SPACING.sm }}>🎉</Text>
            <Text style={s.celebrateTitle}>All done!</Text>
            <Text style={s.celebrateSub}>You crushed today. See you tomorrow.</Text>
          </Animated.View>
        </View>
        <ConfettiOverlay visible={confetti} />
      </Modal>

      <Modal transparent visible={showChallengeWin} animationType="slide">
        <View style={s.overlay}>
          <LinearGradient colors={['#6C63FF', '#9B8FFF']} style={s.challengeWinBox}>
            <Text style={{ fontSize: 64 }}>🏆</Text>
            <Text style={s.winTitle}>3-Day Kickstart Complete!</Text>
            <Text style={s.winSub}>You showed up 3 days in a row. That's how habits are born.</Text>
            <TouchableOpacity style={s.winBtn} onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowChallengeWin(false);
            }}>
              <Text style={s.winBtnText}>Claim Reward ✨</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        <ConfettiOverlay visible={showChallengeWin} />
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: SPACING.xl },
    header: {
      paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl,
      borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: SPACING.md,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
    greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
    date: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
    progressArea: { gap: SPACING.xs },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
    progressLabel: { color: '#fff', fontWeight: '700', fontSize: 13, minWidth: 36, textAlign: 'right' },
    progressHint: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
    challengeCard: {
      marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
      borderLeftWidth: 4, borderLeftColor: colors.warning,
    },
    challengeCardDone: { borderLeftColor: colors.success },
    challengeTitle: { fontWeight: '700', fontSize: 15, color: colors.text, marginBottom: SPACING.sm },
    challengeDays: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
    dayDot: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    dayDotDone: { backgroundColor: colors.success, borderColor: colors.success },
    dayDotFuture: { opacity: 0.4 },
    dayDotText: { fontWeight: '700', color: colors.textSecondary, fontSize: 12 },
    dayDotTextDone: { color: '#fff' },
    challengeHint: { fontSize: 12, color: colors.textSecondary },
    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
    emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm },
    emptyHint: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
    emptyBtn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    addHabitRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg, marginTop: SPACING.xs, paddingVertical: SPACING.md, gap: SPACING.sm },
    addHabitPlus: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, textAlign: 'center', lineHeight: 28, color: colors.primary, fontWeight: '700', fontSize: 18, overflow: 'hidden' },
    addHabitText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
    celebrateBox: { backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', width: 280 },
    celebrateTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: SPACING.xs },
    celebrateSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    challengeWinBox: { borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', width: 320, gap: SPACING.md },
    winTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center' },
    winSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
    winBtn: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, marginTop: SPACING.sm },
    winBtnText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  });
}
