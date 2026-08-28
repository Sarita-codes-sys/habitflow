# BACKEND.md

# Backend Architecture — HabitFlow

## 1. Package Structure

```
com.habitflow/
├── controller/       # REST endpoints (thin, delegate to services)
├── service/          # Business logic
├── repository/       # Spring Data JPA interfaces
├── entity/           # JPA entities (persistence model)
├── dto/
│   ├── request/       # Incoming request payloads
│   └── response/      # Outgoing response payloads
├── mapper/            # MapStruct entity <-> DTO mappers
├── security/          # JWT filter, security config
├── exception/         # Custom exceptions + global handler
└── config/            # Beans, CORS, OpenAPI config
```

This structure enforces the **Layered Architecture** and **Repository Pattern** described in [`ARCHITECTURE.md`](./ARCHITECTURE.md): each layer only depends on the layer directly beneath it.

---

## 2. Controllers

- Annotated with `@RestController`, mapped under `/api/**`.
- Responsible only for: request routing, input validation triggering (`@Valid`), and delegating to services.
- No business logic lives in controllers.

```java
@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @PostMapping
    public ResponseEntity<HabitResponseDTO> createHabit(
            @Valid @RequestBody HabitRequestDTO request,
            @AuthenticationPrincipal UserPrincipal user) {
        HabitResponseDTO created = habitService.createHabit(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
```

---

## 3. Services

- Contain all business logic: streak calculation, productivity score computation, insight generation orchestration.
- Annotated with `@Service`, transactional boundaries defined with `@Transactional`.
- Services depend on repositories and mappers, never directly on the HTTP layer.

```java
@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final StreakRepository streakRepository;
    private final HabitMapper habitMapper;

    @Transactional
    public CompletionResponseDTO completeHabit(Long habitId, Long userId, LocalDate date) {
        Habit habit = habitRepository.findByIdAndUserId(habitId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));

        if (completionRepository.existsByHabitIdAndCompletedDate(habitId, date)) {
            throw new ConflictException("Habit already completed for this date");
        }

        completionRepository.save(new HabitCompletion(habitId, date));
        Streak streak = recalculateStreak(habit, date);
        return habitMapper.toCompletionResponse(habit, streak);
    }
}
```

---

## 4. Repositories

- Spring Data JPA interfaces extending `JpaRepository<Entity, Long>`.
- Custom derived queries used where possible; `@Query` (JPQL) for more complex analytics queries.

```java
public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {
    boolean existsByHabitIdAndCompletedDate(Long habitId, LocalDate date);

    @Query("SELECT COUNT(c) FROM HabitCompletion c WHERE c.habitId = :habitId " +
           "AND c.completedDate BETWEEN :start AND :end")
    long countCompletionsInRange(Long habitId, LocalDate start, LocalDate end);
}
```

---

## 5. DTOs

- **Request DTOs** validate and shape incoming data (`HabitRequestDTO`, `LoginRequestDTO`).
- **Response DTOs** control exactly what's exposed to clients, decoupling API contracts from the persistence model.
- Mapping handled via MapStruct to avoid manual boilerplate and reduce mapping bugs.

```java
public record HabitRequestDTO(
    @NotBlank @Size(max = 150) String name,
    Long categoryId,
    @NotNull Frequency frequency,
    @Min(1) @Max(7) Integer targetPerWeek
) {}
```

---

## 6. Entities

- Annotated JPA entities mapped 1:1 to database tables described in [`DATABASE.md`](./DATABASE.md).
- Use Lombok (`@Getter`, `@Builder`) to reduce boilerplate while keeping entities free of business logic.

```java
@Entity
@Table(name = "habits")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Habit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private Frequency frequency;

    private Boolean archived;

    @Column(name = "user_id", nullable = false)
    private Long userId;
}
```

---

## 7. Exception Handling

Centralized via `@ControllerAdvice`, translating exceptions into standardized error responses (see [`API.md`](./API.md) for the error schema).

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }
}
```

Custom exceptions: `ResourceNotFoundException`, `ConflictException`, `UnauthorizedException`, `ValidationException`.

---

## 8. Validation

- Jakarta Bean Validation annotations on request DTOs (`@NotBlank`, `@Email`, `@Size`, `@Min/@Max`).
- Cross-field validation (e.g., `targetPerWeek` required only when `frequency == WEEKLY`) implemented via custom `@AssertTrue` methods or a custom validator annotation.
- Validation errors return `400 Bad Request` with field-level messages via `GlobalExceptionHandler`.

---

## 9. Logging

- SLF4J + Logback for structured logging.
- Each request tagged with a correlation ID (`MDC`) for traceability across logs.
- Log levels: `ERROR` for exceptions, `WARN` for auth failures/validation issues, `INFO` for key business events (habit created, streak milestone), `DEBUG` for detailed tracing in non-production environments.
- Sensitive fields (passwords, tokens) are excluded from all log statements.

---

## 10. Caching

- Spring Cache abstraction (`@Cacheable`) applied to read-heavy, infrequently-changing analytics queries (e.g., productivity score for the current day).
- Redis recommended as the caching provider for multi-instance deployments (in-memory `ConcurrentMapCacheManager` sufficient for single-instance/dev).
- Cache eviction triggered on relevant writes (e.g., new completion invalidates that user's productivity score cache).

---

## 11. Configuration

- Environment-specific configuration via Spring Profiles (`application-local.yml`, `application-prod.yml`).
- Sensitive values (DB credentials, JWT secret) injected via environment variables, never hardcoded.
- `SecurityConfig` defines the JWT filter chain, CORS policy, and public/protected endpoint matchers.
- `OpenApiConfig` (springdoc-openapi) auto-generates Swagger UI at `/swagger-ui.html` for API exploration in non-production environments.

Related: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`API.md`](./API.md), [`DATABASE.md`](./DATABASE.md), [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)
