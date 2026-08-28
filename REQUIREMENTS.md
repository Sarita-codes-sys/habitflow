# REQUIREMENTS.md

# Requirements Specification — HabitFlow

This document consolidates functional, business, technical, performance, security, and usability requirements. It complements [`PRD.md`](./PRD.md) with a more granular, engineering-focused breakdown.

---

## 1. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Users can register with email/password | Must |
| FR-02 | Users can log in and receive JWT tokens | Must |
| FR-03 | Users can create, edit, delete, and archive habits | Must |
| FR-04 | Users can mark habits complete/incomplete for a given date | Must |
| FR-05 | System calculates and displays current/longest streaks | Must |
| FR-06 | Users can view a heatmap calendar of activity | Should |
| FR-07 | System generates weekly and monthly analytics reports | Should |
| FR-08 | Users can export reports as PDF/CSV | Should |
| FR-09 | System generates rule-based AI insights | Should |
| FR-10 | Users earn badges for milestones | Could |
| FR-11 | Users can configure reminders per habit | Should |
| FR-12 | Users can toggle dark/light theme | Must |
| FR-13 | Users can edit their profile information | Must |

*(Priority per MoSCoW method: Must, Should, Could, Won't-this-release)*

---

## 2. Business Requirements

| ID | Requirement |
|---|---|
| BR-01 | The product must be free to use at MVP stage (no paywall) to drive open-source adoption and community growth |
| BR-02 | The codebase must be structured for community contribution (clear docs, contribution guidelines) |
| BR-03 | The system must support future monetization paths (e.g., premium analytics) without a full re-architecture |
| BR-04 | The product must be deployable on low-cost/free-tier infrastructure for early-stage sustainability |
| BR-05 | User data ownership and export must be supported to build trust and comply with data portability expectations |

---

## 3. Technical Requirements

| ID | Requirement |
|---|---|
| TR-01 | Backend built with Spring Boot 3 / Java 17+ |
| TR-02 | Frontend built with React 18 / TypeScript / Vite |
| TR-03 | Database: MySQL 8.x |
| TR-04 | Authentication: JWT (access + refresh tokens) |
| TR-05 | API style: RESTful JSON over HTTPS |
| TR-06 | Containerized via Docker for local dev and deployment |
| TR-07 | CI/CD via GitHub Actions |
| TR-08 | Code must pass linting and automated tests before merge to `main` |
| TR-09 | API documented via OpenAPI/Swagger, kept in sync with [`API.md`](./API.md) |

---

## 4. Performance Requirements

| ID | Requirement |
|---|---|
| PR-01 | 95th percentile API response time < 300ms under normal load |
| PR-02 | System supports ≥ 500 concurrent users at MVP scale without degradation |
| PR-03 | Frontend initial load (Largest Contentful Paint) < 2.5s on 4G connection |
| PR-04 | Analytics queries (heatmap, reports) return within 500ms for a 1-year data range |
| PR-05 | Database supports ≥ 100,000 habit_completion rows per user without query degradation (proper indexing required) |

---

## 5. Security Requirements

| ID | Requirement |
|---|---|
| SR-01 | Passwords stored using BCrypt with cost factor ≥ 12 |
| SR-02 | All traffic served over HTTPS/TLS |
| SR-03 | JWT access tokens expire within 60 minutes; refresh tokens rotate on use |
| SR-04 | All user input validated server-side regardless of client-side validation |
| SR-05 | Rate limiting enforced on authentication endpoints |
| SR-06 | No sensitive data (passwords, tokens, PII) written to logs |
| SR-07 | Dependency vulnerabilities scanned automatically in CI |

Full details in [`SECURITY.md`](./SECURITY.md).

---

## 6. Usability Requirements

| ID | Requirement |
|---|---|
| UR-01 | UI must be fully responsive across mobile, tablet, and desktop breakpoints |
| UR-02 | Core actions (mark habit complete) must be achievable in ≤ 2 taps/clicks from the dashboard |
| UR-03 | UI must meet WCAG 2.1 AA accessibility standards |
| UR-04 | Dark mode must be available and persist across sessions |
| UR-05 | Error messages must be human-readable and actionable, not raw technical output |
| UR-06 | Empty states (no habits yet, no insights yet) must guide the user toward a next action |
| UR-07 | Onboarding (first habit creation) must be completable without external documentation |

Related: [`PRD.md`](./PRD.md), [`SECURITY.md`](./SECURITY.md), [`FRONTEND.md`](./FRONTEND.md), [`TESTING.md`](./TESTING.md)
