# CHANGELOG.md

# Changelog

All notable changes to HabitFlow are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Nothing yet.

### Changed
- Nothing yet.

### Fixed
- Nothing yet.

---

## [1.0.0] — 2026-07-23

### Added
- User authentication with JWT (register, login, refresh, logout)
- User profile management with theme preference
- Habit CRUD operations with categories and daily/weekly frequency
- Daily habit completion tracking with idempotent completion logic
- Streak tracking (current streak, longest streak)
- Dashboard displaying today's habits and streak summaries
- Dark mode support across the application
- Docker and Docker Compose configuration for local development
- CI pipeline via GitHub Actions (lint, test, build)
- Initial API documentation ([`API.md`](./API.md))
- Initial security hardening: BCrypt password hashing, JWT auth, CORS restrictions

### Security
- Enforced HTTPS for all production traffic
- Implemented rate limiting on authentication endpoints

---

## [0.3.0] — 2026-06-30 (Pre-release)

### Added
- Habit category support
- Weekly frequency habit type with configurable target per week
- Validation layer for all request DTOs

### Fixed
- Streak calculation bug where same-day duplicate completions incorrectly incremented streak

---

## [0.2.0] — 2026-06-10 (Pre-release)

### Added
- Basic habit CRUD endpoints
- MySQL schema and initial JPA entities
- Spring Security configuration with JWT filter chain

### Changed
- Migrated from session-based auth prototype to JWT-based auth

---

## [0.1.0] — 2026-05-20 (Pre-release)

### Added
- Initial project scaffolding (Spring Boot backend, React + Vite frontend)
- Basic user registration and login (proof of concept)
- Project documentation skeleton

---

[Unreleased]: https://github.com/your-org/habitflow/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/habitflow/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/your-org/habitflow/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/your-org/habitflow/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/habitflow/releases/tag/v0.1.0
