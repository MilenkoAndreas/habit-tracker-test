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

  // True iOS dark mode system palette (OLED-optimised, matches UIKit defaults)
  background: '#000000',   // systemBackground — pure black for OLED
  card: '#1C1C1E',         // secondarySystemBackground — elevated surface
  text: '#FFFFFF',         // label — full white
  textSecondary: '#8E8E93', // secondaryLabel — iOS grey3
  border: '#38383A',       // opaqueSeparator — iOS system separator dark
  overlay: 'rgba(0,0,0,0.8)',

  success: '#16A34A',
  successLight: '#052E16',
  warning: '#D97706',
  danger: '#FF453A',       // systemRed dark
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
