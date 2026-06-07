import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '../AppContext';
import { SPACING, RADIUS } from '../theme';
import { ICON_MAP, IconCheck } from './icons/index';

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

  // Render SVG icon if key known, else fall back to emoji text
  const IconComponent = ICON_MAP[habit.emoji];
  const iconColor = '#ffffff';
  const tileBg = done ? colors.primary : colors.text;

  return (
    <Animated.View style={{ transform: [{ scale }], marginHorizontal: SPACING.lg }}>
      <TouchableOpacity
        style={[s.card, done && s.cardDone]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.85}
      >
        {/* Icon tile */}
        <View style={[s.iconTile, { backgroundColor: tileBg }]}>
          {IconComponent ? (
            <IconComponent color={iconColor} size={20} />
          ) : (
            <Text style={s.emoji}>{habit.emoji}</Text>
          )}
        </View>

        {/* Text + progress */}
        <View style={s.info}>
          <Text style={[s.name, done && s.nameDone]} numberOfLines={1}>{habit.name}</Text>
          {isVolume ? (
            <View style={s.volumeRow}>
              <View style={s.volumeBar}>
                <View style={[s.volumeFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={[s.countText, done && { color: colors.primary }]}>
                {count}/{habit.targetCount}
              </Text>
            </View>
          ) : (
            <Text style={[s.typeLabel, done && { color: colors.primary }]}>
              {done ? 'Done' : 'Tap to complete'}
            </Text>
          )}
        </View>

        {/* Check box */}
        <View style={[s.check, done && s.checkDone]}>
          {done && <IconCheck color="#ffffff" size={14} />}
          {isVolume && !done && count > 0 && (
            <Text style={[s.tick, { color: colors.primary, fontSize: 11 }]}>{count}</Text>
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
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: SPACING.sm,
    },
    cardDone: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.accentBorder,
    },
    iconTile: {
      width: 38, height: 38, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    emoji: { fontSize: 20 },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
    nameDone: {
      color: colors.accentText,
      textDecorationLine: 'line-through',
      opacity: 0.65,
    },
    typeLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
    volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
    volumeBar: {
      flex: 1, height: 3, backgroundColor: colors.border,
      borderRadius: 2, overflow: 'hidden',
    },
    volumeFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
    countText: { fontSize: 12, fontWeight: '700', minWidth: 28, color: colors.textSecondary },
    check: {
      width: 24, height: 24, borderRadius: 7,
      borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    checkDone: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tick: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
