import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const PIECES = 18;
const COLORS = ['#6C63FF', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

function Piece({ delay }) {
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const startX = Math.random() * width;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(y, { toValue: height * 0.7, duration: 1600, useNativeDriver: true }),
        Animated.timing(x, { toValue: (Math.random() - 0.5) * 120, duration: 1600, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 * (Math.random() > 0.5 ? 1 : -1)}deg`] });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
          left: startX,
          top: -20,
          opacity,
          transform: [{ translateY: y }, { translateX: x }, { rotate: spin }],
        },
      ]}
    />
  );
}

export default function ConfettiOverlay({ visible }) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PIECES }).map((_, i) => (
        <Piece key={i} delay={i * 60} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute' },
});
