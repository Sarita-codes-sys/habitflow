# TECH_STACK.md

# Technology Stack — HabitFlow

This document explains every technology used in HabitFlow, why it was chosen, its advantages, and viable alternatives. See also [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind major architectural trade-offs.

---

## Frontend

### React 18
- **Why:** Component-based architecture fits HabitFlow's modular UI (habit cards, charts, heatmaps). Large ecosystem and community support.
- **Advantages:** Virtual DOM performance, mature tooling, huge hiring pool, strong ecosystem (React Query, Router).
- **Alternatives:** Vue.js (simpler learning curve), Svelte (less boilerplate, smaller bundle), Angular (more opinionated, heavier).

### TypeScript
- **Why:** Type safety reduces runtime bugs, especially important for analytics data structures and API contracts.
- **Advantages:** Compile-time error catching, better IDE autocomplete, self-documenting interfaces.
- **Alternatives:** Plain JavaScript with JSDoc, Flow (largely deprecated in favor of TS).

### Vite
- **Why:** Extremely fast dev server startup and HMR compared to Webpack-based tooling.
- **Advantages:** Native ESM dev server, fast builds via esbuild/rollup, minimal config.
- **Alternatives:** Create React App (deprecated), Webpack (slower, more config), Parcel.

### Tailwind CSS
- **Why:** Utility-first CSS speeds up building consistent, responsive UI without context-switching to separate stylesheets.
- **Advantages:** Small production bundle via purge, design consistency, rapid prototyping.
- **Alternatives:** CSS Modules, styled-components, Chakra UI, plain SCSS.

### React Router
- **Why:** Standard routing solution for React SPAs; supports nested routes for dashboard/habit/analytics pages.
- **Advantages:** Declarative routing, code-splitting support, active community.
- **Alternatives:** TanStack Router, Next.js App Router (would require framework migration).

### Axios
- **Why:** Simplifies HTTP requests with interceptors for JWT attachment and centralized error handling.
- **Advantages:** Request/response interceptors, automatic JSON parsing, wide browser support.
- **Alternatives:** Native `fetch` API, ky, redaxios.

### React Query (TanStack Query)
- **Why:** Manages server state (habits, analytics) with caching, background refetching, and optimistic updates — critical for a data-heavy dashboard.
- **Advantages:** Reduces boilerplate vs. manual Redux data fetching, built-in caching/invalidation, devtools.
- **Alternatives:** SWR, Redux Toolkit Query, manual `useEffect` fetching (not recommended at scale).

### Recharts
- **Why:** Declarative, React-native charting library well-suited for productivity trends, heatmaps, and bar/line charts.
- **Advantages:** Composable chart components, responsive by default, good documentation.
- **Alternatives:** Chart.js, Nivo, Victory, D3.js (more powerful but far more complex).

---

## Backend

### Spring Boot
- **Why:** Production-grade Java framework with convention-over-configuration, ideal for building secure, maintainable REST APIs.
- **Advantages:** Auto-configuration, embedded server, huge ecosystem (Security, Data JPA, Validation), enterprise-proven.
- **Alternatives:** Node.js/Express or NestJS (JS-based, faster prototyping), Django/FastAPI (Python), Micronaut/Quarkus (lighter-weight JVM alternatives).

### Spring Security
- **Why:** Industry-standard security framework for authentication/authorization in the Spring ecosystem.
- **Advantages:** Deep JWT integration, method-level security annotations, CSRF/CORS handling built in.
- **Alternatives:** Custom auth middleware (higher risk), Shiro.

### JWT (JSON Web Tokens)
- **Why:** Stateless authentication mechanism suited for a decoupled frontend/backend architecture.
- **Advantages:** No server-side session storage, scalable across multiple backend instances, easy to verify.
- **Alternatives:** Session-based auth with server-side store (Redis), OAuth2 with an identity provider (Auth0, Keycloak) for larger scale.

### Spring Data JPA
- **Why:** Reduces boilerplate for database access via repository interfaces and derived queries.
- **Advantages:** ORM abstraction over Hibernate, pagination/sorting support, easy custom queries via JPQL.
- **Alternatives:** MyBatis (more SQL control), jOOQ (type-safe SQL), plain JDBC (more boilerplate).

### Bean Validation (Jakarta Validation)
- **Why:** Declarative request validation via annotations (`@NotNull`, `@Email`, `@Size`) on DTOs.
- **Advantages:** Centralized validation logic, integrates cleanly with Spring MVC exception handling.
- **Alternatives:** Manual validation logic in service layer.

### REST API
- **Why:** Simple, widely understood, cache-friendly, and sufficient for HabitFlow's resource-oriented domain (habits, users, reports).
- **Advantages:** Stateless, easy to document (OpenAPI), broad client compatibility.
- **Alternatives:** GraphQL (more flexible querying, added complexity), gRPC (better for internal service-to-service, not ideal for public web APIs).

---

## Database

### MySQL
- **Why:** Reliable, well-understood relational database that fits HabitFlow's structured, relationship-heavy data model (users → habits → completions).
- **Advantages:** ACID compliance, mature tooling, wide hosting support, strong indexing capabilities.
- **Alternatives:** PostgreSQL (richer feature set, JSONB support), MongoDB (flexible schema but weaker for relational analytics queries).

---

## Authentication

### JWT + Spring Security Filter Chain
- **Why:** Enables stateless, horizontally scalable authentication without server-side session storage.
- **Advantages:** Works well with SPA frontend, easy to pass in Authorization headers, supports refresh token rotation.
- **Alternatives:** Session cookies with server-side store, third-party auth providers (Auth0, Firebase Auth, Clerk).

---

## Deployment

### Docker
- **Why:** Ensures consistent environments across development, CI, and production.
- **Advantages:** Reproducible builds, easy local orchestration via Docker Compose, portable across cloud providers.
- **Alternatives:** Manual VM provisioning, Nix-based reproducible builds.

### GitHub Actions
- **Why:** Native CI/CD integration with the GitHub-hosted repository; no separate CI service needed.
- **Advantages:** YAML-based pipelines, large marketplace of reusable actions, free tier for public repos.
- **Alternatives:** GitLab CI, CircleCI, Jenkins.

### Render / Railway (Backend Hosting)
- **Why:** Simple, cost-effective PaaS options for deploying containerized Spring Boot services without managing raw infrastructure.
- **Advantages:** Git-based deploys, managed SSL, easy environment variable management.
- **Alternatives:** AWS ECS/Elastic Beanstalk, Heroku, Fly.io.

### Vercel (Frontend Hosting)
- **Why:** Purpose-built for frontend frameworks like React/Vite with global CDN and instant preview deployments.
- **Advantages:** Zero-config deploys, automatic HTTPS, edge caching, PR preview URLs.
- **Alternatives:** Netlify, Cloudflare Pages, AWS Amplify.

---

## Testing

| Layer | Tool | Purpose |
|---|---|---|
| Backend unit tests | JUnit 5 + Mockito | Service/repository logic |
| Backend integration tests | Spring Boot Test + Testcontainers | Full API + DB integration |
| Frontend unit tests | Vitest + React Testing Library | Component/hook behavior |
| API contract testing | Postman/Newman or REST Assured | Endpoint validation |
| E2E testing | Playwright or Cypress | Full user flow validation |

Full details in [`TESTING.md`](./TESTING.md).

---

## Charts & Data Visualization

- **Recharts** — primary charting library for the analytics dashboard (bar, line, radial charts).
- **Custom heatmap component** — built with CSS grid + Tailwind for the activity calendar (lighter weight than a full charting library for this specific visualization).

---

## Libraries (Notable)

| Library | Purpose |
|---|---|
| `date-fns` | Date manipulation for streaks, calendars, reports |
| `zod` | Runtime schema validation on the frontend for forms |
| `react-hook-form` | Performant form state management |
| `jjwt` (Java) | JWT creation/parsing on the backend |
| `mapstruct` | DTO ↔ Entity mapping on the backend |
| `lombok` | Boilerplate reduction (getters/setters/builders) in Java |

---

## Developer Tools

| Tool | Purpose |
|---|---|
| ESLint + Prettier | Frontend code linting/formatting |
| Checkstyle + Spotless | Backend code style enforcement |
| Husky + lint-staged | Pre-commit hooks |
| Swagger/OpenAPI (springdoc) | Auto-generated API documentation |
| Postman | Manual API testing collections |
| Docker Compose | Local multi-service orchestration |

---

Related: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DECISIONS.md`](./DECISIONS.md), [`DEPLOYMENT.md`](./DEPLOYMENT.md)
