# CODING_STANDARDS.md

# Coding Standards — HabitFlow

## 1. Java Standards

- Follow the **Google Java Style Guide** (2-space indentation, 100-char line limit).
- Use `final` for variables that aren't reassigned.
- Prefer constructor injection (`@RequiredArgsConstructor` via Lombok) over field injection.
- Services must not contain HTTP-specific logic (no `HttpServletRequest` handling in services).
- Use `Optional<T>` for repository methods that may return no result; avoid returning `null`.
- Records (`record HabitRequestDTO(...)`) preferred for immutable DTOs (Java 17+).
- Avoid catching generic `Exception`; catch specific exceptions and rethrow as domain exceptions where appropriate.

```java
// Good
public Optional<Habit> findActiveHabit(Long id) {
    return habitRepository.findByIdAndArchivedFalse(id);
}

// Avoid
public Habit findActiveHabit(Long id) {
    return habitRepository.findById(id).orElse(null); // null-prone
}
```

---

## 2. React Standards

- Functional components only; no class components.
- One component per file; file name matches component name (`HabitCard.tsx` exports `HabitCard`).
- Props typed via explicit `interface` or `type`, never `any`.
- Prefer composition over prop-drilling more than 2 levels deep — use context or component composition instead.
- Side effects isolated in `useEffect` with correct dependency arrays; avoid effect-based derived state where a computed value would do.
- Custom hooks prefixed with `use` and placed in `/hooks`.

```tsx
// Good
interface HabitCardProps {
  habit: Habit;
  onComplete: (id: number) => void;
}

export function HabitCard({ habit, onComplete }: HabitCardProps) {
  return (
    <div className="rounded-lg p-4 shadow-sm">
      <h3>{habit.name}</h3>
      <button onClick={() => onComplete(habit.id)}>Complete</button>
    </div>
  );
}
```

---

## 3. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Java classes | PascalCase | `HabitService` |
| Java methods/variables | camelCase | `calculateStreak()` |
| Java constants | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| React components | PascalCase | `HeatmapCalendar.tsx` |
| React hooks | camelCase, `use` prefix | `useHabits.ts` |
| TS types/interfaces | PascalCase | `HabitResponseDTO` |
| CSS/Tailwind custom classes | kebab-case | `habit-card-active` |
| Database tables | snake_case, plural | `habit_completions` |
| Database columns | snake_case | `current_streak` |

---

## 4. Folder Naming

- Backend packages: lowercase, singular where representing a layer (`controller`, `service`, `dto`), matching Java package conventions.
- Frontend folders: lowercase, feature-based (`components/habit`, `components/analytics`).
- Test files mirror source structure: `HabitServiceTest.java` next to `HabitService.java` conceptually (in `src/test/java/...`); `HabitCard.test.tsx` colocated with `HabitCard.tsx`.

---

## 5. API Naming

- Resource-oriented, plural nouns: `/habits`, `/reports`, `/insights`.
- Nested resources for sub-actions: `POST /habits/{id}/complete` rather than `/complete-habit`.
- Use HTTP methods semantically: `GET` (read), `POST` (create), `PUT` (full update), `PATCH` (partial update, if needed), `DELETE` (remove).
- Query parameters in camelCase: `?weekStart=2026-07-14`.
- Versioning reserved for future breaking changes: `/api/v2/...` (currently unversioned `/api/...` for v1).

---

## 6. Error Handling

- **Backend:** All exceptions funnel through `GlobalExceptionHandler` (see [`BACKEND.md`](./BACKEND.md) §7); never let raw stack traces reach the client.
- **Frontend:** API errors caught centrally in the Axios response interceptor, surfaced via a consistent `Toast` component; component-level `try/catch` only for flows requiring specific recovery behavior.
- Error messages shown to users must be human-readable and actionable, never raw exception messages or stack traces.
- Never swallow exceptions silently — at minimum, log at `WARN` or `ERROR`.

---

## 7. Logging

- Use SLF4J (`private static final Logger log = LoggerFactory.getLogger(HabitService.class);`) — never `System.out.println`.
- Log at appropriate levels: `ERROR` (unexpected failures), `WARN` (recoverable issues, auth failures), `INFO` (key business events), `DEBUG` (verbose tracing, disabled in production).
- Never log sensitive data: passwords, JWTs, full request bodies containing PII.
- Frontend: use a centralized logging utility instead of scattered `console.log`; remove/guard debug logs before production builds.

---

## 8. Documentation Standards

- Every public backend method with non-obvious behavior includes a Javadoc comment explaining intent (not restating the signature).
- Every exported React component/hook includes a brief JSDoc comment if its purpose isn't self-evident from its name and props.
- API changes must be reflected in [`API.md`](./API.md) in the same PR.
- Architectural changes must be reflected in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and, if a significant trade-off was made, recorded as a new ADR in [`DECISIONS.md`](./DECISIONS.md).
- README and setup instructions must be kept in sync with actual `package.json`/`pom.xml` scripts — verified as part of PR review for any tooling changes.

Related: [`CONTRIBUTING.md`](./CONTRIBUTING.md), [`BACKEND.md`](./BACKEND.md), [`FRONTEND.md`](./FRONTEND.md)
