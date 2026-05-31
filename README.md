# Habit Tracker Test

A habit tracker built with Expo and React Native. Track daily habits, build streaks, and stay consistent — one tap at a time.

## Features

- **Today screen** — Check off habits with haptic feedback and a satisfying animated bounce. Completing all habits triggers a confetti celebration.
- **Volume habits** — Some habits aren't just yes/no. Multi-tap to log any count (e.g. 8 glasses of water).
- **3-Day Kickstart challenge** — Auto-created after onboarding to get you moving on day one.
- **History tab** — Full log of past completions grouped by date.
- **Stats tab** — 7-day bar chart, per-habit streaks, and overall metrics powered by react-native-svg.
- **Daily reminders** — Push notifications at 9am and 7pm via expo-notifications.
- **Onboarding** — 3-step wizard that sets up your first habits and schedules reminders.

## Tech stack

- [Expo](https://expo.dev) SDK 54
- React Navigation (native stack + bottom tabs)
- AsyncStorage for persistence
- expo-haptics, expo-notifications, expo-linear-gradient
- react-native-svg for charts
- `useReducer` global state via `AppContext`

## Getting started

```bash
npm install
npx expo start
```

Then scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

## Project structure

```
src/
  AppContext.js      # Global state (useReducer)
  storage.js        # AsyncStorage helpers + streak math
  theme.js          # Colors, spacing, typography
  notifications.js  # Notification scheduling
  screens/          # Onboarding, Today, History, Stats, CreateHabit
  components/       # Shared UI components
```

## Built with Claude

This app was designed and built using [Claude Code](https://claude.ai/code) as an AI coding assistant.
