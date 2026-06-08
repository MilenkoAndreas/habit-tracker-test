# Bold Minimal Redesign — Design Spec
**Date:** 2026-06-06
**Status:** Approved

---

## Overview

A full visual redesign of the Antigravity habit tracker. The goal is a production-quality, motivating app that feels personal and distinctive — not like a generic vibe-coded template.

**Four core decisions:**
1. **Direction:** Bold Minimal — off-white backgrounds, oversized heavy typography, near-black ink, no gradients on the main UI
2. **Icons:** Custom SVG icon system — bespoke line-art at consistent 2px stroke weight throughout the app
3. **Accent color:** Growth Green (#16A34A) — the single color that does all emotional work against the black-and-white layout
4. **Home header:** Circular progress ring + streak badge — balances at-a-glance completion (ring) with consistency over time (streak)

---

## Color System

### Light Mode

| Token | Value | Usage |
|---|---|---|
| `background` | `#FAFAFA` | Screen backgrounds |
| `card` | `#FFFFFF` | Habit cards, modals, sheets |
| `ink` | `#111111` | Headings, SVG icons, buttons |
| `muted` | `#6B7280` | Subtext, date labels, tap hints |
| `border` | `#E5E7EB` | Card borders, dividers, tab bar |
| `accent` | `#16A34A` | Done state, progress ring/bar, primary CTA |
| `accentLight` | `#F0FDF4` | Done habit card background tint |
| `accentBorder` | `#BBF7D0` | Done habit card border |
| `accentText` | `#15803D` | Done habit name (strikethrough) |

### Dark Mode

| Token | Value |
|---|---|
| `background` | `#0D0D0D` |
| `card` | `#1A1A1A` |
| `ink` | `#F5F5F5` |
| `muted` | `#6B7280` |
| `border` | `#2A2A2A` |
| `accent` | `#16A34A` (unchanged) |
| `accentLight` | `#052E16` |
| `accentBorder` | `#14532D` |
| `accentText` | `#4ADE80` |

**Rule:** The accent green is the only non-neutral color in the entire UI. No per-habit color accents anywhere — done/pending state is expressed via the green system exclusively. The habit color picker is removed from CreateHabitScreen. All icon tiles are `ink` when pending, `accent` when done.

---

## Typography

All weights use the system font stack (San Francisco on iOS, Roboto on Android).

| Role | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|
| Screen greeting | 26–28px | 900 | −1px | "Good morning." — editorial hero |
| Section labels | 11px | 700 | +1.5px | ALL-CAPS, `muted` color |
| Habit names | 15px | 700 | 0 | |
| Sub-labels | 11px | 600 | 0 | Streak counts, "Tap to complete" |
| Stat numbers | 18px | 900 | −0.5px | Inside ring, stat cards |
| Button labels | 15–16px | 700 | 0 | |

---

## Custom SVG Icon System

All icons use **2px stroke width, `round` stroke-linecap, `round` stroke-linejoin**. This is the single rule that makes them feel coherent and intentional.

Icons live in `src/components/icons/` as individual React Native SVG components. Each accepts `color` (default: `#111111`) and `size` (default: `24`) props.

### Tab Bar Icons

| Tab | Icon name | Description |
|---|---|---|
| Today | `IconHome` | House shape with a rectangular door cutout, no chimney |
| Progress | `IconBarChart` | Three vertical bars at different heights (short, medium, tall), left to right |
| Manage | `IconGrid` | 2×2 grid of four rounded squares with equal gaps |

### Habit Category Icons (defaults in CreateHabit picker)

| Category | Icon name | Description |
|---|---|---|
| Running / exercise | `IconRun` | Stick figure mid-stride: head circle, arm back, leg forward |
| Reading | `IconBook` | Open book: two rectangular pages, two horizontal lines on right page |
| Water | `IconDrop` | Teardrop shape with a short diagonal highlight line near top |
| Meditation | `IconMeditate` | Seated figure silhouette with a partial arc above the head |
| Sleep | `IconMoon` | Crescent moon (clip circle from circle), two small Zs upper right |
| Nutrition | `IconApple` | Apple outline with stem and single leaf |
| Writing | `IconPen` | Fountain pen nib with ink line extending to lower-left |
| Strength | `IconDumbbell` | Horizontal bar with a square plate on each end |
| Coding / work | `IconCode` | `< >` chevrons with a forward slash between |
| Mindfulness | `IconHeart` | Classic heart outline |

### Checkmark / Check Box

- **Pending:** 22×22, `border` color, 2px border, `radius` 6, empty interior
- **Done:** same size, `accent` background, white SVG checkmark (polyline `2,6 5,9 10,3`, 2.5px stroke)

---

## Component Specifications

### HabitCard

**Pending state:**
- Background: `card` (#FFF)
- Border: 1.5px solid `border` (#E5E7EB)
- Border-radius: 14px
- Icon tile: 38×38, radius 10, background `ink` (#111), icon in white
- Name: 15px/700, `ink`
- Sub-label: 11px/600, `muted` — "Tap to complete" or volume progress
- Checkmark: pending style (see above)
- No left color strip

**Done state:**
- Background: `accentLight` (#F0FDF4)
- Border: 1.5px solid `accent` (#16A34A)
- Icon tile: background changes to `accent` (#16A34A), icon stays white
- Name: `accentText`, strikethrough, 0.65 opacity
- Sub-label: "Done · N-day streak 🔥" in `accent`
- Checkmark: done style (green fill, white check)

**Volume habit (in progress):**
- Progress bar below name: full width, 3px height, `border` track, `accent` fill
- Count label: "X/Y" in `accent`, 12px/700

**Press animation:** spring scale 0.94 → 1.0 (unchanged from current).

**Long press:** unchanged — Alert confirm before delete.

---

### Home Screen Header

Layout: horizontal row, separated from habit list by a 1.5px `border` divider.

**Left side — Circular progress ring:**
- SVG: 72×72px
- Track: circle, 5px stroke, `border` color
- Progress arc: same circle, 5px stroke, `accent` color, `round` linecap, rotated −90°
- Center label: "X/Y" in 18px/900, `ink`

**Right side — Greeting block:**
- Date: 11px/700, ALL-CAPS, `muted` (e.g. "JUNE 6 · FRIDAY")
- Greeting: 22px/900, `ink` (e.g. "Good morning.")
- Streak pill: black (`ink`) rounded pill, white text, 🔥 emoji + "N-day streak", 11px/700. Hidden when streak = 0.

**Top-right — Add button:**
- 40×40, radius 12, `ink` background
- White "+" SVG (two lines, 2.5px stroke, round caps)
- Aligned to top of row

**When all habits are done:**
- Ring arc is full green
- Greeting becomes "All done." 
- Streak pill updates to reflect new streak
- Celebration modal fires (unchanged logic)

---

### Tab Bar

**Style:** Floating pill lifted 10px above safe area bottom.
- Background: `card` (#FFF)
- Border: 1.5px solid `border`
- Border-radius: 20px
- Horizontal padding: 24px
- Three icon slots, evenly spaced
- Active: icon at full opacity in `ink`
- Inactive: same icon at 25% opacity
- No text labels
- No dot indicators
- Shadow: subtle — 0 4px 16px rgba(0,0,0,0.08)

---

### InsightsScreen

**Stat cards:** Replace current shadow-heavy style with:
- White background, 1.5px `border` border, 14px radius
- Stat number as hero: 36px/900 in `ink`
- Label below: 11px/700, ALL-CAPS, `muted`

**Bar chart:** Keep SVG, but replace colored bars with `ink`-colored bars. Current day bar is highlighted in `accent`. Remove the background grid lines; add a thin `border`-colored baseline instead.

**Per-habit streak bars:** Replace colored fills with `accent` fill on active portion, `border` on inactive.

**AI Coach card:** White card, 1.5px `ink` border (not shadow), 14px radius. "AI Coach" label in ALL-CAPS style at top.

**Reflection tabs (Weekly / Monthly):** Tab switcher becomes two pill buttons: active = `ink` background + white text; inactive = white + `border` border.

---

### CreateHabitScreen

**Icon picker:** Replace emoji picker with a 5-column grid of the habit category SVG icons (from the icon system above). Selected icon gets `accent` background tile; others get `border` background. Users can still type a custom emoji as fallback via a text input below the grid.

**Color picker:** Removed entirely. Icon tiles are always `ink` in pending state and `accent` when done — the design is pure black/white/green. The `habit.color` field is no longer written or read.

**Form fields:** Large, borderless bottom-line inputs with 26px/900 placeholder text in `muted`.

---

### OnboardingScreen

No structural changes. Visual updates only:
- Remove purple gradient header; replace with white background + oversized bold heading
- Progress dots: `ink` filled (active), `border` outline (inactive) — no green yet (user hasn't done anything)
- CTA buttons: `ink` background, white text, radius 14

---

## Files to Change

| File | Change |
|---|---|
| `src/theme.js` | Replace entire color + spacing system with new tokens above |
| `src/components/icons/` | **New directory** — all SVG icon components |
| `src/components/HabitCard.js` | Rewrite styles; use icon system |
| `src/screens/HomeScreen.js` | New header (ring + streak), updated card list, floating tab bar is set in App.js |
| `src/screens/InsightsScreen.js` | Updated stat cards, chart, AI cards, tab switcher |
| `src/screens/ManageScreen.js` | Label style updates, habit row icon tiles |
| `src/screens/CreateHabitScreen.js` | SVG icon picker replacing emoji picker |
| `src/screens/OnboardingScreen.js` | Visual-only updates |
| `App.js` | Tab bar style — floating pill, custom tab icons |

---

## Out of Scope

- No changes to data model, sync logic, Supabase schema, or edge functions
- No changes to notification logic
- No new screens
- No changes to auth flow beyond visual styling
