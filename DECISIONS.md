# DECISIONS.md

# Architecture Decision Records (ADRs) — HabitFlow

## ADR-001: Why React?

**Status:** Accepted

**Context:** Needed a frontend framework for a data-heavy, interactive SPA (dashboards, charts, heatmaps).

**Decision:** Use React 18 with TypeScript.

**Rationale:**
- Mature ecosystem for data visualization (Recharts) and server-state management (React Query).
- Component reusability fits HabitFlow's card/widget-heavy UI.
- Large talent pool for future contributors on an open-source project.

**Trade-offs:** More boilerplate than Vue/Svelte for simple state; mitigated by React Query reducing manual state management.

**Alternatives considered:** Vue.js (simpler but smaller ecosystem for our chart/analytics needs), Svelte (excellent performance but less mature ecosystem at time of decision).

---

## ADR-002: Why Spring Boot?

**Status:** Accepted

**Context:** Needed a backend framework capable of secure, maintainable REST APIs with strong ORM and security integration.

**Decision:** Use Spring Boot 3 (Java 17+).

**Rationale:**
- Spring Security provides battle-tested JWT/auth handling out of the box.
- Spring Data JPA significantly reduces repository boilerplate.
- Enterprise-proven for long-term maintainability by multiple contributors (important for an open-source project expecting community contributions).
- Strong typing (Java) reduces runtime errors in business-critical logic (streak/score calculations).

**Trade-offs:** More verbose than Node.js/Express; slower initial development velocity than a JS-only stack.

**Alternatives considered:** Node.js/NestJS (faster to prototype, shared language with frontend), Django/FastAPI (great for rapid development, weaker typing story than Java for this team's preference).

---

## ADR-003: Why MySQL?

**Status:** Accepted

**Context:** HabitFlow's domain is inherently relational — users, habits, completions, streaks with clear foreign-key relationships and a need for aggregate analytics queries.

**Decision:** Use MySQL 8.x as the primary datastore.

**Rationale:**
- ACID compliance ensures data integrity for streak/completion records where duplicate/lost writes would corrupt user trust in their data.
- Mature indexing support for the range queries analytics relies on (see [`DATABASE.md`](./DATABASE.md)).
- Wide, low-cost hosting availability (Render, Railway, PlanetScale).

**Trade-offs:** Less flexible schema evolution than a document store; acceptable given the well-defined, stable domain model.

**Alternatives considered:** PostgreSQL (comparable, richer feature set — a reasonable alternative, chosen against mainly for team familiarity and hosting simplicity), MongoDB (poor fit for relational, join-heavy analytics queries).

---

## ADR-004: Why JWT?

**Status:** Accepted

**Context:** Needed an authentication mechanism compatible with a decoupled SPA + REST API architecture, deployable across independently scaled services.

**Decision:** Use JWT (access + refresh token pattern) via Spring Security.

**Rationale:**
- Stateless — no server-side session store required, simplifying horizontal scaling of the backend.
- Well-supported in both Spring Security and the frontend Axios interceptor pattern.
- Refresh token rotation mitigates the primary weakness (token revocation difficulty) of pure JWT approaches.

**Trade-offs:** Token revocation is harder than session-based auth; mitigated via short access-token TTL and refresh rotation. See [`SECURITY.md`](./SECURITY.md) for full mitigation strategy.

**Alternatives considered:** Server-side sessions with Redis (simpler revocation, but adds statefulness that complicates horizontal scaling), third-party auth providers like Auth0/Clerk (faster to implement, but adds external dependency and cost for an open-source project).

---

## ADR-005: Why Layered Architecture?

**Status:** Accepted

**Context:** Needed a backend structure that's approachable for open-source contributors of varying experience levels while remaining maintainable long-term.

**Decision:** Use a classic Layered Architecture (Controller → Service → Repository) with DTO and Repository patterns.

**Rationale:**
- Clear separation of concerns makes it easy for new contributors to know where to add code (see [`BACKEND.md`](./BACKEND.md)).
- Well-understood pattern in the Spring ecosystem, minimizing onboarding friction.
- DTOs decouple the public API contract from internal persistence models, allowing each to evolve independently.

**Trade-offs:** Can lead to anemic domain models if business logic isn't disciplined into the service layer; mitigated through code review standards in [`CODING_STANDARDS.md`](./CODING_STANDARDS.md).

**Alternatives considered:** Hexagonal/Clean Architecture (more flexible for complex domains, but adds abstraction overhead not justified at HabitFlow's current scale), Domain-Driven Design with aggregates (over-engineered for the current bounded context size).

---

## ADR-006: Why REST over GraphQL?

**Status:** Accepted

**Context:** Needed an API style for communication between the React frontend and Spring Boot backend.

**Decision:** Use REST (resource-oriented) APIs.

**Rationale:**
- HabitFlow's data access patterns are relatively fixed and well-known upfront (dashboard, habit list, analytics) — GraphQL's flexible querying provides less benefit at this stage.
- REST is simpler to secure, cache, rate-limit, and document (OpenAPI/Swagger) with Spring Boot's built-in tooling.
- Lower learning curve for open-source contributors unfamiliar with GraphQL schema design.

**Trade-offs:** Some over-fetching/under-fetching on complex dashboard views; mitigated by purpose-built aggregate endpoints (e.g., `/analytics/heatmap`) rather than generic CRUD-only endpoints.

**Alternatives considered:** GraphQL (better for flexible, client-driven queries — worth revisiting if the frontend's data needs become significantly more dynamic, e.g., with a future mobile app requiring different data shapes).

---

## ADR-007: Why Rule-Based AI Insights (Not ML) for V1

**Status:** Accepted

**Context:** Needed to deliver "intelligent" behavioral feedback without requiring a trained model, labeled data, or ML infrastructure for the initial release.

**Decision:** Implement insights via a deterministic rule engine (see [`AI_INSIGHTS.md`](./AI_INSIGHTS.md)).

**Rationale:**
- Fully explainable — every insight can be traced to a specific, understandable condition, which builds user trust.
- No cold-start problem — works for new users with minimal data (unlike most ML approaches).
- Faster to ship and iterate on based on direct user feedback about which insights are useful.

**Trade-offs:** Less personalized/adaptive than a true ML model; explicitly planned as a future evolution (see [`AI_INSIGHTS.md`](./AI_INSIGHTS.md) §6 and [`ROADMAP.md`](./ROADMAP.md)).

**Alternatives considered:** Third-party ML/AI API integration (adds cost and external dependency misaligned with an open-source project's goals at MVP stage).

Related: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`TECH_STACK.md`](./TECH_STACK.md), [`AI_INSIGHTS.md`](./AI_INSIGHTS.md)
