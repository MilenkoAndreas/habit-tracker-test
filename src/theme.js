export const LIGHT_COLORS = {
  primary: '#6C63FF',
  primaryLight: '#EEF0FF',
  primaryDark: '#5A52E0',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8F9FD',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.5)',
};

export const DARK_COLORS = {
  primary: '#8B83FF',
  primaryLight: '#1E1B3A',
  primaryDark: '#6C63FF',
  success: '#22C55E',
  successLight: '#052E16',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#0F0F16',
  card: '#1A1A28',
  text: '#EEEEF8',
  textSecondary: '#8A8AAE',
  border: '#2D2D42',
  overlay: 'rgba(0,0,0,0.75)',
};

// Legacy alias — screens that haven't adopted useColors() yet
export const COLORS = LIGHT_COLORS;

export const HABIT_COLORS = ['#6C63FF', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6'];

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 3,
};

export const DARK_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: 5,
};
