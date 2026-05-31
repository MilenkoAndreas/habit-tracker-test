import React, { useMemo } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView } from 'react-native';
import { useApp, useColors } from '../AppContext';
import { SPACING, RADIUS } from '../theme';

export default function HistoryScreen() {
  const { state: { habits, logs } } = useApp();
  const colors = useColors();
  const s = getStyles(colors);

  const sections = useMemo(() => {
    const byDate = {};
    [...logs].reverse().forEach(log => {
      if (!byDate[log.date]) byDate[log.date] = [];
      byDate[log.date].push(log);
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
      .map(([date, entries]) => {
        const seen = {};
        entries.forEach(e => {
          if (!seen[e.habitId]) seen[e.habitId] = 0;
          seen[e.habitId]++;
        });
        const deduplicated = Object.entries(seen).map(([habitId, count]) => {
          const habit = habits.find(h => h.id === habitId);
          return habit ? { habitId, habit, count, date } : null;
        }).filter(Boolean);

        const d = new Date(date + 'T12:00:00');
        const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        return { title: label, subtitle: `${deduplicated.length}/${habits.length} habits`, data: deduplicated };
      });
  }, [logs, habits]);

  if (logs.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyTitle}>No history yet</Text>
          <Text style={s.emptyHint}>Start completing habits and they'll appear here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.habitId + i}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionSub}>{section.subtitle}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[s.row, { borderLeftColor: item.habit.color }]}>
            <Text style={s.rowEmoji}>{item.habit.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowName}>{item.habit.name}</Text>
              {item.habit.type === 'volume' && (
                <Text style={s.rowCount}>{item.count}× completed</Text>
              )}
            </View>
            <View style={[s.badge, { backgroundColor: item.habit.color + '22' }]}>
              <Text style={[s.badgeText, { color: item.habit.color }]}>
                {item.count >= item.habit.targetCount ? '✓ Done' : `${item.count}/${item.habit.targetCount}`}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: SPACING.md, paddingBottom: 100 },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: SPACING.sm, marginTop: SPACING.md,
      backgroundColor: colors.background,
    },
    sectionTitle: { fontWeight: '700', fontSize: 15, color: colors.text },
    sectionSub: { fontSize: 12, color: colors.textSecondary },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
      marginBottom: SPACING.xs, borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
      gap: SPACING.sm,
    },
    rowEmoji: { fontSize: 22 },
    rowName: { fontWeight: '500', fontSize: 14, color: colors.text },
    rowCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    badge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
    badgeText: { fontSize: 12, fontWeight: '700' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm },
    emptyHint: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  });
}
