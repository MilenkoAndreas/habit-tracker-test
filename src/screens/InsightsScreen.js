import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useApp, useColors } from '../AppContext';
import { calcStreak, weeklyStats, countForDate, dateKey } from '../storage';
import { SPACING, RADIUS } from '../theme';
import { ICON_MAP } from '../components/icons/index';
import { fetchCoachingInsight, fetchReflection } from '../ai';

const { width } = Dimensions.get('window');
const CHART_W = width - SPACING.lg * 2 - SPACING.md * 2;
const CHART_H = 130;

export default function InsightsScreen() {
  const { state: { habits, logs } } = useApp();
  const colors = useColors();
  const s = getStyles(colors);

  // ── AI state ───────────────────────────────────────────────────────────────
  const [coaching, setCoaching] = useState(null);
  const [coachingLoading, setCoachingLoading] = useState(true);
  const [coachingError, setCoachingError] = useState(null);

  const [reflectionTab, setReflectionTab] = useState('weekly');
  const [reflections, setReflections] = useState({ weekly: null, monthly: null });
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionFetched, setReflectionFetched] = useState({ weekly: false, monthly: false });

  const loadCoaching = useCallback(async () => {
    setCoachingLoading(true);
    setCoachingError(null);
    try {
      const insight = await fetchCoachingInsight();
      setCoaching(insight);
    } catch (e) {
      setCoachingError('Could not load coaching. Tap to retry.');
    } finally {
      setCoachingLoading(false);
    }
  }, []);

  const loadReflection = useCallback(async (type) => {
    if (reflectionFetched[type]) return;
    setReflectionLoading(true);
    try {
      const insight = await fetchReflection(type);
      setReflections(prev => ({ ...prev, [type]: insight }));
      setReflectionFetched(prev => ({ ...prev, [type]: true }));
    } catch {
      // silently fail — user can retry via Generate button
    } finally {
      setReflectionLoading(false);
    }
  }, [reflectionFetched]);

  useEffect(() => {
    if (habits.length > 0) {
      loadCoaching();
      loadReflection('weekly');
    } else {
      setCoachingLoading(false);
    }
  }, [habits.length > 0]);

  useEffect(() => {
    if (habits.length > 0) {
      loadReflection(reflectionTab);
    }
  }, [reflectionTab]);

  // ── Stats ──────────────────────────────────────────────────────────────────
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

  // ── History ────────────────────────────────────────────────────────────────
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
        <Text style={s.sectionLabel}>Progress</Text>
        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{overallStreak}</Text>
            <Text style={s.statLabel}>Current Streak</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{bestStreak}</Text>
            <Text style={s.statLabel}>Best Streak</Text>
          </View>
        </View>
        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{logs.length}</Text>
            <Text style={s.statLabel}>Total Logs</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{avgPct}%</Text>
            <Text style={s.statLabel}>7-Day Avg</Text>
          </View>
        </View>

        {/* ── AI Coach ── */}
        {habits.length > 0 && (
          <AICoachCard
            coaching={coaching}
            loading={coachingLoading}
            error={coachingError}
            onRetry={loadCoaching}
            colors={colors}
            s={s}
          />
        )}

        {/* ── 7-day bar chart ── */}
        <Text style={s.sectionLabel}>Last 7 Days</Text>
        <View style={s.chartCard}>
          <Svg width={CHART_W} height={CHART_H + 30}>
            <Line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={colors.border} strokeWidth={1} />
            {stats.map((day, i) => {
              const barH = Math.max(day.pct * CHART_H, day.pct > 0 ? 4 : 0);
              const x = i * (barW + 4) + 8;
              const y = CHART_H - barH;
              const isToday = i === 6;
              const fill = isToday ? colors.primary : colors.text;
              const barOpacity = isToday ? 1 : 0.2;
              return (
                <React.Fragment key={day.date}>
                  <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={fill} opacity={barOpacity} />
                  <SvgText x={x + barW / 2} y={CHART_H + 18} textAnchor="middle" fontSize={10} fill={colors.textSecondary}>
                    {day.label}
                  </SvgText>
                  {day.pct > 0 && (
                    <SvgText x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={fill} opacity={barOpacity}>
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
          <>
            <Text style={s.sectionLabel}>Habit Streaks</Text>
            <View style={s.habitStreakCard}>
              {habits.map(h => {
                const streak = calcStreak(logs, h);
                const pct = Math.min(streak / 30, 1);
                const IconComp = ICON_MAP[h.emoji];
                return (
                  <View key={h.id}>
                    <View style={s.habitStreakRow}>
                      <View style={s.habitStreakTile}>
                        {IconComp ? <IconComp color="#fff" size={16} /> : <Text style={{ fontSize: 14 }}>{h.emoji}</Text>}
                      </View>
                      <Text style={s.habitStreakName} numberOfLines={1}>{h.name}</Text>
                      <Text style={s.habitStreakCount}>{streak}d</Text>
                    </View>
                    <View style={s.habitStreakBar}>
                      <View style={[s.habitStreakFill, { width: `${pct * 100}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── AI Reflections ── */}
        {habits.length > 0 && (
          <AIReflectionsCard
            tab={reflectionTab}
            onTabChange={setReflectionTab}
            reflections={reflections}
            loading={reflectionLoading}
            fetched={reflectionFetched}
            onGenerate={(type) => {
              setReflectionFetched(prev => ({ ...prev, [type]: false }));
              setReflections(prev => ({ ...prev, [type]: null }));
              setTimeout(() => loadReflection(type), 0);
            }}
            colors={colors}
            s={s}
          />
        )}

        {/* ── History ── */}
        <Text style={s.sectionLabel}>History</Text>

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

// ── AI Coach Card ────────────────────────────────────────────────────────────

function AICoachCard({ coaching, loading, error, onRetry, colors, s }) {
  return (
    <View style={s.coachCard}>
      <Text style={s.coachHeader}>AI Coach</Text>
      {!loading && (
        <TouchableOpacity onPress={onRetry} style={s.refreshBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[s.refreshText, { color: colors.primary }]}>Refresh</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={s.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.aiLoadingText}>Analyzing your habits...</Text>
        </View>
      ) : error ? (
        <TouchableOpacity onPress={onRetry}>
          <Text style={s.coachError}>{error}</Text>
        </TouchableOpacity>
      ) : coaching ? (
        <Text style={s.coachText}>{coaching}</Text>
      ) : (
        <Text style={s.coachError}>Complete habits for a few days to unlock your personalized coaching.</Text>
      )}
    </View>
  );
}

// ── AI Reflections Card ──────────────────────────────────────────────────────

function AIReflectionsCard({ tab, onTabChange, reflections, loading, fetched, onGenerate, colors, s }) {
  const currentInsight = reflections[tab];
  const isFetched = fetched[tab];

  return (
    <View style={s.reflectionCard}>
      <Text style={s.sectionLabel}>AI Reflections</Text>

      {/* Pill tab switcher */}
      <View style={s.tabSwitcher}>
        {['weekly', 'monthly'].map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => onTabChange(t)}
          >
            <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !currentInsight ? (
        <View style={s.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.aiLoadingText}>Generating your {tab} summary...</Text>
        </View>
      ) : currentInsight ? (
        <View>
          <Text style={s.reflectionText}>{currentInsight}</Text>
          <TouchableOpacity
            onPress={() => onGenerate(tab)}
            style={s.regenerateBtn}
          >
            <Text style={[s.refreshText, { color: colors.textSecondary }]}>Regenerate</Text>
          </TouchableOpacity>
        </View>
      ) : isFetched ? (
        <TouchableOpacity onPress={() => onGenerate(tab)} style={s.generateBtn}>
          <Text style={[s.generateBtnText, { color: colors.primary }]}>
            Generate {tab === 'weekly' ? 'Weekly' : 'Monthly'} Report
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={s.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.aiLoadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: 100 },

    sectionLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', color: colors.textSecondary,
      marginBottom: SPACING.sm, marginTop: SPACING.lg,
    },

    statRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
    statCard: {
      flex: 1, backgroundColor: colors.card,
      borderRadius: RADIUS.lg, padding: SPACING.md,
      borderWidth: 1.5, borderColor: colors.border,
    },
    statNumber: { fontSize: 36, fontWeight: '900', color: colors.text, letterSpacing: -1 },
    statLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', color: colors.textSecondary, marginTop: 2,
    },

    chartCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
      marginBottom: SPACING.sm,
    },

    habitStreakCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
      marginBottom: SPACING.sm,
    },
    habitStreakRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
    habitStreakTile: {
      width: 32, height: 32, borderRadius: 8,
      backgroundColor: colors.text,
      alignItems: 'center', justifyContent: 'center',
    },
    habitStreakName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
    habitStreakCount: { fontSize: 13, fontWeight: '800', color: colors.primary },
    habitStreakBar: { height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
    habitStreakFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },

    coachCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.text,
      marginBottom: SPACING.sm,
    },
    coachHeader: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', color: colors.text, marginBottom: SPACING.sm,
    },
    coachText: { fontSize: 15, color: colors.text, lineHeight: 23, fontWeight: '500' },
    coachError: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },

    tabSwitcher: {
      flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm,
    },
    tabBtn: {
      flex: 1, paddingVertical: 10, borderRadius: RADIUS.full,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    tabBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
    tabBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    tabBtnTextActive: { color: colors.card },

    reflectionCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
    },
    reflectionText: { fontSize: 15, color: colors.text, lineHeight: 23, fontWeight: '500' },
    reflectionEmpty: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },

    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    emptyCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.xl, borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center',
    },
    emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

    // History styles (preserved)
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

    // Shared helpers
    refreshBtn: { paddingHorizontal: SPACING.xs },
    refreshText: { fontSize: 13, fontWeight: '600' },
    aiLoadingText: { fontSize: 13, color: colors.textSecondary },
    generateBtn: {
      paddingVertical: SPACING.sm, alignItems: 'center',
      borderWidth: 1, borderColor: colors.primary + '44', borderRadius: RADIUS.md,
    },
    generateBtnText: { fontSize: 14, fontWeight: '600' },
    regenerateBtn: { alignSelf: 'flex-end', marginTop: SPACING.sm },
  });
}
