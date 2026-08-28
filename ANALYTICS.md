# ANALYTICS.md

# Analytics — HabitFlow

This document explains the calculations and algorithms behind HabitFlow's analytics features.

---

## 1. Habit Score

The **Habit Score** measures consistency for a single habit over a rolling window (default: last 30 days).

```
HabitScore = (completedDays / expectedDays) * 100
```

- `expectedDays` for a `DAILY` habit = number of days in the window since creation (capped at window size).
- `expectedDays` for a `WEEKLY` habit = `targetPerWeek * number of full weeks in window`.
- Score is capped at 100 and rounded to the nearest integer.

**Example:** A daily habit completed 24 out of the last 30 days → `HabitScore = (24/30) * 100 = 80`.

---

## 2. Productivity Score

The **Productivity Score** aggregates performance across *all* active habits into a single 0–100 metric shown on the dashboard.

```
ProductivityScore = weighted average of:
  - 50% recent consistency (last 7 days completion rate across all habits)
  - 30% streak health (average of currentStreak / longestStreak per habit, capped at 1.0)
  - 20% overall habit score average (30-day HabitScore across all habits)
```

```
ProductivityScore = 0.5 * recentConsistency
                   + 0.3 * avgStreakHealth
                   + 0.2 * avgHabitScore
```

All sub-components are normalized to a 0–1 scale before weighting, then multiplied by 100 for the final score.

**Trend indicator:** compares the current week's score to the prior week's score; `up`, `down`, or `flat` if the delta is within ±2 points.

---

## 3. Weekly Analytics

Computed for a given `weekStart` (Monday) → `weekStart + 6 days`.

- Total completions across all habits.
- Total possible completions (sum of expected completions per habit for the week).
- Per-habit breakdown: completions vs. possible.
- Completion rate = `totalCompletions / totalPossible`.

---

## 4. Monthly Analytics

Same structure as weekly analytics, aggregated over a calendar month. Additionally includes:
- Best and worst performing habit of the month (by HabitScore).
- Longest streak achieved during the month across all habits.
- Number of badges earned during the month.

---

## 5. Heatmaps

The heatmap calendar visualizes daily activity intensity, similar to a GitHub contribution graph.

- Each day's **completion rate** = `completions on that day / total active habits for that day`.
- Rendered as a color intensity scale:

| Completion Rate | Color Intensity |
|---|---|
| 0% | Empty/gray |
| 1–33% | Light |
| 34–66% | Medium |
| 67–99% | Strong |
| 100% | Full/darkest |

Data is fetched pre-aggregated from the `GET /analytics/heatmap` endpoint (see [`API.md`](./API.md)) rather than computed client-side, to keep the frontend lightweight.

---

## 6. Charts

| Chart | Data Source | Library |
|---|---|---|
| Weekly completion trend (line chart) | `GET /reports/weekly` (historical weeks) | Recharts |
| Habit breakdown (bar chart) | `GET /reports/weekly` `habitsBreakdown` | Recharts |
| Productivity score gauge | `GET /analytics/productivity-score` | Custom SVG / Recharts RadialBarChart |
| Category distribution (pie chart) | Derived client-side from habit list | Recharts |

---

## 7. KPIs

| KPI | Formula |
|---|---|
| Completion Rate | `completedDays / expectedDays` |
| Consistency Index | `1 - (standardDeviation of daily completion / mean)` — lower variance = higher consistency |
| Streak Health | `currentStreak / longestStreak` (capped at 1.0) |
| Engagement Rate | `daysWithAtLeastOneCompletion / totalDaysInPeriod` |

---

## 8. Calculations — Streak Logic

```
On habit completion for date D:
  if lastCompletedDate == D - 1 day:
      currentStreak += 1
  else if lastCompletedDate == D:
      # already completed, no-op (idempotent)
  else:
      currentStreak = 1   # streak reset

  longestStreak = max(longestStreak, currentStreak)
  lastCompletedDate = D
```

**Weekly habit streak logic** differs slightly — streak increments per week if `targetPerWeek` is met, rather than per day:

```
At end of each week:
  if completionsThisWeek >= targetPerWeek:
      currentStreak += 1
  else:
      currentStreak = 0
  longestStreak = max(longestStreak, currentStreak)
```

---

## 9. Algorithms — Insight Data Preparation

Before the rule engine (see [`AI_INSIGHTS.md`](./AI_INSIGHTS.md)) evaluates rules, the analytics layer prepares a feature set per user:

1. Per-habit completion history (last 30/90 days).
2. Time-of-day distribution of completions (morning/afternoon/evening buckets, derived from `created_at` timestamp of completion records).
3. Day-of-week completion distribution.
4. Streak volatility (number of streak resets in the last 90 days).
5. Category-level aggregate performance.

This feature set is what the rule engine consumes to generate human-readable insights.

Related: [`AI_INSIGHTS.md`](./AI_INSIGHTS.md), [`DATABASE.md`](./DATABASE.md), [`API.md`](./API.md)
