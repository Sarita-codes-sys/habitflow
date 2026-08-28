# CONTRIBUTING.md

# Contributing to HabitFlow

Thank you for considering contributing to HabitFlow! This document outlines the process for contributing code, reporting issues, and proposing changes.

---

## 1. Branch Strategy

HabitFlow follows a **trunk-based development** model with short-lived feature branches:

- `main` — always deployable; protected branch requiring PR review and passing CI
- `feature/<short-description>` — new features (e.g., `feature/heatmap-calendar`)
- `fix/<short-description>` — bug fixes (e.g., `fix/streak-reset-bug`)
- `chore/<short-description>` — tooling, dependency updates, docs
- `hotfix/<short-description>` — urgent production fixes, branched from `main`

Branches should be short-lived (merged within days, not weeks) to minimize merge conflicts.

---

## 2. Commit Convention

We follow **Conventional Commits**:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Examples:**
```
feat(habits): add weekly frequency support
fix(auth): resolve refresh token expiry race condition
docs(api): update habit completion endpoint examples
test(analytics): add streak recalculation edge cases
```

---

## 3. Code Style

- **Backend (Java):** Follows Google Java Style Guide, enforced via Checkstyle + Spotless. Run `./mvnw spotless:apply` before committing.
- **Frontend (TypeScript/React):** ESLint + Prettier enforced via pre-commit hooks. Run `npm run lint:fix` before committing.
- Full conventions documented in [`CODING_STANDARDS.md`](./CODING_STANDARDS.md).

---

## 4. Pull Requests

**Before opening a PR:**
- Ensure all tests pass locally (`mvn test` / `npm test`)
- Ensure linting passes (`spotless:check` / `eslint`)
- Rebase on latest `main` to avoid conflicts
- Keep PRs focused — one feature/fix per PR

**PR Description Template:**
```markdown
## What
Brief description of the change.

## Why
Context/motivation (link related issue).

## How
Key implementation details.

## Testing
How this was tested.

## Screenshots (if UI change)
```

**Merge Requirements:**
- At least 1 approving review
- All CI checks passing (lint, unit tests, integration tests)
- No unresolved review comments

---

## 5. Issue Templates

### Bug Report
```markdown
**Describe the bug**
A clear description of the issue.

**Steps to Reproduce**
1. ...
2. ...

**Expected Behavior**

**Screenshots/Logs**

**Environment**
- Browser/OS:
- App version/commit:
```

### Feature Request
```markdown
**Problem**
What problem does this solve?

**Proposed Solution**

**Alternatives Considered**

**Additional Context**
```

---

## 6. Review Process

1. Author opens PR against `main` using the PR template.
2. Automated CI runs (lint, tests, build) — must pass before human review.
3. At least one maintainer reviews for: correctness, adherence to [`CODING_STANDARDS.md`](./CODING_STANDARDS.md), test coverage, and architectural fit (see [`ARCHITECTURE.md`](./ARCHITECTURE.md)).
4. Author addresses feedback via additional commits (avoid force-pushing during active review).
5. Once approved and CI is green, the PR is squash-merged into `main` with a Conventional Commit message.
6. Merged changes trigger automatic deployment per [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Code of Conduct

Be respectful, constructive, and collaborative. Disagreements should focus on the code and ideas, not individuals. Maintainers reserve the right to close PRs/issues that don't align with project goals after discussion.

Related: [`CODING_STANDARDS.md`](./CODING_STANDARDS.md), [`TESTING.md`](./TESTING.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)
