# FRONTEND.md

# Frontend Architecture — HabitFlow

## 1. Architecture

The frontend is a React + TypeScript SPA built with Vite, following a **feature-based folder structure** rather than a strict type-based one, to keep related components, hooks, and API calls co-located.

- **Presentation layer:** React components (functional, hooks-based)
- **State layer:** React Query for server state; React Context/hooks for local UI state
- **API layer:** Centralized Axios client with typed request/response models matching backend DTOs
- **Routing layer:** React Router with route guards for authenticated pages

---

## 2. State Management

| State Type | Tool | Example |
|---|---|---|
| Server state (habits, analytics) | React Query | `useQuery(['habits'], fetchHabits)` |
| Auth state | React Context + memory | Current user, access token |
| Form state | React Hook Form | Habit creation/edit forms |
| UI state (modals, theme) | Local `useState` / Context | Dark mode toggle, modal visibility |

React Query is chosen over global state libraries (Redux) because most application state *is* server state — caching, background refetch, and invalidation are handled declaratively rather than manually.

---

## 3. Routing

```
/                     → redirects to /dashboard or /login
/login                → LoginPage
/register             → RegisterPage
/dashboard             → Dashboard (protected)
/habits                → HabitListPage (protected)
/habits/:id             → HabitDetailPage (protected)
/analytics              → AnalyticsPage (protected)
/insights               → InsightsPage (protected)
/profile                → ProfilePage (protected)
```

Protected routes are wrapped in a `<RequireAuth>` component that checks for a valid access token and redirects to `/login` if absent/expired.

---

## 4. Folder Structure

```
frontend/src/
├── api/
│   ├── client.ts          # Axios instance + interceptors
│   ├── auth.api.ts
│   ├── habits.api.ts
│   ├── analytics.api.ts
│   └── insights.api.ts
├── components/
│   ├── ui/                # Buttons, inputs, cards (design system primitives)
│   ├── habit/              # HabitCard, HabitForm
│   ├── analytics/          # HeatmapCalendar, ProductivityScore, Charts
│   └── layout/              # Navbar, Sidebar, PageContainer
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── HabitListPage.tsx
│   ├── AnalyticsPage.tsx
│   └── InsightsPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useHabits.ts
│   ├── useStreak.ts
│   └── useTheme.ts
├── routes/
│   ├── AppRouter.tsx
│   └── RequireAuth.tsx
├── store/
│   └── AuthContext.tsx
├── types/
│   ├── habit.types.ts
│   └── analytics.types.ts
└── utils/
    ├── dateUtils.ts
    └── formatters.ts
```

---

## 5. Reusable Components

| Component | Purpose |
|---|---|
| `HabitCard` | Displays a single habit with completion toggle and streak badge |
| `HeatmapCalendar` | Renders daily completion heatmap grid |
| `StreakBadge` | Shows current/longest streak with flame icon |
| `ProductivityScoreGauge` | Radial gauge visualizing productivity score |
| `InsightCard` | Displays a single AI-generated insight message |
| `Modal` | Generic modal wrapper used for habit create/edit dialogs |
| `Toast` | Notification system for success/error feedback |
| `ThemeToggle` | Dark/light mode switch |

---

## 6. Hooks

| Hook | Purpose |
|---|---|
| `useAuth()` | Exposes current user, login/logout functions, token state |
| `useHabits()` | Wraps React Query for fetching/mutating habits |
| `useStreak(habitId)` | Fetches streak data for a specific habit |
| `useAnalytics(range)` | Fetches weekly/monthly analytics data |
| `useInsights()` | Fetches AI-generated insights |
| `useTheme()` | Manages and persists dark/light mode preference |
| `useDebounce(value, delay)` | Generic debounce utility for search/filter inputs |

---

## 7. UI Design

- Design system built on Tailwind CSS utility classes with a small set of shared design tokens (spacing scale, color palette, typography scale).
- Component library follows atomic-ish composition: primitives (`Button`, `Input`, `Card`) compose into feature components (`HabitCard`, `InsightCard`).
- Consistent iconography via a single icon library (e.g., Lucide React) to avoid visual inconsistency.

---

## 8. Responsive Strategy

- Mobile-first Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).
- Dashboard layout collapses from multi-column (desktop) to single-column stacked cards (mobile).
- Heatmap calendar switches from full-year grid (desktop) to scrollable monthly view (mobile).
- Navigation switches from sidebar (desktop) to bottom tab bar or hamburger menu (mobile).

---

## 9. Accessibility

- Semantic HTML elements used throughout (`<button>`, `<nav>`, `<main>`, `<form>`).
- All interactive elements are keyboard-navigable with visible focus states.
- Color contrast meets WCAG AA standards in both light and dark themes.
- Charts and heatmaps include text-based summaries/alt descriptions for screen readers.
- Form inputs have associated `<label>` elements and `aria-describedby` for validation errors.

---

## 10. Performance Optimization

- Code-splitting via React Router lazy-loaded routes (`React.lazy` + `Suspense`).
- React Query caching reduces redundant network requests across navigations.
- Memoization (`useMemo`, `React.memo`) applied to expensive chart computations.
- Images and icons optimized/served in modern formats (SVG/WebP).
- Vite's production build performs tree-shaking and code minification automatically.
- Virtualization considered for long habit lists (e.g., `react-window`) at scale.

Related: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`TECH_STACK.md`](./TECH_STACK.md), [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)
