// src/components/icons/index.js
import React from 'react';
import Svg, {
  Path, Circle, Rect, Line, Polyline,
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

export function IconCheck({ color = '#ffffff', size = DEFAULT_SIZE }) { // white default: always rendered inside a colored tile
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
