# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## SDK Version

**Expo SDK 54**, React Native 0.81.5, React 19.1.0. Use https://docs.expo.dev/versions/v54.0.0/ for documentation.

## Commands

```bash
# Start dev server (local network)
npm start

# Start with tunnel for physical device on a different network
npx expo start --tunnel
```

Test on a physical device via **Expo Go** (SDK 54 build) by scanning the QR code. There is no test suite and no linter configured.

## Architecture

### Navigation (`App.js`)

Two-level React Navigation v7 hierarchy:
- **Root stack** (`createNativeStackNavigator`): `Onboarding` (conditional, only when not yet onboarded) → `Main` → `CreateHabit` (modal) → `HowItWorks` (modal)
- **Bottom tabs** (`createBottomTabNavigator`) mounted as `Main`: Today (`HomeScreen`), Progress (`InsightsScreen`), Manage (`ManageScreen`)

`SafeAreaProvider` wraps `NavigationContainer`. Tab bar height is intentionally left unset so `SafeAreaProvider` handles the home-indicator inset automatically.

Navigating from a tab screen to a root stack screen requires `navigation.getParent()?.navigate(...)` — direct `navigation.navigate()` only reaches within the tab navigator.

### Global State (`src/AppContext.js`)

Single `useReducer` store hydrated from AsyncStorage on mount via a `HYDRATE` action. State shape: `{ habits, logs, challenge, darkMode, notificationPrefs, loading }`.

Key reducer actions: `ADD_HABIT`, `UPDATE_HABIT`, `DELETE_HABIT` (also wipes that habit's logs), `LOG_HABIT`, `UNLOG_HABIT`, `SET_CHALLENGE`, `COMPLETE_CHALLENGE`, `TOGGLE_DARK_MODE`, `CLEAR_TODAY_LOGS`, `COMPLETE_ALL_TODAY`, `COMPLETE_PAST_DAYS`, `WIPE_ALL`, `SET_NOTIFICATION_PREFS`.

Two hooks exported: `useApp()` returns `{ state, dispatch }`. `useColors()` returns `LIGHT_COLORS` or `DARK_COLORS` from `src/theme.js` based on `state.darkMode`.

Notification side effects (scheduling, cancelling) are never triggered inside the reducer — they are called fire-and-forget from the component after dispatching.

### Habit Data Shape

```js
{
  id: string,           // Date.now().toString()
  name: string,
  emoji: string,
  type: 'once' | 'volume',
  targetCount: number,  // 1 for 'once', ≥2 for 'volume'
  color: string,        // from HABIT_COLORS palette
  reminder: {
    enabled: boolean,
    hour: number,       // 0–23
    minute: number,     // 0–55, multiples of 5
  },
  createdAt: string,    // ISO timestamp
}
```

### Persistence (`src/storage.js`)

AsyncStorage keys: `habits`, `logs`, `challenge`, `onboarded`, `darkMode`, `notificationPrefs`. Each reducer case that mutates data calls the corresponding `save*()` function synchronously (fire-and-forget — no awaiting in the reducer).

`dateKey(date?)` returns `YYYY-MM-DD` via `.toISOString().split('T')[0]` (UTC). All log entries store their date as a UTC `dateKey`. When computing date ranges (e.g. challenge day dots), always build dates with `Date.UTC(y, m, d)` to avoid local-timezone day shifts.

### Theming

All screens use `const colors = useColors()` and pass it into `getStyles(colors)` which calls `StyleSheet.create(...)`. This means styles are recreated on theme change — the pattern is intentional. Never hardcode colors; use `colors.*` tokens from `src/theme.js`.

`HABIT_COLORS` is the palette for habit accent colors. `SPACING` and `RADIUS` are the spacing/radius scale.

### Screens

| Screen | Purpose |
|---|---|
| `OnboardingScreen` | 3-step flow: explainer → create first habit → 3-day challenge. Calls `navigation.reset()` on finish. Calls `requestPermissions()` to prime notification permission. |
| `HomeScreen` | Today tab. Confetti + celebration modal fires only on transition from not-done → all-done (guarded by `hydrated` ref to prevent false-fire on app launch). |
| `InsightsScreen` | Merged stats + history. Stat cards, 7-day SVG bar chart (via `react-native-svg`), per-habit streak bars, full history log. |
| `ManageScreen` | Appearance toggle, habit CRUD list, "How it works" link, collapsible Test Tools section. Habit cards show a 🔔 badge with the reminder time when a reminder is active. Calls `cancelHabitReminder` when a habit is deleted. |
| `CreateHabitScreen` | Create and edit habits. Reads `route.params?.editHabit` to determine mode. Includes a Reminder section (toggle + hour/minute steppers). Calls `scheduleHabitReminder(habit)` on save. |
| `HowItWorksScreen` | Static explainer, opened as a modal from ManageScreen. |

### Components

- `HabitCard` — animated spring press, volume progress bar, done state. Uses `useColors()`.
- `ConfettiOverlay` — 18-piece animation via core `Animated` API (no Reanimated dependency).

### Notifications (`src/notifications.js`)

Always called fire-and-forget (`.catch(() => {})`). Never `await` notification calls on the navigation path — it caused blocking bugs when permissions were denied.

Reminders are **per-habit**. Each habit's notification uses `habit-{habit.id}` as its identifier, so individual notifications can be cancelled without affecting others.

- `scheduleHabitReminder(habit)` — cancels any existing notification for that habit then schedules a new one if `habit.reminder.enabled`. Safe to call on both create and edit.
- `cancelHabitReminder(habitId)` — cancels the notification for a single habit by ID.
- `requestPermissions()` — call before enabling a reminder; shows the OS permission prompt.
