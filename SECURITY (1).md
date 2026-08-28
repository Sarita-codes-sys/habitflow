# SECURITY.md

# Security — HabitFlow

## 1. Threat Model

| Asset | Threats | Mitigation |
|---|---|---|
| User credentials | Brute force, credential stuffing | Rate limiting, BCrypt hashing, account lockout |
| JWT tokens | Theft via XSS, replay attacks | Short-lived access tokens, httpOnly refresh cookie, token rotation |
| User habit data | Unauthorized access (IDOR) | Ownership checks on every resource access |
| Database | SQL injection | Parameterized queries via JPA/Hibernate |
| API endpoints | DoS, abuse | Rate limiting, request size limits |
| Personal data | Data breach | Encryption at rest/in transit, least-privilege DB access |

---

## 2. Authentication

- Email/password authentication with credentials verified against a BCrypt hash.
- Successful login issues a short-lived **access token** (JWT) and a longer-lived **refresh token**.
- Failed login attempts are rate-limited per IP and per account to mitigate brute-force attacks.

---

## 3. Authorization

- All habit/analytics/report resources are scoped to the authenticated user (`user_id` extracted from JWT claims, never trusted from client input).
- Method-level authorization enforced via Spring Security (`@PreAuthorize("#userId == authentication.principal.id")`).
- Ownership checks performed in the service layer before any read/write/delete operation to prevent Insecure Direct Object Reference (IDOR).

---

## 4. JWT Strategy

- **Access Token:** short-lived (15–60 minutes), sent in `Authorization: Bearer` header, stored in memory (not localStorage, to reduce XSS exposure).
- **Refresh Token:** longer-lived (7–30 days), stored in an `httpOnly`, `Secure`, `SameSite=Strict` cookie.
- Tokens are signed using HMAC-SHA256 (HS256) with a secret managed via environment variables, or RS256 with rotating key pairs for larger deployments.
- Refresh tokens are rotated on each use (old token invalidated) to limit replay attack windows.
- Token claims include `sub` (user ID), `iat`, `exp`, and a `jti` (unique token ID) for revocation support.

---

## 5. Password Hashing

- Passwords hashed with **BCrypt**, cost factor ≥ 12.
- Plaintext passwords are never logged, stored, or transmitted outside the initial HTTPS request.
- Password change/reset flows require re-authentication or a time-limited, single-use reset token.

---

## 6. CSRF

- Since HabitFlow uses stateless JWT auth (Bearer token in header, not cookies for primary auth), CSRF risk is minimal for the API itself.
- The refresh-token cookie is protected via `SameSite=Strict` and `httpOnly` flags to prevent cross-site submission.
- Spring Security's CSRF protection is explicitly disabled only for stateless JWT-authenticated endpoints, and retained for any cookie-based session use if introduced later.

---

## 7. CORS

- CORS is configured to allow only the known frontend origin(s) (e.g., `https://habitflow.vercel.app`, `http://localhost:5173` in development).
- Only required methods (`GET, POST, PUT, DELETE`) and headers (`Authorization, Content-Type`) are permitted.
- Wildcard (`*`) origins are never used in production.

---

## 8. SQL Injection Prevention

- All database access goes through Spring Data JPA / Hibernate, which uses parameterized queries by default.
- No raw string concatenation is used to build SQL/JPQL queries.
- Any native queries (if required) use named parameters (`:paramName`) rather than string interpolation.

---

## 9. XSS Prevention

- React escapes all rendered content by default, preventing injection via the DOM.
- `dangerouslySetInnerHTML` is avoided; any rich text rendering uses a sanitization library (e.g., DOMPurify) if ever required.
- API responses set `Content-Type: application/json` strictly, preventing content-type sniffing exploits.
- Content Security Policy (CSP) headers are configured to restrict script sources.

---

## 10. Rate Limiting

- Login and registration endpoints are rate-limited (e.g., 5 attempts per minute per IP) using a token-bucket algorithm (Bucket4j or API gateway-level limiting).
- General API endpoints are limited per authenticated user (e.g., 100 requests/minute) to prevent abuse.
- Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header.

---

## 11. Secrets Management

- Secrets (DB credentials, JWT signing keys, third-party API keys) are never committed to source control.
- Local development uses `.env` files (git-ignored); production uses the hosting platform's environment variable/secret manager (Render/Railway secrets, GitHub Actions encrypted secrets).
- JWT signing keys are rotated periodically; old keys retained briefly for token validation during rotation windows.

---

## 12. Logging

- Application logs exclude sensitive data: no passwords, raw JWTs, or full credit card/PII data in logs.
- Structured logging (JSON format) with correlation IDs per request for traceability.
- Authentication failures, authorization denials, and unusual access patterns are logged for audit purposes.

---

## 13. Monitoring

- Health check endpoint (`/actuator/health`) exposed for uptime monitoring.
- Error rate and latency monitored via APM tooling (e.g., Prometheus + Grafana, or hosted alternatives).
- Alerting configured for spikes in `401/403/429` responses, which may indicate an attack in progress.

---

## 14. OWASP Top 10 Mitigation Summary

| OWASP Risk | Mitigation |
|---|---|
| A01: Broken Access Control | Ownership checks, method-level `@PreAuthorize` |
| A02: Cryptographic Failures | BCrypt hashing, HTTPS enforced, secrets in env vars |
| A03: Injection | Parameterized JPA queries, input validation |
| A04: Insecure Design | Threat modeling during design phase, layered architecture |
| A05: Security Misconfiguration | Hardened Spring Security config, no default credentials |
| A06: Vulnerable Components | Automated dependency scanning (Dependabot/Snyk) |
| A07: Auth Failures | JWT expiry, rate limiting, account lockout |
| A08: Data Integrity Failures | Signed JWTs, CI/CD pipeline integrity checks |
| A09: Logging & Monitoring Failures | Structured logs, alerting on anomalies |
| A10: SSRF | No user-controlled outbound requests in current scope |

---

## 15. Security Checklist

- [ ] All endpoints require authentication except `/auth/register`, `/auth/login`, `/auth/refresh`
- [ ] Passwords hashed with BCrypt (cost ≥ 12)
- [ ] JWT access tokens expire within 60 minutes
- [ ] Refresh tokens stored in httpOnly, Secure cookies
- [ ] CORS restricted to known origins
- [ ] Rate limiting active on auth endpoints
- [ ] Dependency scanning enabled in CI
- [ ] HTTPS enforced (HSTS header set)
- [ ] No secrets committed to version control
- [ ] Input validation on all DTOs
- [ ] Ownership checks on all resource access
- [ ] Security headers set (CSP, X-Content-Type-Options, X-Frame-Options)

Related: [`API.md`](./API.md), [`BACKEND.md`](./BACKEND.md), [`DEPLOYMENT.md`](./DEPLOYMENT.md)
