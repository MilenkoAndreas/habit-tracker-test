import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useColors } from '../AppContext';
import { SPACING, RADIUS } from '../theme';
import { IconGrid, IconCheck, IconHeart, IconBarChart, IconRun } from '../components/icons/index';

const STEPS = [
  {
    Icon: IconGrid,
    title: 'Add your habits',
    desc: 'Tap "+ Add Habit" to create anything you want to do every day — exercise, reading, drinking water. Give it a name and icon.',
  },
  {
    Icon: IconCheck,
    title: 'Tap when done',
    desc: 'Every day, open the Today tab and tap a habit card to mark it complete. For volume habits, tap multiple times until the bar fills up.',
  },
  {
    Icon: IconHeart,
    title: 'Finish the day strong',
    desc: 'Complete all your habits and the app celebrates with you. Keep at it — your streak grows every consecutive day you finish.',
  },
  {
    Icon: IconBarChart,
    title: 'Track your progress',
    desc: 'The Progress tab shows your streaks, 7-day and 30-day consistency charts, per-habit bars, and full history.',
  },
  {
    Icon: IconRun,
    title: '3-Day Kickstart',
    desc: 'When you start, a 3-day challenge begins. Complete all habits 3 days in a row to claim your first achievement and prove the habit is forming.',
  },
];

export default function HowItWorksScreen({ navigation }) {
  const colors = useColors();
  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.close}>✕</Text>
        </TouchableOpacity>
        <Text style={s.title}>How it works</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.intro}>
          Habit Tracker helps you build daily habits through consistent repetition and clear visual feedback.
        </Text>

        {STEPS.map((step, i) => (
          <View key={i} style={s.card}>
            <View style={s.iconWrap}>
              <step.Icon color={colors.card} size={22} />
            </View>
            <View style={s.textWrap}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <View style={s.tip}>
          <Text style={s.tipLabel}>Tip</Text>
          <Text style={s.tipText}>Long-press any habit card on the Today screen to delete it.</Text>
        </View>
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
    close: { fontSize: 18, color: colors.textSecondary, width: 32, textAlign: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: colors.text },
    content: { padding: SPACING.lg, paddingBottom: 60, gap: SPACING.md },
    intro: {
      fontSize: 15, color: colors.textSecondary, lineHeight: 22,
      marginBottom: SPACING.sm,
    },
    card: {
      flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    iconWrap: {
      width: 48, height: 48, borderRadius: 12,
      backgroundColor: colors.text,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    textWrap: { flex: 1 },
    stepTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    stepDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    tip: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md,
      borderLeftWidth: 4, borderLeftColor: colors.primary,
    },
    tipLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    tipText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  });
}
