# TESTING.md

# Testing Strategy — HabitFlow

## 1. Unit Testing

**Backend (JUnit 5 + Mockito):**
- Services tested in isolation with mocked repositories.
- Focus: streak calculation logic, productivity score formula, validation edge cases.

```java
@Test
void shouldIncrementStreak_whenCompletedOnConsecutiveDay() {
    Habit habit = Habit.builder().id(1L).build();
    Streak existing = new Streak(1L, 5, 5, LocalDate.of(2026,7,22));
    when(streakRepository.findByHabitId(1L)).thenReturn(Optional.of(existing));

    Streak result = habitService.recalculateStreak(habit, LocalDate.of(2026,7,23));

    assertEquals(6, result.getCurrentStreak());
}
```

**Frontend (Vitest + React Testing Library):**
- Component rendering, hook logic, form validation.

```ts
test('HabitCard shows current streak', () => {
  render(<HabitCard habit={{ name: 'Run', currentStreak: 4 }} />);
  expect(screen.getByText(/4 day streak/i)).toBeInTheDocument();
});
```

---

## 2. Integration Testing

- Spring Boot Test with **Testcontainers** spinning up a real MySQL instance to validate repository queries and full request-to-database flows.
- Verifies JPA mappings, constraint enforcement (unique completion per day), and transactional rollback behavior.

```java
@SpringBootTest
@Testcontainers
class HabitCompletionIntegrationTest {
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");

    @Test
    void shouldRejectDuplicateCompletionForSameDay() {
        // save first completion, assert second throws DataIntegrityViolationException
    }
}
```

---

## 3. Frontend Testing

| Type | Tool | Scope |
|---|---|---|
| Component tests | React Testing Library | Rendering, user interaction (click, form submit) |
| Hook tests | Vitest + `renderHook` | `useAuth`, `useHabits`, `useStreak` logic |
| Snapshot tests | Vitest snapshots | Stable UI components (charts, cards) — used sparingly |
| Accessibility tests | `jest-axe` (via Vitest) | Automated a11y checks on key pages |

---

## 4. Backend Testing

| Type | Tool | Scope |
|---|---|---|
| Unit tests | JUnit 5 + Mockito | Service layer business logic |
| Repository tests | `@DataJpaTest` + H2/Testcontainers | Query correctness |
| Security tests | Spring Security Test | JWT filter behavior, access control |
| Contract tests | Spring REST Docs / OpenAPI validation | Ensure API matches documented contract |

---

## 5. API Testing

- Postman collection covering all endpoints in [`API.md`](./API.md), run via `newman` in CI.
- Assertions on status codes, response schema, and error message formats.
- Includes negative test cases: missing auth header, invalid payloads, duplicate resource creation.

---

## 6. Performance Testing

- **Load testing** with k6 or JMeter against staging environment.
- Target: 95th percentile response time < 300ms under 500 concurrent virtual users (aligned with NFR-01/NFR-02 in [`PRD.md`](./PRD.md)).
- Key endpoints tested: `GET /habits`, `POST /habits/{id}/complete`, `GET /analytics/heatmap`.
- Database query performance validated via `EXPLAIN ANALYZE` on analytics queries against realistic data volumes (100k+ completion rows).

---

## 7. Security Testing

- Automated dependency vulnerability scanning (Dependabot/Snyk) in CI.
- OWASP ZAP baseline scan against staging API for common vulnerabilities.
- Manual test cases: JWT tampering, expired token handling, IDOR attempts (accessing another user's habit by ID), SQL injection payloads in query params.
- See [`SECURITY.md`](./SECURITY.md) for the full checklist these tests validate against.

---

## 8. Test Cases (Representative Sample)

| ID | Scenario | Expected Result |
|---|---|---|
| TC-01 | Register with valid data | 201 Created, user persisted |
| TC-02 | Register with existing email | 409 Conflict |
| TC-03 | Login with correct credentials | 200 OK, tokens returned |
| TC-04 | Login with wrong password | 401 Unauthorized |
| TC-05 | Create habit while authenticated | 201 Created |
| TC-06 | Create habit without auth token | 401 Unauthorized |
| TC-07 | Complete habit twice same day | Second call returns 409 Conflict |
| TC-08 | Complete habit on consecutive day | currentStreak increments by 1 |
| TC-09 | Miss a day then complete | currentStreak resets to 1 |
| TC-10 | Access another user's habit by ID | 403 Forbidden or 404 Not Found |
| TC-11 | Fetch insights with < 7 days data | Empty array returned, no error |
| TC-12 | Export monthly report as PDF | 200 OK, valid PDF binary returned |
| TC-13 | Exceed login rate limit | 429 Too Many Requests |
| TC-14 | Toggle dark mode | Preference persisted and reflected on reload |

---

## 9. CI Test Gate

All test suites (unit, integration, API) run automatically on every pull request via GitHub Actions (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)). Merges to `main` are blocked if any test suite fails or coverage drops below the configured threshold (target: ≥ 80% line coverage on service layer).

Related: [`DEPLOYMENT.md`](./DEPLOYMENT.md), [`SECURITY.md`](./SECURITY.md), [`API.md`](./API.md)
