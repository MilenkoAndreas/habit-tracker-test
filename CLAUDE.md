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
cd habit-tracker-test
set -a && source .env.local && set +a
supabase functions deploy <function-name> --project-ref yjjfhoytzsbnjnfpkjly --use-api

# Set a Supabase secret
supabase secrets set KEY=value --project-ref yjjfhoytzsbnjnfpkjly

# Run a one-off SQL migration
python3 -c "import json,os; sql=open('file.sql').read(); import urllib.request; ..." 
# or via curl — see supabase-migration-ai.sql for the pattern used previously
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

`signUp` returns `{ error, needsConfirmation }`. `needsConfirmation` is `true` when the account was created but Supabase requires email confirmation before a session is issued. Email confirmation is currently **disabled** in the Supabase dashboard, so `needsConfirmation` will always be `false` in normal use.

**Forgot password flow** (no deep links — works fully in Expo Go):
1. `sendResetCode(email)` — calls `signInWithOtp({ email, shouldCreateUser: false })`, sends a 6-digit OTP via the Magic Link email template
2. `verifyResetCode(email, code)` — calls `verifyOtp({ email, token, type: 'email' })`, on success sets `needsPasswordReset = true`
3. `needsPasswordReset = true` causes `RootNavigator` to show `ResetPasswordScreen`
4. `updatePassword(newPassword)` — calls `supabase.auth.updateUser({ password })`, on success clears `needsPasswordReset`

**Supabase dashboard requirements for forgot password:**
- Authentication → Settings → **Email OTP length: 6** (not 8)
- Authentication → Email Templates → Magic Link → body must include `{{ .Token }}` so the code is visible in the email
- No redirect URLs or deep linking required

Auth tokens are stored in `expo-secure-store` (not AsyncStorage) via a custom adapter in `src/supabase.js`.

On startup, `AuthContext` calls `supabase.auth.getUser()` (server-validates the JWT) before falling through to `getSession()` to hydrate local state. Do not replace this with `getSession()`-only — it would skip server-side token validation.

### Global State (`src/AppContext.js`)

Single `useReducer` store. State shape: `{ habits, logs, challenge, darkMode, notificationPrefs, loading }`.

`AppProvider` accepts a `userId` prop. When `userId` changes (sign-in), it pulls all data from Supabase via `pullAll()` and dispatches `HYDRATE`. AsyncStorage is loaded first on mount for instant local data, then overwritten by the Supabase pull.

`syncReady` (internal boolean) becomes `true` only after the Supabase pull resolves. The five sync `useEffect` hooks only fire when `syncReady && userId` are both truthy, which prevents re-pushing data that just arrived from Supabase.

Sync is **diff-based**: each effect compares current state to a `prevRef` and only calls Supabase for changed/added/removed items. Habits use soft delete (`deleted_at`); completions are hard-deleted by row ID.

Key reducer actions: `ADD_HABIT`, `UPDATE_HABIT`, `DELETE_HABIT` (also wipes that habit's logs), `LOG_HABIT`, `UNLOG_HABIT`, `SET_CHALLENGE`, `COMPLETE_CHALLENGE`, `TOGGLE_DARK_MODE`, `CLEAR_TODAY_LOGS`, `COMPLETE_ALL_TODAY`, `COMPLETE_PAST_DAYS`, `WIPE_ALL`, `SET_NOTIFICATION_PREFS`.

Two hooks exported: `useApp()` → `{ state, dispatch }`. `useColors()` → `LIGHT_COLORS` or `DARK_COLORS` from `src/theme.js`.

Notification side effects are never triggered inside the reducer — called fire-and-forget from the component after dispatching.

### Local-first sync strategy (`src/sync.js`)

- **Reads** always hit AsyncStorage (instant).
- **Writes** go to AsyncStorage immediately (inside the reducer), then sync to Supabase in the background via `useEffect` hooks in `AppProvider`.
- **On sign-in**, `pullAll(userId)` fetches habits, completions, and profile (challenge + settings) in parallel. Supabase wins on conflict.

Push functions: `pushHabit`, `softDeleteHabit`, `pushLog`, `deleteLog`, `pushChallenge`, `pushSettings`.
Pull function: `pullAll(userId)` → `{ habits, logs, challenge, darkMode, notificationPrefs, onboarded }`.

Column naming: app uses camelCase (`targetCount`, `habitId`), DB uses snake_case (`target_count`, `habit_id`). Conversion happens inside `sync.js` — never leak DB column names into app code.

### Supabase (`src/supabase.js`)

The client reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from the environment via `process.env`. These must be present in `.env.local` before starting the dev server — the app will throw at startup if they are missing. Expo SDK 49+ picks up `EXPO_PUBLIC_*` variables from `.env.local` automatically.

The `challenge` for a user is stored as a JSONB column on the `profiles` table (not a separate table) because the app supports only one active challenge per user.

DB tables: `profiles`, `habits` (soft-deleted via `deleted_at`), `completions` (maps to `logs` in app state), `ai_insights` (caches Claude-generated coaching and reflections). Base schema is in `supabase-schema.sql`; the AI table was added via `supabase-migration-ai.sql`.

Supabase project ref: `yjjfhoytzsbnjnfpkjly`. `.env.local` (gitignored) holds all credentials: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN` (CLI deploys), and `ANTHROPIC_API_KEY` (CLI/local use only — the deployed key lives as a Supabase secret).

### AI Features (`src/ai.js` + `supabase/functions/`)

The app calls Claude `claude-sonnet-4-6` via two Supabase Edge Functions. The mobile app never talks to the Anthropic API directly.

**Flow:** `InsightsScreen` → `src/ai.js` → `supabase.functions.invoke()` → Edge Function → reads DB → calls Claude via `fetch` → caches result in `ai_insights` → returns to app.

**`src/ai.js`** — two exported functions:
- `fetchCoachingInsight()` — calls `generate-coaching`
- `fetchReflection(type)` — calls `generate-reflection` with `{ type: 'weekly' | 'monthly' }`

**Edge functions** (in `supabase/functions/`):
- `generate-coaching` — builds per-habit stats (30-day streak + consistency %), calls Claude for a 2–3 sentence nudge. Cached once per calendar day per user.
- `generate-reflection` — builds period stats (weekly or monthly), calls Claude for a 3–4 sentence summary. Cached per `period_start` date.

Both functions use native Deno `fetch` to call the Anthropic API — **no Anthropic SDK import**. This keeps the bundle tiny and avoids the `esm.sh` download stall that occurs with large SDK imports. The `ANTHROPIC_API_KEY` is stored as a Supabase secret (never in app code).

The `ai_insights` table stores cached results with RLS so users can only read their own rows. Edge functions authenticate via the JWT passed in the `Authorization` header.

**Rate limit:** both edge functions enforce a cap of 5 AI generations per user per day (counted across all types against `ai_insights.generated_at`). Requests beyond the cap return HTTP 429. The cache layer means normal usage never approaches this limit.

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
  reminder: {
    enabled: boolean,
    hour: number,       // 0–23
    minute: number,     // 0–55, multiples of 5
  },
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

The `onboarded` flag lives in both AsyncStorage (read on boot) and the Supabase `profiles.onboarded` column (updated via `pushSettings` in `OnboardingScreen` after finishing onboarding).

### Theming

All screens use `const colors = useColors()` and pass it into `getStyles(colors)` → `StyleSheet.create(...)`. Styles are recreated on theme change — intentional. Never hardcode colors; always use `colors.*` tokens from `src/theme.js`.

**Color palette** — Bold Minimal design: Growth Green (`#16A34A`) is the single accent color. Key tokens:
- `colors.primary` — accent green; done states, progress, CTAs
- `colors.text` — near-black `#111111`; headings, icon tiles, buttons
- `colors.background` — off-white `#FAFAFA`
- `colors.card` — pure white `#FFFFFF`
- `colors.primaryLight` / `colors.accentBorder` / `colors.accentText` — done-card tint, border, and text
- `colors.textSecondary`, `colors.border` — muted labels and dividers

`HABIT_COLORS` is exported for data-model compatibility only (`['#111111']`); it is not used for display. `SPACING` and `RADIUS` are the spacing/radius scale. `SHADOW` / `DARK_SHADOW` are pre-built shadow style objects.

### SVG Icon System (`src/components/icons/index.js`)

All UI icons are custom SVG components built with `react-native-svg`. Every icon accepts `color` (default `'#111111'`) and `size` (default `24`) props. All use `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

**Key exports:**
- Tab bar: `IconHome`, `IconBarChart`, `IconGrid`
- Habit categories: `IconRun`, `IconBook`, `IconDrop`, `IconMeditate`, `IconMoon`, `IconApple`, `IconPen`, `IconDumbbell`, `IconCode`, `IconHeart`
- Utility: `IconCheck` (default color `'#ffffff'` — always rendered inside a colored tile)
- `ICON_MAP` — `{ run: IconRun, book: IconBook, ... }` — maps `habit.emoji` string keys to components
- `ICON_PICKER_ITEMS` — ordered array of `{ key, label, Component }` used for the icon picker grid in `CreateHabitScreen` and `OnboardingScreen`

**Rendering pattern for habit icons:**
```js
const IconComponent = ICON_MAP[habit.emoji];
// renders SVG if key matches, else falls back to emoji text for legacy habits
{IconComponent ? <IconComponent color="#fff" size={20} /> : <Text>{habit.emoji}</Text>}
```

### Screens

| Screen | Purpose |
|---|---|
| `AuthScreen` | Sign in / sign up / forgot password. Forgot password is a two-step inline flow: step 1 collects email and calls `sendResetCode`; step 2 shows a code input and calls `verifyResetCode`. Uses `friendlyError()` to translate Supabase errors. |
| `ResetPasswordScreen` | Shown by `RootNavigator` when `needsPasswordReset` is true (after OTP verified). New password + confirm fields; calls `updatePassword`. Clears itself on success by setting `needsPasswordReset = false`. |
| `OnboardingScreen` | 3-step flow: explainer → create first habit (SVG icon grid picker + name + type) → 3-day challenge. Calls `navigation.reset()` on finish. Also calls `pushSettings({ onboarded: true })` to sync the flag to Supabase. |
| `HomeScreen` | Today tab. Header: SVG progress ring (72×72, 5px stroke) + greeting block + overall streak pill. Confetti + celebration modal fires only on transition from not-done → all-done (guarded by `hydrated` ref). Overall streak and challenge streak computed via `useMemo`. |
| `InsightsScreen` | Progress tab. Hero stat cards (36px/900 numbers), 7-day SVG bar chart (ink bars, green for today), per-habit streak bars with icon tiles, AI Coach card (ink border), AI Reflections (weekly/monthly pill switcher), history log. |
| `ManageScreen` | Appearance toggle, habit CRUD list (icon tiles + Edit/Delete pill buttons), sign-out pill button, "How it works" link, collapsible Dev Tools section. |
| `CreateHabitScreen` | Create and edit habits. SVG icon grid picker (10 icons from `ICON_PICKER_ITEMS`); no color picker. Reads `route.params?.editHabit` to determine mode. Legacy habits with emoji values fall back to icon key `'run'` on edit. Calls `scheduleHabitReminder(habit)` on save. |
| `HowItWorksScreen` | Static explainer modal from ManageScreen. |

> `src/screens/HistoryScreen.js` and `src/screens/StatsScreen.js` are unused legacy files — do not import or extend them.

### Components

- `HabitCard` — animated spring press (scale 0.94→1), ink icon tile (pending) / green tile (done), volume progress bar, done state (green tint background, strikethrough name). Uses `ICON_MAP` for icon lookup with emoji fallback.
- `ConfettiOverlay` — 18-piece animation via core `Animated` API (no Reanimated dependency).

### Notifications (`src/notifications.js`)

Always called fire-and-forget (`.catch(() => {})`). Never `await` on the navigation path.

Reminders are per-habit, identified by `habit-{habit.id}`. `scheduleHabitReminder(habit)` cancels then re-schedules — safe to call on both create and edit. `cancelHabitReminder(habitId)` cancels a single habit's notification.
