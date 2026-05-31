import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '../AppContext';
import { SPACING, RADIUS } from '../theme';

export default function HabitCard({ habit, count, onPress, onLongPress }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const done = count >= habit.targetCount;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const isVolume = habit.type === 'volume';
  const progress = Math.min(count / habit.targetCount, 1);
  const s = getStyles(colors);

  return (
    <Animated.View style={{ transform: [{ scale }], marginHorizontal: SPACING.lg }}>
      <TouchableOpacity
        style={[s.card, { borderLeftColor: habit.color }, done && s.cardDone]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.85}
      >
        <Text style={s.emoji}>{habit.emoji}</Text>
        <View style={s.info}>
          <Text style={[s.name, done && s.nameDone]} numberOfLines={1}>{habit.name}</Text>
          {isVolume ? (
            <View style={s.volumeRow}>
              <View style={s.volumeBar}>
                <View style={[s.volumeFill, { width: `${progress * 100}%`, backgroundColor: habit.color }]} />
              </View>
              <Text style={[s.countText, { color: habit.color }]}>{count}/{habit.targetCount}</Text>
            </View>
          ) : (
            <Text style={s.typeLabel}>{done ? 'Completed ✓' : 'Tap to complete'}</Text>
          )}
        </View>
        <View style={[s.check, done && { backgroundColor: habit.color, borderColor: habit.color }]}>
          {done && <Text style={s.tick}>✓</Text>}
          {isVolume && !done && count > 0 && (
            <Text style={[s.tick, { color: habit.color, fontSize: 11 }]}>{count}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, marginBottom: SPACING.sm, borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
      gap: SPACING.sm,
    },
    cardDone: { backgroundColor: colors.primaryLight },
    emoji: { fontSize: 26 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 3 },
    nameDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
    typeLabel: { fontSize: 12, color: colors.textSecondary },
    volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    volumeBar: { flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    volumeFill: { height: '100%', borderRadius: 3 },
    countText: { fontSize: 12, fontWeight: '700', minWidth: 28 },
    check: {
      width: 28, height: 28, borderRadius: RADIUS.sm,
      borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    tick: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
