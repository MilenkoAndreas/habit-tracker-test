import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Modal, Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import HabitCard from '../components/HabitCard';
import ConfettiOverlay from '../components/ConfettiOverlay';
import { IconCheck } from '../components/icons/index';
import { useApp, useColors } from '../AppContext';
import { countForDate, dateKey, calcStreak } from '../storage';
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
  const progress = habits.length > 0 ? completedHabits.length / habits.length : 0;

  // Overall streak: consecutive days where ALL habits were done
  const overallStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dk = dateKey(d);
      const allDoneOnDay = habits.every(h => countForDate(logs, h.id, dk) >= h.targetCount);
      if (allDoneOnDay) streak++;
      else break;
    }
    return streak;
  }, [habits, logs]);

  const challengeStreak = useMemo(() => {
    if (!challenge || challenge.completed) return 0;
    let streak = 0;
    for (let i = 0; i < challenge.days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const done = habits.every(h => countForDate(logs, h.id, dateKey(d)) >= h.targetCount);
      if (done) streak++;
      else break;
    }
    return streak;
  }, [challenge, habits, logs]);

  useEffect(() => {
    if (loading) return;
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
      if (challenge && !challenge.completed && challengeStreak >= challenge.days) {
        dispatch({ type: 'COMPLETE_CHALLENGE' });
        setTimeout(() => setShowChallengeWin(true), 800);
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
    if (h < 12) return allDone ? 'All done.' : 'Good morning.';
    if (h < 17) return allDone ? 'All done.' : 'Good afternoon.';
    return allDone ? 'All done.' : 'Good evening.';
  };

  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()
    + ' · ' + new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  // Ring geometry
  const RING_SIZE = 72;
  const RING_STROKE = 5;
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ringOffset = CIRCUMFERENCE * (1 - progress);

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: ring + greeting ──────────────────────────────── */}
        <View style={s.header}>
          {/* Left: progress ring */}
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Track */}
            <Circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke={colors.border} strokeWidth={RING_STROKE}
            />
            {/* Progress arc */}
            <Circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke={colors.primary} strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={habits.length === 0 ? CIRCUMFERENCE : ringOffset}
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          {/* Ring centre label — overlaid absolutely */}
          <View style={s.ringLabel}>
            <Text style={s.ringText}>
              {habits.length === 0 ? '—' : `${completedHabits.length}/${habits.length}`}
            </Text>
          </View>

          {/* Right: greeting + streak */}
          <View style={s.greetingBlock}>
            <Text style={s.dateLabel}>{dateLabel}</Text>
            <Text style={s.greeting}>{greeting()}</Text>
            {overallStreak > 0 && (
              <View style={s.streakPill}>
                <Text style={s.streakText}>🔥 {overallStreak}-day streak</Text>
              </View>
            )}
          </View>

          {/* Add button */}
          <TouchableOpacity style={s.addBtn} onPress={openCreate}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Header divider */}
        <View style={s.divider} />

        {/* ── Challenge card ───────────────────────────────────────── */}
        {challenge && !challenge.completed && (
          <View style={s.challengeCard}>
            <Text style={s.challengeTitle}>3-Day Kickstart</Text>
            <View style={s.challengeDays}>
              {Array.from({ length: challenge.days }).map((_, i) => {
                const done = i < challengeStreak;
                return (
                  <View key={i} style={[s.dayDot, done && s.dayDotDone]}>
                    {done
                      ? <IconCheck color="#fff" size={14} />
                      : <Text style={s.dayDotText}>D{i + 1}</Text>}
                  </View>
                );
              })}
            </View>
            <Text style={s.challengeHint}>Complete all habits each day</Text>
          </View>
        )}

        {challenge?.completed && (
          <View style={[s.challengeCard, s.challengeCardDone]}>
            <Text style={s.challengeTitle}>Kickstart Complete</Text>
            <Text style={s.challengeHint}>You built the habit of building habits.</Text>
          </View>
        )}

        {/* ── Habit list ───────────────────────────────────────────── */}
        {habits.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconTile}>
              <Text style={{ fontSize: 32 }}>+</Text>
            </View>
            <Text style={s.emptyTitle}>No habits yet</Text>
            <Text style={s.emptyHint}>Add your first habit and start building momentum.</Text>
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
              <View style={s.addHabitIcon}>
                <Text style={s.addHabitPlus}>+</Text>
              </View>
              <Text style={s.addHabitText}>Add another habit</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── All-done celebration ─────────────────────────────────── */}
      <Modal transparent visible={showAllDone} animationType="fade">
        <View style={s.overlay}>
          <Animated.View style={[s.celebrateBox, { transform: [{ scale: celebrateScale }] }]}>
            <View style={s.celebrateIcon}>
              <IconCheck color="#fff" size={32} />
            </View>
            <Text style={s.celebrateTitle}>All done!</Text>
            <Text style={s.celebrateSub}>You crushed today. See you tomorrow.</Text>
          </Animated.View>
        </View>
        <ConfettiOverlay visible={confetti} />
      </Modal>

      {/* ── Challenge win ────────────────────────────────────────── */}
      <Modal transparent visible={showChallengeWin} animationType="slide">
        <View style={s.overlay}>
          <View style={s.challengeWinBox}>
            <View style={[s.celebrateIcon, { width: 64, height: 64, borderRadius: 20 }]}>
              <Text style={{ fontSize: 32 }}>🏆</Text>
            </View>
            <Text style={s.winTitle}>3-Day Kickstart{'\n'}Complete!</Text>
            <Text style={s.winSub}>You showed up 3 days in a row. That's how habits are born.</Text>
            <TouchableOpacity style={s.winBtn} onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowChallengeWin(false);
            }}>
              <Text style={s.winBtnText}>Claim Reward</Text>
            </TouchableOpacity>
          </View>
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
    content: { paddingBottom: 100 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.lg,
      gap: SPACING.md,
      position: 'relative',
    },
    ringLabel: {
      position: 'absolute',
      left: SPACING.lg,
      top: SPACING.lg,
      width: 72,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringText: { fontSize: 15, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
    greetingBlock: { flex: 1, marginLeft: 4 },
    dateLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4,
    },
    greeting: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5, lineHeight: 26 },
    streakPill: {
      marginTop: 8, alignSelf: 'flex-start',
      backgroundColor: colors.text, borderRadius: RADIUS.full,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    streakText: { fontSize: 11, fontWeight: '700', color: colors.card },
    addBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.text,
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    addBtnText: { color: colors.card, fontSize: 22, fontWeight: '300', lineHeight: 26 },
    divider: { height: 1.5, backgroundColor: colors.border, marginBottom: SPACING.md },

    // Challenge card
    challengeCard: {
      marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md,
      borderWidth: 1.5, borderColor: colors.border,
    },
    challengeCardDone: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    challengeTitle: {
      fontWeight: '800', fontSize: 13, color: colors.text,
      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.sm,
    },
    challengeDays: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
    dayDot: {
      width: 40, height: 40, borderRadius: 20,
      borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    dayDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
    dayDotText: { fontWeight: '700', color: colors.textSecondary, fontSize: 11 },
    challengeHint: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

    // Empty state
    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
    emptyIconTile: {
      width: 64, height: 64, borderRadius: 18,
      backgroundColor: colors.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: SPACING.sm },
    emptyHint: {
      fontSize: 15, color: colors.textSecondary, textAlign: 'center',
      lineHeight: 22, marginBottom: SPACING.xl,
    },
    emptyBtn: {
      backgroundColor: colors.text, paddingVertical: 14,
      paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full,
    },
    emptyBtnText: { color: colors.card, fontWeight: '700', fontSize: 16 },

    // Add row
    addHabitRow: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: SPACING.lg, marginTop: SPACING.xs,
      paddingVertical: SPACING.md, gap: SPACING.sm,
    },
    addHabitIcon: {
      width: 28, height: 28, borderRadius: 8,
      backgroundColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    addHabitPlus: { color: colors.textSecondary, fontWeight: '700', fontSize: 18, lineHeight: 22 },
    addHabitText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },

    // Modals
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
    celebrateBox: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      padding: SPACING.xl, alignItems: 'center', width: 280,
    },
    celebrateIcon: {
      width: 52, height: 52, borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    },
    celebrateTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: SPACING.xs },
    celebrateSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    challengeWinBox: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      padding: SPACING.xl, alignItems: 'center', width: 320,
      gap: SPACING.md, borderWidth: 1.5, borderColor: colors.primary,
    },
    winTitle: {
      fontSize: 24, fontWeight: '900', color: colors.text,
      textAlign: 'center', letterSpacing: -0.5,
    },
    winSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    winBtn: {
      backgroundColor: colors.text, paddingVertical: 14,
      paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, marginTop: SPACING.sm,
    },
    winBtnText: { color: colors.card, fontWeight: '800', fontSize: 16 },
  });
}
