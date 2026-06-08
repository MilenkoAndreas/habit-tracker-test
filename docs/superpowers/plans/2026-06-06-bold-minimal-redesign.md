# Bold Minimal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually redesign the Antigravity habit tracker to a Bold Minimal aesthetic — off-white background, near-black ink, Growth Green (#16A34A) as the single accent color, and a custom SVG icon system throughout.

**Architecture:** Pure visual layer change — no data model, sync, or backend modifications. Token values in `theme.js` change (keeping most token names the same to minimise cascading edits). A new `src/components/icons/` directory provides all SVG icon components. Each screen's `getStyles()` function is updated in place.

**Tech Stack:** Expo SDK 54, React Native 0.81.5, `react-native-svg` (already installed), `expo-haptics`, `@react-navigation/bottom-tabs`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/theme.js` | Modify | Token values → new palette; add `accentBorder`, `accentText` tokens |
| `src/components/icons/index.js` | **Create** | All SVG icon components (tab bar + habit categories) |
| `src/components/HabitCard.js` | Modify | New pending/done card styles; SVG icon tile; renders icon key or legacy emoji |
| `App.js` | Modify | Floating pill tab bar; SVG tab icons replacing emoji |
| `src/screens/HomeScreen.js` | Modify | Progress ring + streak badge header; updated card list padding |
| `src/screens/CreateHabitScreen.js` | Modify | Replace emoji scroll + color picker with SVG icon grid picker |
| `src/screens/InsightsScreen.js` | Modify | Stat cards, bar chart, AI cards, reflection tab switcher |
| `src/screens/ManageScreen.js` | Modify | Section label style; habit row icon tiles |
| `src/screens/OnboardingScreen.js` | Modify | Remove LinearGradient; bold-type layout; ink buttons |

---

## Task 1: Update Theme Tokens

**Files:**
- Modify: `src/theme.js`

- [ ] **Replace the entire contents of `src/theme.js`** with the new token system. Keep the same export names (`LIGHT_COLORS`, `DARK_COLORS`, `COLORS`, `SPACING`, `RADIUS`, `SHADOW`) so existing import statements don't break. Add `accentBorder` and `accentText` as new tokens.

```js
// src/theme.js

export const LIGHT_COLORS = {
  // Accent (the ONLY non-neutral color)
  primary: '#16A34A',        // Growth Green — used for done state, progress, CTAs
  primaryLight: '#F0FDF4',   // Done card background tint
  primaryDark: '#15803D',    // Darker green for pressed states
  accentBorder: '#BBF7D0',   // Done card border
  accentText: '#15803D',     // Done habit name (strikethrough)

  // Neutrals
  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#111111',           // Near-black — headings, body, icons
  textSecondary: '#6B7280',  // Muted — date labels, sub-labels, hints
  border: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.5)',

  // Semantic
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  danger: '#EF4444',
};

export const DARK_COLORS = {
  primary: '#16A34A',
  primaryLight: '#052E16',
  primaryDark: '#4ADE80',
  accentBorder: '#14532D',
  accentText: '#4ADE80',

  background: '#0D0D0D',
  card: '#1A1A1A',
  text: '#F5F5F5',
  textSecondary: '#6B7280',
  border: '#2A2A2A',
  overlay: 'rgba(0,0,0,0.75)',

  success: '#16A34A',
  successLight: '#052E16',
  warning: '#D97706',
  danger: '#EF4444',
};

// Legacy alias — keeps App.js splash screen working without edits
export const COLORS = LIGHT_COLORS;

// Habit colors kept for data-model compat (no longer shown in UI)
export const HABIT_COLORS = ['#111111'];

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};

export const DARK_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 6,
};
```

- [ ] **Start the Expo dev server and confirm the app launches without errors.**

```bash
cd "habit-tracker-test"
npm start
```

Expected: app opens, colors shift to green accent. Some screens may look rough — that's fine, subsequent tasks fix each one.

- [ ] **Commit.**

```bash
git add src/theme.js
git commit -m "design: update theme tokens to Bold Minimal palette (green accent)"
```

---

## Task 2: Create the SVG Icon System

**Files:**
- Create: `src/components/icons/index.js`

All icons use `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"` throughout. Each component accepts `color` (default `'#111111'`) and `size` (default `24`).

The `HabitCard` will look up an icon by the string stored in `habit.emoji`. If the string matches a known key (e.g. `'run'`), it renders the SVG. If not (legacy emoji character like `'🏃'`), it renders a `<Text>` as before. This gives full backward compatibility.

- [ ] **Create `src/components/icons/index.js`** with the following content:

```js
// src/components/icons/index.js
import React from 'react';
import Svg, {
  Path, Circle, Rect, Line, Polyline, G,
} from 'react-native-svg';

const DEFAULT_COLOR = '#111111';
const DEFAULT_SIZE = 24;

// ── Tab bar icons ──────────────────────────────────────────────────────────

export function IconHome({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11L12 4l8 7v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Rect x={9} y={16} width={6} height={5} rx={1} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function IconBarChart({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={12} width={4} height={9} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={10} y={7} width={4} height={14} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={17} y={3} width={4} height={18} rx={1} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function IconGrid({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={8} height={8} rx={2} stroke={color} strokeWidth={2} />
      <Rect x={13} y={3} width={8} height={8} rx={2} stroke={color} strokeWidth={2} />
      <Rect x={3} y={13} width={8} height={8} rx={2} stroke={color} strokeWidth={2} />
      <Rect x={13} y={13} width={8} height={8} rx={2} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

// ── Habit category icons ───────────────────────────────────────────────────

export function IconRun({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={15} cy={4} r={2} fill={color} />
      <Path d="M7 9l4 2-2 5H6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 11l5-2 1 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 16l-1 4m7-4l2 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconBook({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h7a1 1 0 011 1v14a1 1 0 01-1 1H4V4z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M20 4h-7a1 1 0 00-1 1v14a1 1 0 001 1h7V4z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Line x1={14} y1={9} x2={19} y2={9} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={14} y1={13} x2={17} y2={13} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconDrop({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C12 3 5 11 5 16a7 7 0 0014 0c0-5-7-13-7-13z"
        stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 18a3 3 0 006 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}

export function IconMeditate({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={5} r={2} fill={color} />
      <Path d="M5 13c2-2 4.5-3 7-3s5 1 7 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 13v5l3 2 3-2v-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMoon({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
        stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconApple({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6C10 3.5 7 4 6 7c-2 4-1 9 2 13 1 2 3 3 4 3s3-1 4-3c3-4 4-9 2-13-1-3-4-3.5-6-1z"
        stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M12 6c0-2 1.5-4 3.5-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconPen({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconDumbbell({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={7} y={10} width={10} height={4} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={2} y={8} width={4} height={8} rx={2} stroke={color} strokeWidth={2} />
      <Rect x={18} y={8} width={4} height={8} rx={2} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function IconCode({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="16,18 22,12 16,6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="8,6 2,12 8,18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconHeart({ color = DEFAULT_COLOR, size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

// ── Checkmark (used inside the done check tile on HabitCard) ───────────────

export function IconCheck({ color = '#ffffff', size = DEFAULT_SIZE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="4,13 9,18 20,7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Icon registry — maps habit.emoji string keys to components ─────────────
// HabitCard checks this map. If habit.emoji is a key here, renders the SVG.
// If not (legacy emoji string), renders the emoji as <Text>.

export const ICON_MAP = {
  run: IconRun,
  book: IconBook,
  drop: IconDrop,
  meditate: IconMeditate,
  moon: IconMoon,
  apple: IconApple,
  pen: IconPen,
  dumbbell: IconDumbbell,
  code: IconCode,
  heart: IconHeart,
};

// Ordered list for the icon picker grid in CreateHabitScreen
export const ICON_PICKER_ITEMS = [
  { key: 'run',      label: 'Run',       Component: IconRun },
  { key: 'book',     label: 'Read',      Component: IconBook },
  { key: 'drop',     label: 'Water',     Component: IconDrop },
  { key: 'meditate', label: 'Meditate',  Component: IconMeditate },
  { key: 'moon',     label: 'Sleep',     Component: IconMoon },
  { key: 'apple',    label: 'Nutrition', Component: IconApple },
  { key: 'pen',      label: 'Journal',   Component: IconPen },
  { key: 'dumbbell', label: 'Strength',  Component: IconDumbbell },
  { key: 'code',     label: 'Code',      Component: IconCode },
  { key: 'heart',    label: 'Mindful',   Component: IconHeart },
];
```

- [ ] **Verify the file parses — restart the dev server and confirm no import errors.**

- [ ] **Commit.**

```bash
git add src/components/icons/index.js
git commit -m "design: add custom SVG icon system (tab bar + 10 habit categories)"
```

---

## Task 3: Rewrite HabitCard

**Files:**
- Modify: `src/components/HabitCard.js`

The card no longer uses `habit.color` for the left border. It renders an SVG icon if `habit.emoji` is a key in `ICON_MAP`, otherwise falls back to the emoji `<Text>`. Pending = ink tile, done = green tile.

- [ ] **Replace the full contents of `src/components/HabitCard.js`:**

```js
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
  const iconColor = done ? '#ffffff' : '#ffffff';
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
```

- [ ] **Check the app — habit cards should now show ink icon tiles (or emoji), green when done, no left colour strip.**

- [ ] **Commit.**

```bash
git add src/components/HabitCard.js
git commit -m "design: rewrite HabitCard — ink/green icon tiles, no left colour strip"
```

---

## Task 4: Update App.js — Floating Pill Tab Bar

**Files:**
- Modify: `App.js`

Replace the emoji `TabIcon` component and standard tab bar with a floating pill using the SVG tab icons. Also update the splash/loading screens to use the new ink colour.

- [ ] **Replace the full contents of `App.js`:**

```js
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/AuthContext';
import { AppProvider, useApp, useColors } from './src/AppContext';
import { isOnboarded } from './src/storage';
import { COLORS } from './src/theme';
import { IconHome, IconBarChart, IconGrid } from './src/components/icons/index';

import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateHabitScreen from './src/screens/CreateHabitScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ManageScreen from './src/screens/ManageScreen';
import HowItWorksScreen from './src/screens/HowItWorksScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 24,
          right: 24,
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1.5,
          borderColor: colors.border,
          height: 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <IconHome color={focused ? colors.text : colors.border} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <IconBarChart color={focused ? colors.text : colors.border} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Manage"
        component={ManageScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <IconGrid color={focused ? colors.text : colors.border} size={22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function Splash() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.text }} />
    </View>
  );
}

function RootNavigator() {
  const { session, authLoading, needsPasswordReset } = useAuth();
  const { state } = useApp();
  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    if (!session) return;
    isOnboarded().then(setOnboarded);
  }, [session]);

  if (authLoading || (session && state.loading)) return <Splash />;

  if (needsPasswordReset) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  if (onboarded === null) return <Splash />;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!onboarded ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : null}
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="CreateHabit"
            component={CreateHabitScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="HowItWorks"
            component={HowItWorksScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

function AuthConsumer() {
  const { session } = useAuth();
  return (
    <AppProvider userId={session?.user?.id}>
      <RootNavigator />
    </AppProvider>
  );
}
```

- [ ] **Check the app — tab bar should now be a floating pill with SVG icons, lifted above the screen bottom.**

- [ ] **Scroll down on HomeScreen to confirm the floating tab bar doesn't obscure the last habit card.** If it does, note it — Task 5 adds bottom padding to the scroll content.

- [ ] **Commit.**

```bash
git add App.js
git commit -m "design: floating pill tab bar with SVG icons"
```

---

## Task 5: Rewrite HomeScreen Header (Ring + Streak)

**Files:**
- Modify: `src/screens/HomeScreen.js`

Replace the purple gradient header with the ring + streak badge layout. Add extra bottom padding to the scroll content to clear the floating tab bar (88px accounts for 60px bar + 16px bottom offset + 12px breathing room).

- [ ] **Replace the full contents of `src/screens/HomeScreen.js`:**

```js
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
    content: { paddingBottom: 100 }, // 60 tab bar + 16 offset + 24 breathing room

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
```

- [ ] **Check the app: Home screen should show the ring + greeting, no gradient header, floating tab bar visible at bottom.**

- [ ] **Commit.**

```bash
git add src/screens/HomeScreen.js
git commit -m "design: HomeScreen — ring+streak header, ink/green palette, floating tab clearance"
```

---

## Task 6: Update CreateHabitScreen — Icon Picker

**Files:**
- Modify: `src/screens/CreateHabitScreen.js`

Replace emoji scroll + color picker with the 2-row SVG icon grid. Remove `color` state entirely. The habit object still writes a `color` field as `'#111111'` so sync.js doesn't need changes.

- [ ] **Replace the full contents of `src/screens/CreateHabitScreen.js`:**

```js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp, useColors } from '../AppContext';
import { scheduleHabitReminder, requestPermissions } from '../notifications';
import { SPACING, RADIUS } from '../theme';
import { ICON_PICKER_ITEMS, ICON_MAP, IconCheck } from '../components/icons/index';

export default function CreateHabitScreen({ navigation, route }) {
  const editHabit = route.params?.editHabit ?? null;
  const isEdit = editHabit !== null;
  const { dispatch } = useApp();
  const colors = useColors();
  const s = getStyles(colors);

  const [name, setName] = useState(editHabit?.name ?? '');
  // Default icon key; fall back gracefully if editing a legacy emoji habit
  const defaultIcon = ICON_MAP[editHabit?.emoji] ? editHabit.emoji : 'run';
  const [iconKey, setIconKey] = useState(defaultIcon);
  const [type, setType] = useState(editHabit?.type ?? 'once');
  const [targetCount, setTargetCount] = useState(editHabit?.targetCount ?? 3);
  const [reminder, setReminder] = useState(editHabit?.reminder ?? { enabled: false, hour: 9, minute: 0 });

  const nextMinute = (m) => (Math.floor(m / 5) * 5 + 5) % 60;
  const prevMinute = (m) => ((Math.ceil(m / 5) * 5 - 5) + 60) % 60;
  const formatTime = (h, m) => {
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  const toggleReminder = async (val) => {
    if (val) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Notifications Blocked', 'Enable notifications in your device settings to use reminders.');
        return;
      }
    }
    setReminder(r => ({ ...r, enabled: val }));
  };

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please give your habit a name.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const habit = {
      id: isEdit ? editHabit.id : Date.now().toString(),
      name: name.trim(),
      emoji: iconKey,      // stores icon key e.g. 'run', 'book'
      type,
      targetCount: type === 'volume' ? targetCount : 1,
      color: '#111111',    // kept for sync compat; no longer displayed
      reminder,
      createdAt: isEdit ? editHabit.createdAt : new Date().toISOString(),
    };
    if (isEdit) {
      dispatch({ type: 'UPDATE_HABIT', habit });
    } else {
      dispatch({ type: 'ADD_HABIT', habit });
    }
    scheduleHabitReminder(habit).catch(() => {});
    navigation.goBack();
  };

  const SelectedIconComponent = ICON_MAP[iconKey];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.title}>{isEdit ? 'Edit Habit' : 'New Habit'}</Text>
          <TouchableOpacity onPress={save}>
            <Text style={[s.save, !name.trim() && s.saveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {/* Icon picker */}
          <Text style={s.label}>Icon</Text>
          <View style={s.iconGrid}>
            {ICON_PICKER_ITEMS.map(({ key, label, Component }) => {
              const selected = iconKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.iconGridItem, selected && s.iconGridItemSelected]}
                  onPress={() => { setIconKey(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Component color={selected ? '#ffffff' : colors.text} size={22} />
                  <Text style={[s.iconLabel, selected && s.iconLabelSelected]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Name */}
          <Text style={s.label}>Name</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Morning run, Drink water…"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            autoFocus={!isEdit}
          />

          {/* Type */}
          <Text style={s.label}>Type</Text>
          <View style={s.typeRow}>
            {[
              ['once', 'Once per day', 'Tap once to complete'],
              ['volume', 'Volume', 'Tap multiple times'],
            ].map(([val, label, hint]) => (
              <TouchableOpacity
                key={val}
                style={[s.typeCard, type === val && s.typeCardSelected]}
                onPress={() => setType(val)}
              >
                <Text style={[s.typeCardLabel, type === val && s.typeCardLabelSelected]}>{label}</Text>
                <Text style={s.typeCardHint}>{hint}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Volume count */}
          {type === 'volume' && (
            <View>
              <Text style={s.label}>Times per day</Text>
              <View style={s.counter}>
                <TouchableOpacity onPress={() => setTargetCount(Math.max(2, targetCount - 1))} style={s.counterBtn}>
                  <Text style={s.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{targetCount}</Text>
                <TouchableOpacity onPress={() => setTargetCount(Math.min(30, targetCount + 1))} style={s.counterBtn}>
                  <Text style={s.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reminder */}
          <Text style={s.label}>Reminder</Text>
          <View style={s.reminderCard}>
            <View style={s.reminderRow}>
              <View>
                <Text style={s.reminderTitle}>Daily Reminder</Text>
                <Text style={s.reminderDesc}>{reminder.enabled ? formatTime(reminder.hour, reminder.minute) : 'Off'}</Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={toggleReminder}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            {reminder.enabled && (
              <View style={s.timePicker}>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, hour: (r.hour + 23) % 24 }))}>
                  <Text style={s.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.timeUnit}>{reminder.hour.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, hour: (r.hour + 1) % 24 }))}>
                  <Text style={s.stepBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={s.timeSep}>:</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, minute: prevMinute(r.minute) }))}>
                  <Text style={s.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.timeUnit}>{reminder.minute.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setReminder(r => ({ ...r, minute: nextMinute(r.minute) }))}>
                  <Text style={s.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Preview */}
          <Text style={s.label}>Preview</Text>
          <View style={s.preview}>
            <View style={s.previewTile}>
              {SelectedIconComponent && <SelectedIconComponent color="#ffffff" size={20} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.previewName}>{name || 'Your habit name'}</Text>
              <Text style={s.previewType}>{type === 'volume' ? `${targetCount}× per day` : 'Once per day'}</Text>
            </View>
            <View style={s.previewCheck} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
      backgroundColor: colors.card, borderBottomWidth: 1.5, borderBottomColor: colors.border,
    },
    cancel: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
    title: { fontWeight: '800', fontSize: 17, color: colors.text },
    save: { color: colors.primary, fontWeight: '800', fontSize: 16 },
    saveDisabled: { opacity: 0.35 },
    form: { padding: SPACING.lg, paddingBottom: 60 },
    label: {
      fontWeight: '700', color: colors.textSecondary, fontSize: 10,
      marginBottom: SPACING.sm, marginTop: SPACING.md,
      textTransform: 'uppercase', letterSpacing: 1.5,
    },
    iconGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm,
    },
    iconGridItem: {
      width: '18%', aspectRatio: 1, borderRadius: 12,
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', gap: 3,
    },
    iconGridItemSelected: {
      backgroundColor: colors.text, borderColor: colors.text,
    },
    iconLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary },
    iconLabelSelected: { color: '#fff' },
    input: {
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
      fontSize: 16, fontWeight: '600', color: colors.text,
      borderWidth: 1.5, borderColor: colors.border, marginBottom: SPACING.sm,
    },
    typeRow: { flexDirection: 'row', gap: SPACING.sm },
    typeCard: {
      flex: 1, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: colors.card,
    },
    typeCardSelected: { borderColor: colors.text, backgroundColor: colors.background },
    typeCardLabel: { fontWeight: '700', fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
    typeCardLabelSelected: { color: colors.text },
    typeCardHint: { fontSize: 11, color: colors.textSecondary },
    counter: {
      flexDirection: 'row', alignItems: 'center',
      gap: SPACING.xl, marginBottom: SPACING.sm,
    },
    counterBtn: {
      width: 40, height: 40, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    counterBtnText: { fontSize: 22, fontWeight: '600', color: colors.text, lineHeight: 26 },
    counterVal: { fontSize: 28, fontWeight: '900', color: colors.text, minWidth: 40, textAlign: 'center' },
    reminderCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.md,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
    },
    reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reminderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    reminderDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
    timePicker: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, marginTop: SPACING.md, paddingTop: SPACING.md,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    stepBtn: {
      width: 36, height: 36, borderRadius: 18,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    stepBtnText: { fontSize: 20, fontWeight: '600', color: colors.text, lineHeight: 24 },
    timeUnit: { fontSize: 22, fontWeight: '900', color: colors.text, minWidth: 36, textAlign: 'center' },
    timeSep: { fontSize: 22, fontWeight: '700', color: colors.textSecondary },
    preview: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border, gap: SPACING.sm,
    },
    previewTile: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: colors.text,
      alignItems: 'center', justifyContent: 'center',
    },
    previewName: { fontSize: 15, fontWeight: '700', color: colors.text },
    previewType: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
    previewCheck: {
      width: 24, height: 24, borderRadius: 7,
      borderWidth: 2, borderColor: colors.border,
    },
  });
}
```

- [ ] **Test: open Create Habit from Home, verify icon grid appears, select an icon, name it, save. Confirm the new habit appears on HomeScreen with the SVG icon in a black tile.**

- [ ] **Commit.**

```bash
git add src/screens/CreateHabitScreen.js
git commit -m "design: CreateHabitScreen — SVG icon picker replacing emoji+color pickers"
```

---

## Task 7: Update InsightsScreen

**Files:**
- Modify: `src/screens/InsightsScreen.js`

Update stat card style (hero numbers, uppercase labels, ink borders), bar chart (ink bars, accent for today), reflection tab switcher (pill style), AI card borders.

- [ ] **Read the existing full file then apply the following targeted style changes to `getStyles()`** — the logic is unchanged, only styles update.

Find `function getStyles(colors) {` and replace the entire function with:

```js
function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: 100 },

    // Section labels
    sectionLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', color: colors.textSecondary,
      marginBottom: SPACING.sm, marginTop: SPACING.lg,
    },

    // Stat row
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

    // Chart card
    chartCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
      marginBottom: SPACING.sm,
    },

    // Habit streak rows
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

    // AI Coach card
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

    // Reflection tab switcher
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

    // Reflection card
    reflectionCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
    },
    reflectionText: { fontSize: 15, color: colors.text, lineHeight: 23, fontWeight: '500' },
    reflectionEmpty: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },

    // Loading / empty
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    emptyCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg,
      padding: SPACING.xl, borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center',
    },
    emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  });
}
```

- [ ] **Update the JSX in `InsightsScreen`** to use the new class names. Find each style reference in the JSX and match it to the new keys above. Specific JSX changes:

  **Stat cards** — wrap each in `<View style={s.statCard}>`, put the number in `<Text style={s.statNumber}>`, label in `<Text style={s.statLabel}>`.

  **Bar chart** — change `fill={habit.color}` to `fill={isToday ? colors.primary : colors.text}` where `isToday` is true for the rightmost bar (index 6 in a 7-day chart). Add `opacity` of `0.15` to non-today bars: `opacity={isToday ? 1 : 0.2}`.

  **Habit streak rows** — replace the colored left-border card with `s.habitStreakCard`. Replace `fill={habit.color}` on the streak bar with `fill={colors.primary}`. Replace the emoji tile with an icon tile using `ICON_MAP`:

  ```jsx
  import { ICON_MAP } from '../components/icons/index';
  // ... inside the map:
  const IconComp = ICON_MAP[habit.emoji];
  // ...
  <View style={s.habitStreakTile}>
    {IconComp ? <IconComp color="#fff" size={16} /> : <Text style={{fontSize:14}}>{habit.emoji}</Text>}
  </View>
  ```

  **Reflection tab switcher** — replace the current tab buttons with:
  ```jsx
  <View style={s.tabSwitcher}>
    {['weekly', 'monthly'].map(t => (
      <TouchableOpacity
        key={t}
        style={[s.tabBtn, reflectionTab === t && s.tabBtnActive]}
        onPress={() => setReflectionTab(t)}
      >
        <Text style={[s.tabBtnText, reflectionTab === t && s.tabBtnTextActive]}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
  ```

  **AI Coach card** — use `s.coachCard`, `s.coachHeader` (label "AI COACH"), `s.coachText`.

  **Section headings** — replace all `Text` section headers with `<Text style={s.sectionLabel}>`.

- [ ] **Check: InsightsScreen shows ink-colored bars, green accent for current day, pill tab switcher, black-bordered AI card.**

- [ ] **Commit.**

```bash
git add src/screens/InsightsScreen.js
git commit -m "design: InsightsScreen — hero stat numbers, ink chart bars, pill tab switcher"
```

---

## Task 8: Update ManageScreen

**Files:**
- Modify: `src/screens/ManageScreen.js`

Section labels → uppercase small caps. Habit rows → icon tile system (same ICON_MAP lookup). Remove references to `habit.color`.

- [ ] **In `ManageScreen.js`, update `getStyles()` — replace the existing `StyleSheet.create({...})` return value** with:

```js
return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: colors.textSecondary,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  settingLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  settingValue: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

  habitRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  habitIconTile: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  habitName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  habitStreak: { fontSize: 12, fontWeight: '700', color: colors.primary },
  habitActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: colors.border,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  deleteBtn: { borderColor: colors.danger },
  deleteBtnText: { color: colors.danger },

  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
    backgroundColor: colors.card,
  },
  addIcon: {
    width: 36, height: 36, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },

  signOutBtn: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.xl,
    paddingVertical: 14, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },

  devSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg },
  devToggle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  devToggleText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  devBtn: {
    paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  devBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
});
```

- [ ] **Update the JSX** to use these styles. For each `habit` in the habit list:

```jsx
import { ICON_MAP } from '../components/icons/index';
// inside the habit map:
const IconComp = ICON_MAP[habit.emoji];
// ...
<View style={s.habitRow}>
  <View style={s.habitIconTile}>
    {IconComp
      ? <IconComp color="#fff" size={18} />
      : <Text style={{ fontSize: 18 }}>{habit.emoji}</Text>}
  </View>
  <Text style={s.habitName} numberOfLines={1}>{habit.name}</Text>
  <Text style={s.habitStreak}>{calcStreak(logs, habit.id)} day streak</Text>
  <View style={s.habitActions}>
    <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(habit)}>
      <Text style={s.actionBtnText}>Edit</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => confirmDelete(habit)}>
      <Text style={[s.actionBtnText, s.deleteBtnText]}>Delete</Text>
    </TouchableOpacity>
  </View>
</View>
```

- [ ] **Check: ManageScreen shows icon tiles in habit rows, no colour references, uppercase section labels.**

- [ ] **Commit.**

```bash
git add src/screens/ManageScreen.js
git commit -m "design: ManageScreen — icon tiles, uppercase section labels, ink palette"
```

---

## Task 9: Update OnboardingScreen

**Files:**
- Modify: `src/screens/OnboardingScreen.js`

Remove `LinearGradient`. Replace with a white background and oversized bold headings. Use the icon picker (same `ICON_PICKER_ITEMS`) instead of the emoji scroll. Progress dots become ink (active) / border-outline (inactive).

- [ ] **At the top of `OnboardingScreen.js`, remove the `LinearGradient` import and the `HABIT_COLORS` import.** Add the icon picker import:

```js
// Remove:
// import { LinearGradient } from 'expo-linear-gradient';
// import { HABIT_COLORS, SPACING, RADIUS } from '../theme';

// Add / keep:
import { SPACING, RADIUS } from '../theme';
import { ICON_PICKER_ITEMS, ICON_MAP } from '../components/icons/index';
```

- [ ] **Change the `emoji` state to `iconKey`** and default it to `'run'`:

```js
const [iconKey, setIconKey] = useState('run');
```

- [ ] **In `finishOnboarding`, update the habit object** to use `iconKey` and a fixed color:

```js
const habit = {
  id: Date.now().toString(),
  name: habitName.trim(),
  emoji: iconKey,
  type,
  targetCount: type === 'volume' ? targetCount : 1,
  color: '#111111',
  createdAt: new Date().toISOString(),
};
```

- [ ] **Replace the emoji scroll in Step 1 JSX** with the icon grid:

```jsx
<View style={s.iconGrid}>
  {ICON_PICKER_ITEMS.map(({ key, label, Component }) => {
    const selected = iconKey === key;
    return (
      <TouchableOpacity
        key={key}
        style={[s.iconGridItem, selected && s.iconGridItemSelected]}
        onPress={() => setIconKey(key)}
      >
        <Component color={selected ? '#fff' : colors.text} size={20} />
        <Text style={[s.iconLabel, selected && s.iconLabelSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  })}
</View>
```

- [ ] **Replace all `LinearGradient` wrappers** in the JSX with `<View style={s.safe}>`. Remove any `colors` props that were gradient arrays.

- [ ] **Replace `getStyles()` return value** with:

```js
return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: {
    flex: 1, padding: SPACING.lg, paddingTop: SPACING.xl,
    justifyContent: 'space-between',
  },

  stepLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: colors.textSecondary, marginBottom: SPACING.md,
  },
  heading: {
    fontSize: 28, fontWeight: '900', color: colors.text,
    letterSpacing: -0.5, lineHeight: 34, marginBottom: SPACING.sm,
  },
  subheading: {
    fontSize: 16, color: colors.textSecondary, lineHeight: 24, fontWeight: '500',
    marginBottom: SPACING.xl,
  },

  // How it works cards
  howCard: {
    backgroundColor: colors.card, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1.5, borderColor: colors.border,
    marginBottom: SPACING.sm,
  },
  howCardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 3 },
  howCardDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, fontWeight: '500' },
  howCardNum: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  howCardNumText: { fontSize: 13, fontWeight: '900', color: colors.card },

  // Icon grid (reuse from CreateHabit)
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  iconGridItem: {
    width: '18%', aspectRatio: 1, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  iconGridItemSelected: { backgroundColor: colors.text, borderColor: colors.text },
  iconLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary },
  iconLabelSelected: { color: '#fff' },

  // Name input
  nameInput: {
    backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: 18, fontWeight: '700', color: colors.text,
    borderWidth: 1.5, borderColor: colors.border, marginBottom: SPACING.md,
  },

  // Type selector
  typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  typeCard: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: colors.card,
  },
  typeCardSelected: { borderColor: colors.text },
  typeCardLabel: { fontWeight: '700', fontSize: 14, color: colors.textSecondary, marginBottom: 3 },
  typeCardLabelSelected: { color: colors.text },
  typeCardHint: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },

  // Progress dots
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.lg },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: colors.border },
  dotActive: { backgroundColor: colors.text, borderColor: colors.text },

  // CTA button
  primaryBtn: {
    backgroundColor: colors.text, paddingVertical: 16,
    borderRadius: RADIUS.full, alignItems: 'center', marginBottom: SPACING.md,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: colors.card },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
});
```

- [ ] **Check: Onboarding screen shows bold text on white background, icon picker in step 1, ink progress dots, no gradient.**

- [ ] **Commit.**

```bash
git add src/screens/OnboardingScreen.js
git commit -m "design: OnboardingScreen — remove gradient, bold type, icon picker"
```

---

## Task 10: Final Polish Pass

**Files:**
- Modify: `src/screens/AuthScreen.js` (minor — button + input colours)
- Modify: `src/screens/HowItWorksScreen.js` (minor — remove gradient if present)
- Modify: `src/screens/ResetPasswordScreen.js` (minor — button colours)

- [ ] **In `AuthScreen.js`**, find the primary button style and change its `backgroundColor` from `colors.primary` (now green — which is correct) to confirm it renders well. No structural change needed; the token swap in Task 1 handles it automatically. Launch and verify the auth screen visually.

- [ ] **In `HowItWorksScreen.js`**, if a `LinearGradient` is used for a header, replace with `backgroundColor: colors.text` on a `View`. If not, skip.

- [ ] **Open the app end-to-end and walk through every screen:**
  - Sign out → Auth screen (green button, ink type)
  - Sign in → Onboarding (if fresh account) → icon picker works, ink dots, ink button
  - HomeScreen → ring header visible, streak pill appears after ≥1 day streak, habit cards ink/green
  - Tap a habit → green card, checkmark, ring fills
  - Open CreateHabit modal → icon grid, no colour picker, preview shows SVG icon
  - Progress tab → stat cards with hero numbers, ink bars, green for today, pill tab switcher
  - Manage tab → icon tiles on habit rows, uppercase labels
  - Dark mode toggle → all screens update correctly with dark palette

- [ ] **Commit the final pass.**

```bash
git add src/screens/AuthScreen.js src/screens/HowItWorksScreen.js src/screens/ResetPasswordScreen.js
git commit -m "design: auth/utility screens — final palette alignment"
```

---

## Spec Coverage Check

| Spec requirement | Implemented in |
|---|---|
| Bold Minimal direction | Task 1 (tokens), all screen tasks |
| Growth Green accent only | Task 1 (token values), HabitCard (Task 3), HomeScreen (Task 5) |
| Custom SVG icon system, 2px stroke | Task 2 |
| Tab bar icons: Home, BarChart, Grid | Task 2 + Task 4 |
| 10 habit category icons | Task 2 |
| Floating pill tab bar | Task 4 |
| Ring + streak badge header | Task 5 |
| Habit card: ink tile → green when done | Task 3 |
| No left colour strip | Task 3 |
| No per-habit colour picker | Task 6 |
| SVG icon picker in CreateHabit | Task 6 |
| Stat cards with hero numbers | Task 7 |
| Ink bar chart, accent for today | Task 7 |
| Pill reflection tab switcher | Task 7 |
| Black-bordered AI coach card | Task 7 |
| Manage: icon tiles + uppercase labels | Task 8 |
| Onboarding: no gradient, ink buttons | Task 9 |
| Dark mode compatibility | Task 1 (dark tokens) |
| No data model / sync / backend changes | Verified: `habit.color` kept as `'#111111'`; `habit.emoji` stores icon key; `sync.js` untouched |
