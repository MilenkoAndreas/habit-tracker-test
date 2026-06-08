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

# Deploy a Supabase edge function (requires SUPABASE_ACCESS_TOKEN in .env.local)
set -a && source .env.local && set +a
supabase functions deploy <function-name> --project-ref yjjfhoytzsbnjnfpkjly --use-api

# Set a Supabase secret
supabase secrets set KEY=value --project-ref yjjfhoytzsbnjnfpkjly

# Run a SQL migration
# Use the Supabase dashboard SQL editor, or the REST API with the service role key.
# See supabase-migration-ai.sql for the table structure that was added previously.
```

Always use `--use-api` when deploying edge functions. The local Deno bundler stalls on dependency downloads; `--use-api` bundles server-side and is fast.

Test on a physical device via **Expo Go** (SDK 54 build) by scanning the QR code. There is no test suite and no linter configured.

## Architecture

### Provider tree (`App.js`)

```
<AuthProvider>            — Supabase auth session (src/AuthContext.js)
  <AppProvider userId>   — habit state + Supabase sync (src/AppContext.js)
    <RootNavigator>      — auth-gated navigation
```

`AuthConsumer` is a thin component that sits between the two providers so `AppProvider` can receive `session?.user?.id` from `AuthContext` as a prop. Never flatten these into one provider — the auth session must resolve before `AppProvider` starts its Supabase pull.

### Navigation (`App.js`)

Four-level gate inside `RootNavigator` (checked in order):
1. **`needsPasswordReset`** → single-screen stack with `ResetPasswordScreen` (takes priority over everything)
2. **No session** → single-screen stack with `AuthScreen` only
3. **Session + not onboarded** → root stack with `Onboarding` first, then `Main`
4. **Session + onboarded** → root stack with `Main` (bottom tabs), `CreateHabit` (modal), `HowItWorks` (modal)

Bottom tabs: Today (`HomeScreen`), Progress (`InsightsScreen`), Manage (`ManageScreen`). The tab bar is a **floating pill** (`position: 'absolute'`, `bottom: 16`, `left/right: 24`, `borderRadius: 20`, `height: 60`). All screen ScrollViews need `contentContainerStyle: { paddingBottom: 100 }` to clear it.

Navigating from a tab screen to a root stack screen requires `navigation.getParent()?.navigate(...)` — direct `navigation.navigate()` only reaches within the tab navigator.

### Auth (`src/AuthContext.js`)

Wraps `@supabase/supabase-js` auth. Exports `useAuth()` → `{ session, authLoading, signIn, signUp, signOut, sendResetCode, verifyResetCode, updatePassword, needsPasswordReset }`.

**Forgot password flow** (no deep links — works fully in Expo Go):
1. `sendResetCode(email)` — calls `signInWithOtp({ email, shouldCreateUser: false })`, sends a 6-digit OTP via the Magic Link email template
2. `verifyResetCode(email, code)` — calls `verifyOtp({ email, token, type: 'email' })`, on success sets `needsPasswordReset = true`
3. `needsPasswordReset = true` causes `RootNavigator` to show `ResetPasswordScreen`
4. `updatePassword(newPassword)` — calls `supabase.auth.updateUser({ password })`, on success clears `needsPasswordReset`

**Supabase dashboard requirements for forgot password:**
- Authentication → Settings → **Email OTP length: 6** (not 8)
- Authentication → Email Templates → Magic Link → body must include `{{ .Token }}`
- No redirect URLs or deep linking required

Auth tokens are stored in `expo-secure-store` (not AsyncStorage) via a custom adapter in `src/supabase.js`.

On startup, `AuthContext` calls `supabase.auth.getUser()` (server-validates the JWT) before falling through to `getSession()` to hydrate local state. Do not replace this with `getSession()`-only — it would skip server-side token validation.

### Global State (`src/AppContext.js`)

Single `useReducer` store. State shape: `{ habits, logs, challenge, darkMode, notificationPrefs, loading }`.

`AppProvider` accepts a `userId` prop. When `userId` changes (sign-in), it pulls all data from Supabase via `pullAll()` and dispatches `HYDRATE`. AsyncStorage is loaded first on mount for instant local data, then overwritten by the Supabase pull. After HYDRATE, `saveLogs(remote.logs)` is called to keep AsyncStorage in sync — without this, stats flicker on every launch.

`syncReady` (internal boolean) becomes `true` only after the Supabase pull resolves. The five sync `useEffect` hooks only fire when `syncReady && userId` are both truthy, which prevents re-pushing data that just arrived from Supabase.

Sync is **diff-based**: each effect compares current state to a `prevRef` and only calls Supabase for changed/added/removed items. Habits use soft delete (`deleted_at`); completions are hard-deleted by row ID.

Key reducer actions: `ADD_HABIT`, `UPDATE_HABIT`, `DELETE_HABIT` (also wipes that habit's logs), `LOG_HABIT`, `UNLOG_HABIT`, `SET_CHALLENGE`, `COMPLETE_CHALLENGE`, `TOGGLE_DARK_MODE`, `CLEAR_TODAY_LOGS`, `COMPLETE_ALL_TODAY`, `COMPLETE_PAST_DAYS`, `WIPE_ALL`, `SET_NOTIFICATION_PREFS`.

Two hooks exported: `useApp()` → `{ state, dispatch }`. `useColors()` → `LIGHT_COLORS` or `DARK_COLORS` from `src/theme.js`.

Notification side effects are never triggered inside the reducer — called fire-and-forget from the component after dispatching.

### Local-first sync strategy (`src/sync.js`)

- **Reads** always hit AsyncStorage (instant).
- **Writes** go to AsyncStorage immediately (inside the reducer), then sync to Supabase in the background via `useEffect` hooks in `AppProvider`.
- **On sign-in**, `pullAll(userId)` fetches habits, completions, and profile (challenge + settings) in parallel. Supabase wins on conflict. Completions are fetched for the last 400 days (covers the full 365-day streak window).

Push functions: `pushHabit`, `softDeleteHabit`, `pushLog`, `deleteLog`, `pushChallenge`, `pushSettings`.
Pull function: `pullAll(userId)` → `{ habits, logs, challenge, darkMode, notificationPrefs, onboarded }`.

Column naming: app uses camelCase (`targetCount`, `habitId`), DB uses snake_case (`target_count`, `habit_id`). Conversion happens inside `sync.js` — never leak DB column names into app code.

### Supabase (`src/supabase.js`)

The client reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from the environment via `process.env`. These must be present in `.env.local` before starting the dev server.

DB tables: `profiles`, `habits` (soft-deleted via `deleted_at`), `completions` (maps to `logs` in app state), `ai_insights` (caches Claude-generated coaching and reflections). Base schema is in `supabase-schema.sql`; the AI table was added via `supabase-migration-ai.sql`.

The `challenge` for a user is stored as a JSONB column on `profiles` (not a separate table) — the app supports only one active challenge per user.

Supabase project ref: `yjjfhoytzsbnjnfpkjly`. `.env.local` (gitignored) holds all credentials: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN` (CLI deploys), and `ANTHROPIC_API_KEY` (CLI/local use only — the deployed key lives as a Supabase secret).

### AI Features (`src/ai.js` + `supabase/functions/`)

The app calls Claude `claude-sonnet-4-6` via two Supabase Edge Functions. The mobile app never talks to the Anthropic API directly.

**Flow:** `InsightsScreen` → `src/ai.js` → `supabase.functions.invoke()` → Edge Function → reads DB → calls Claude via `fetch` → caches result in `ai_insights` → returns to app.

- `fetchCoachingInsight()` — calls `generate-coaching`: per-habit stats (30-day streak + consistency %), Claude returns a 2–3 sentence nudge. Cached once per calendar day per user.
- `fetchReflection(type)` — calls `generate-reflection` with `{ type: 'weekly' | 'monthly' }`: period stats, Claude returns a 3–4 sentence summary. Cached per `period_start` date.

Both edge functions use native Deno `fetch` to call the Anthropic API — **no Anthropic SDK import**. This keeps the bundle tiny and avoids the `esm.sh` download stall that occurs with large SDK imports.

**Rate limit:** 5 AI generations per user per day across all types. Requests beyond the cap return HTTP 429. The cache layer means normal usage never approaches this limit.

### Habit Data Shape

```js
{
  id: string,           // Date.now().toString()
  name: string,
  emoji: string,        // icon key ('run', 'book', 'drop', etc.) for new habits;
                        // legacy habits may have actual emoji characters ('🏃') —
                        // check ICON_MAP[habit.emoji] before rendering to distinguish
  type: 'once' | 'volume',
  targetCount: number,  // 1 for 'once', ≥2 for 'volume'
  color: string,        // always '#111111' — kept for Supabase sync compat, never displayed
  reminder: { enabled: boolean, hour: number, minute: number }, // minute in multiples of 5
  createdAt: string,    // ISO timestamp
}
```

### Log (completion) Data Shape

```js
{ id: string, habitId: string, date: string, completedAt: string }
// date is YYYY-MM-DD UTC via dateKey() from src/storage.js
```

### Persistence (`src/storage.js`)

AsyncStorage keys: `habits`, `logs`, `challenge`, `onboarded`, `darkMode`, `notificationPrefs`. Each reducer case calls the corresponding `save*()` fire-and-forget (no await in reducer).

`dateKey(date?)` returns `YYYY-MM-DD` via `.toISOString().split('T')[0]` (UTC). When computing date ranges always build dates with `Date.UTC(y, m, d)` to avoid timezone day shifts.

Streak helpers exported from `storage.js`:
- `calcOverallStreak(logs, habits)` — counts consecutive fully-completed days ending today, with a grace period: today being incomplete does not break the streak (only yesterday and earlier break it).
- `calcBestStreak(logs, habits)` — all-time best consecutive fully-completed days. Both look back up to 365 days.
- `countForDate(logs, habitId, dateKey)` — completion count for a single habit on a single day.

The `onboarded` flag lives in both AsyncStorage and the Supabase `profiles.onboarded` column (updated via `pushSettings` in `OnboardingScreen`).

### Theming

All screens use `const colors = useColors()` and pass it into a memoized style factory:
```js
const s = useMemo(() => getStyles(colors), [colors]);
```
Styles are recreated on theme change — intentional. Always use `colors.*` tokens — **except** icon tile backgrounds, which must be hardcoded `'#111111'` (see below).

**Color palette** — Bold Minimal design: Growth Green (`#16A34A`) is the single accent color. Key tokens:
- `colors.primary` — accent green; done states, progress, CTAs
- `colors.text` — `#111111` in light mode, `#FFFFFF` in dark mode; use for text and strokes only
- `colors.background` — off-white `#FAFAFA` / pure black `#000000`
- `colors.card` — `#FFFFFF` / `#1C1C1E`
- `colors.primaryLight` / `colors.accentBorder` / `colors.accentText` — done-card tint, border, and text
- `colors.textSecondary`, `colors.border` — muted labels and dividers

**Icon tile backgrounds must be hardcoded `'#111111'`**, never `colors.text`. In dark mode `colors.text` is white, which makes white SVG icons invisible. The "ink tile" is always near-black regardless of theme — a white icon on a `#111111` tile is legible in both modes.

`SPACING` and `RADIUS` are the spacing/radius scale. `SHADOW` / `DARK_SHADOW` are pre-built shadow style objects.

### SVG Icon System (`src/components/icons/index.js`)

All UI icons are custom SVG components built with `react-native-svg`. Every icon accepts `color` (default `'#111111'`) and `size` (default `24`) props. All use `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

- Tab bar: `IconHome`, `IconBarChart`, `IconGrid`
- Habit categories: `IconRun`, `IconBook`, `IconDrop`, `IconMeditate`, `IconMoon`, `IconApple`, `IconPen`, `IconDumbbell`, `IconCode`, `IconHeart`
- Utility: `IconCheck` (default color `'#ffffff'` — always rendered inside a colored tile), `IconPlus`
- `ICON_MAP` — `{ run: IconRun, book: IconBook, ... }` — maps `habit.emoji` string keys to components
- `ICON_PICKER_ITEMS` — ordered array of `{ key, label, Component }` used for the icon picker grid

**Rendering pattern for habit icons:**
```js
const IconComponent = ICON_MAP[habit.emoji];
{IconComponent ? <IconComponent color="#fff" size={20} /> : <Text>{habit.emoji}</Text>}
```

### Screens

| Screen | Purpose |
|---|---|
| `AuthScreen` | Sign in / sign up / forgot password. Forgot password is a two-step inline flow: step 1 collects email and calls `sendResetCode`; step 2 shows a code input and calls `verifyResetCode`. Uses `friendlyError()` to translate Supabase errors. |
| `ResetPasswordScreen` | Shown by `RootNavigator` when `needsPasswordReset` is true. New password + confirm fields; calls `updatePassword`. |
| `OnboardingScreen` | 3-step flow: explainer → create first habit (SVG icon grid + name + type) → 3-day challenge. Calls `navigation.reset()` on finish and `pushSettings({ onboarded: true })` to sync to Supabase. |
| `HomeScreen` | Today tab. SVG progress ring (72×72, 5px stroke) + greeting + overall streak pill. Confetti + celebration modal fires only on the transition from not-done → all-done (guarded by `hydrated` ref). |
| `InsightsScreen` | Progress tab. Hero stat cards, toggle between 7-day SVG bar chart and 30-day calendar heatmap (5×7 Monday-aligned grid, color-coded by completion %), per-habit streak bars, AI Coach card, AI Reflections (weekly/monthly switcher), history log. |
| `ManageScreen` | Appearance toggle, habit CRUD list, sign-out, "How it works" link, collapsible Dev Tools section. |
| `CreateHabitScreen` | Create and edit habits. Reads `route.params?.editHabit` to determine mode. Legacy habits with emoji values fall back to icon key `'run'` on edit. Calls `scheduleHabitReminder(habit)` on save. |
| `HowItWorksScreen` | Static explainer modal. |

> `src/screens/HistoryScreen.js` and `src/screens/StatsScreen.js` are unused legacy files — do not import or extend them.

### Components

- `HabitCard` — animated spring press (scale 0.94→1), ink icon tile (pending) / green tile (done), volume progress bar, done state (green tint + strikethrough name). Uses `ICON_MAP` with emoji fallback.
- `ConfettiOverlay` — 18-piece animation via core `Animated` API (no Reanimated dependency).

### Notifications (`src/notifications.js`)

Always called fire-and-forget (`.catch(() => {})`). Never `await` on the navigation path.

Reminders are per-habit, identified by `habit-{habit.id}`. `scheduleHabitReminder(habit)` cancels then re-schedules — safe to call on both create and edit.
