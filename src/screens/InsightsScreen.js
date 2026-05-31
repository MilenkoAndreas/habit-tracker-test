import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useApp, useColors } from '../AppContext';
import { calcStreak, weeklyStats, countForDate, dateKey } from '../storage';
import { SPACING, RADIUS } from '../theme';

const { width } = Dimensions.get('window');
const CHART_W = width - SPACING.lg * 2 - SPACING.md * 2;
const CHART_H = 130;

export default function InsightsScreen() {
  const { state: { habits, logs } } = useApp();
  const colors = useColors();
  const s = getStyles(colors);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => weeklyStats(logs, habits, 7), [logs, habits]);
  const barW = Math.floor((CHART_W - 16) / 7) - 4;

  const overallStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const allDone = habits.length > 0 && habits.every(h => countForDate(logs, h.id, key) >= h.targetCount);
      if (allDone) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [logs, habits]);

  const bestStreak = useMemo(() => {
    let best = 0, cur = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const allDone = habits.length > 0 && habits.every(h => countForDate(logs, h.id, key) >= h.targetCount);
      if (allDone) { cur++; best = Math.max(best, cur); }
      else cur = 0;
    }
    return best;
  }, [logs, habits]);

  const avgPct = stats.length > 0
    ? Math.round(stats.reduce((sum, d) => sum + d.pct, 0) / stats.length * 100)
    : 0;

  // ── History ────────────────────────────────────────────
  const historyDays = useMemo(() => {
    const byDate = {};
    [...logs].reverse().forEach(log => {
      if (!byDate[log.date]) byDate[log.date] = {};
      if (!byDate[log.date][log.habitId]) byDate[log.date][log.habitId] = 0;
      byDate[log.date][log.habitId]++;
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
      .map(([date, habitCounts]) => {
        const entries = Object.entries(habitCounts).map(([habitId, count]) => {
          const habit = habits.find(h => h.id === habitId);
          return habit ? { habitId, habit, count } : null;
        }).filter(Boolean);

        const d = new Date(date + 'T12:00:00');
        const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        const doneCount = entries.filter(e => e.count >= e.habit.targetCount).length;
        return { date, label, entries, doneCount };
      });
  }, [logs, habits]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Stat cards ── */}
        <Text style={s.pageTitle}>Progress</Text>
        <View style={s.cards}>
          <StatCard emoji="🔥" label="Current Streak" value={`${overallStreak}d`} color={colors.warning} colors={colors} />
          <StatCard emoji="🏆" label="Best Streak" value={`${bestStreak}d`} color={colors.primary} colors={colors} />
          <StatCard emoji="✅" label="Total Logs" value={logs.length} color={colors.success} colors={colors} />
          <StatCard emoji="📊" label="7-Day Avg" value={`${avgPct}%`} color="#06B6D4" colors={colors} />
        </View>

        {/* ── 7-day bar chart ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Last 7 Days</Text>
          <Svg width={CHART_W} height={CHART_H + 30}>
            <Line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={colors.border} strokeWidth={1} />
            {stats.map((day, i) => {
              const barH = Math.max(day.pct * CHART_H, day.pct > 0 ? 4 : 0);
              const x = i * (barW + 4) + 8;
              const y = CHART_H - barH;
              const fill = day.pct === 1 ? colors.success : day.pct > 0.5 ? colors.primary : day.pct > 0 ? colors.warning : colors.border;
              return (
                <React.Fragment key={day.date}>
                  <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={fill} />
                  <SvgText x={x + barW / 2} y={CHART_H + 18} textAnchor="middle" fontSize={10} fill={colors.textSecondary}>
                    {day.label}
                  </SvgText>
                  {day.pct > 0 && (
                    <SvgText x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={fill}>
                      {Math.round(day.pct * 100)}%
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* ── Per-habit streaks ── */}
        {habits.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Habit Streaks</Text>
            {habits.map(h => {
              const streak = calcStreak(logs, h);
              const pct = Math.min(streak / 30, 1);
              return (
                <View key={h.id} style={s.habitRow}>
                  <Text style={s.habitEmoji}>{h.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.habitName} numberOfLines={1}>{h.name}</Text>
                    <View style={s.streakBar}>
                      <View style={[s.streakFill, { width: `${pct * 100}%`, backgroundColor: h.color }]} />
                    </View>
                  </View>
                  <Text style={[s.streakNum, { color: h.color }]}>{streak}d</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── History ── */}
        <Text style={s.sectionDivider}>History</Text>

        {historyDays.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTitle}>No history yet</Text>
            <Text style={s.emptyHint}>Complete habits and they'll appear here.</Text>
          </View>
        ) : (
          historyDays.map(({ date, label, entries, doneCount }) => (
            <View key={date} style={s.dayBlock}>
              <View style={s.dayHeader}>
                <Text style={s.dayLabel}>{label}</Text>
                <Text style={s.daySub}>{doneCount}/{habits.length} habits</Text>
              </View>
              {entries.map(({ habitId, habit, count }) => (
                <View key={habitId} style={[s.row, { borderLeftColor: habit.color }]}>
                  <Text style={s.rowEmoji}>{habit.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowName}>{habit.name}</Text>
                    {habit.type === 'volume' && (
                      <Text style={s.rowCount}>{count}× completed</Text>
                    )}
                  </View>
                  <View style={[s.badge, { backgroundColor: habit.color + '22' }]}>
                    <Text style={[s.badgeText, { color: habit.color }]}>
                      {count >= habit.targetCount ? '✓ Done' : `${count}/${habit.targetCount}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, label, value, color, colors }) {
  return (
    <View style={[statCardStyle(colors), { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: 26, fontWeight: '800', color, marginBottom: 2 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

function statCardStyle(colors) {
  return {
    flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  };
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: SPACING.lg, paddingBottom: 100 },
    pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: SPACING.lg },
    cards: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
    card: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text, marginBottom: SPACING.md },
    habitRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    habitEmoji: { fontSize: 20 },
    habitName: { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 4 },
    streakBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    streakFill: { height: '100%', borderRadius: 3 },
    streakNum: { fontWeight: '800', fontSize: 14, minWidth: 30, textAlign: 'right' },
    sectionDivider: {
      fontSize: 12, fontWeight: '700', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.6,
      marginBottom: SPACING.sm, marginTop: SPACING.xs,
    },
    dayBlock: { marginBottom: SPACING.md },
    dayHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: SPACING.xs, marginBottom: SPACING.xs,
    },
    dayLabel: { fontWeight: '700', fontSize: 14, color: colors.text },
    daySub: { fontSize: 12, color: colors.textSecondary },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
      marginBottom: SPACING.xs, borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
      gap: SPACING.sm,
    },
    rowEmoji: { fontSize: 20 },
    rowName: { fontWeight: '500', fontSize: 14, color: colors.text },
    rowCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    badge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
    badgeText: { fontSize: 12, fontWeight: '700' },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm },
    emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  });
}
