# PRD.md

# Product Requirements Document — HabitFlow

## 1. Vision

HabitFlow aims to become the most insightful personal habit-building companion by combining simple daily tracking with meaningful analytics and behavioral feedback. Rather than relying on willpower alone, HabitFlow gives users **visibility** into their patterns and **actionable guidance** to sustain long-term behavior change.

> "Track less, understand more."

---

## 2. Problem Statement

Habit-tracking apps have high abandonment rates (industry estimates suggest 70-80% of users stop using habit apps within 3 months). Root causes include:

- Lack of meaningful feedback beyond a checkmark
- No visibility into *why* streaks break
- Absence of positive reinforcement at the right moments
- Generic, one-size-fits-all reminders that get ignored
- No way to see long-term trends, only daily state

HabitFlow addresses these by pairing tracking with **analytics and rule-based insights**, turning raw completion data into a coherent narrative about the user's behavior.

---

## 3. Target Users

- Individuals building personal routines (fitness, learning, mindfulness)
- Knowledge workers seeking productivity structure
- Students building study habits
- People recovering from burnout who need low-friction re-engagement
- Quantified-self enthusiasts who want data-backed self-improvement

---

## 4. User Personas

### Persona 1 — "Structured Sam"
- Age 29, software engineer
- Wants to track gym, reading, and coding practice
- Motivated by streaks and data visualization
- Pain point: loses motivation when a streak breaks and abandons the habit entirely

### Persona 2 — "Overwhelmed Olivia"
- Age 34, working parent
- Wants to build 2-3 small habits (water intake, stretching, journaling)
- Needs gentle reminders, not guilt-inducing notifications
- Pain point: no time to analyze her own patterns manually

### Persona 3 — "Data-Driven Dev"
- Age 24, grad student
- Wants deep analytics: heatmaps, weekly reports, productivity score
- Pain point: existing apps give a checkbox but no insight

---

## 5. User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | new user | sign up with email and password | I can start tracking habits securely |
| US-02 | user | create a habit with a category and frequency | I can track something specific to my goals |
| US-03 | user | mark a habit complete for today | I can log my daily progress |
| US-04 | user | see my current and best streak | I stay motivated to continue |
| US-05 | user | view a heatmap calendar of my activity | I can visually understand my consistency |
| US-06 | user | receive a weekly report | I can reflect on my performance |
| US-07 | user | see AI-generated insights | I understand patterns I might miss |
| US-08 | user | earn badges for milestones | I feel rewarded for consistency |
| US-09 | user | set daily reminders | I don't forget to complete habits |
| US-10 | user | export my reports | I can keep personal records or share with a coach |
| US-11 | user | toggle dark mode | I can use the app comfortably at night |
| US-12 | returning user | log in and see my dashboard immediately | I get instant visibility into today's tasks |

---

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | System shall support user registration and JWT-based login |
| FR-02 | System shall allow users to create, edit, delete, and archive habits |
| FR-03 | System shall support daily and weekly frequency habits |
| FR-04 | System shall record completion entries per habit per day |
| FR-05 | System shall calculate current streak and longest streak per habit |
| FR-06 | System shall generate a productivity score based on completion rate |
| FR-07 | System shall render a heatmap calendar of activity |
| FR-08 | System shall generate weekly and monthly analytics reports |
| FR-09 | System shall generate rule-based insights from user behavior |
| FR-10 | System shall award badges based on defined achievement rules |
| FR-11 | System shall allow configuration of reminders per habit |
| FR-12 | System shall support exporting reports as PDF/CSV |
| FR-13 | System shall support dark/light theme toggle |

---

## 7. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | API response time shall be under 300ms for 95th percentile requests |
| NFR-02 | System shall support at least 10,000 concurrent users at MVP scale |
| NFR-03 | Passwords shall be hashed using BCrypt (cost factor ≥ 12) |
| NFR-04 | All API traffic shall be served over HTTPS |
| NFR-05 | System shall maintain 99.5% uptime SLA |
| NFR-06 | Frontend shall achieve a Lighthouse performance score ≥ 90 |
| NFR-07 | System shall be horizontally scalable via stateless backend services |
| NFR-08 | Database backups shall run daily with 30-day retention |

---

## 8. Success Metrics & KPIs

| Metric | Target |
|---|---|
| 30-day user retention | ≥ 40% |
| Average habits tracked per active user | ≥ 3 |
| Weekly active users / monthly active users (stickiness) | ≥ 35% |
| Average streak length | ≥ 7 days |
| Insight engagement rate (users viewing insights weekly) | ≥ 50% |
| Report export usage | ≥ 15% of active users monthly |
| App crash-free session rate | ≥ 99.5% |

---

## 9. Acceptance Criteria (Sample)

**Feature: Habit Completion**
- Given a user has an active habit, when they mark it complete for today, then the completion record is saved and the streak is recalculated within 1 second.
- Given a user has already completed a habit today, when they view the habit, then it shows as "completed" and cannot be marked complete twice.

**Feature: AI Insights**
- Given a user has at least 7 days of completion data, when they open the Insights tab, then at least one relevant rule-based insight is displayed.
- Given a user has no data, when they open Insights, then a friendly empty state is shown instead of an error.

---

## 10. Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Low user retention due to reminder fatigue | High | Medium | Smart reminder frequency, user-configurable |
| Data privacy concerns with behavioral tracking | High | Low | Clear privacy policy, data export/delete tools |
| Insight rules feel generic/irrelevant | Medium | Medium | Iterative rule refinement, user feedback loop |
| Scaling issues with analytics queries | Medium | Medium | Indexing, caching, pre-aggregated tables |
| JWT token theft/session hijacking | High | Low | Short-lived tokens, refresh token rotation |

---

## 11. Future Scope

- Machine-learning-based personalized insights (see [`AI_INSIGHTS.md`](./AI_INSIGHTS.md))
- Social/accountability features (friend streaks, shared challenges)
- Native mobile applications
- Wearable integrations
- Habit templates/marketplace
- Team/organization habit tracking for coaching use cases

Related documents: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`ANALYTICS.md`](./ANALYTICS.md), [`ROADMAP.md`](./ROADMAP.md)
