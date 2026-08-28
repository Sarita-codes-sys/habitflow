# API.md

# API Documentation — HabitFlow

**Base URL:** `https://api-habitflow.onrender.com/api`
**Content-Type:** `application/json`
**Auth Header:** `Authorization: Bearer <accessToken>` (required for all endpoints except `/auth/register` and `/auth/login`)

---

## Standard Error Response Format

```json
{
  "timestamp": "2026-07-23T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for field 'email'",
  "path": "/api/auth/register"
}
```

---

## 1. Authentication

### `POST /auth/register`
Registers a new user.

**Request:**
```json
{
  "email": "sam@example.com",
  "password": "SecurePass123!",
  "displayName": "Structured Sam"
}
```

**Response `201 Created`:**
```json
{
  "id": 1,
  "email": "sam@example.com",
  "displayName": "Structured Sam",
  "createdAt": "2026-07-23T10:00:00Z"
}
```

**Status Codes:** `201 Created`, `400 Bad Request` (validation), `409 Conflict` (email exists)

**Error Example (409):**
```json
{ "status": 409, "error": "Conflict", "message": "Email already registered" }
```

---

### `POST /auth/login`
Authenticates a user and returns tokens.

**Request:**
```json
{ "email": "sam@example.com", "password": "SecurePass123!" }
```

**Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 3600
}
```

**Status Codes:** `200 OK`, `401 Unauthorized` (invalid credentials)

---

### `POST /auth/refresh`
Issues a new access token using a valid refresh token.

**Request:**
```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response `200 OK`:**
```json
{ "accessToken": "eyJhbGciOi...", "expiresIn": 3600 }
```

**Status Codes:** `200 OK`, `401 Unauthorized` (expired/invalid refresh token)

---

### `POST /auth/logout`
Invalidates the current refresh token.

**Response:** `204 No Content`

---

## 2. Habits

### `GET /habits`
Returns all habits for the authenticated user.

**Query Params:** `?archived=false&category=Fitness`

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "name": "Morning Run",
    "category": "Fitness",
    "frequency": "DAILY",
    "archived": false,
    "currentStreak": 3,
    "longestStreak": 5
  }
]
```

---

### `POST /habits`
Creates a new habit.

**Request:**
```json
{
  "name": "Morning Run",
  "categoryId": 1,
  "frequency": "DAILY",
  "targetPerWeek": null
}
```

**Response `201 Created`:**
```json
{ "id": 1, "name": "Morning Run", "category": "Fitness", "frequency": "DAILY", "archived": false }
```

**Status Codes:** `201 Created`, `400 Bad Request`

---

### `PUT /habits/{id}`
Updates an existing habit.

**Request:**
```json
{ "name": "Evening Run", "frequency": "DAILY" }
```

**Response `200 OK`:** Updated habit object.

**Status Codes:** `200 OK`, `404 Not Found`, `403 Forbidden` (not owner)

---

### `DELETE /habits/{id}`
Deletes (or archives) a habit.

**Response:** `204 No Content`
**Status Codes:** `204 No Content`, `404 Not Found`

---

### `POST /habits/{id}/complete`
Marks a habit complete for a given date (defaults to today).

**Request:**
```json
{ "date": "2026-07-23" }
```

**Response `200 OK`:**
```json
{
  "habitId": 1,
  "completedDate": "2026-07-23",
  "currentStreak": 4,
  "longestStreak": 5
}
```

**Status Codes:** `200 OK`, `409 Conflict` (already completed), `404 Not Found`

**Error Example (409):**
```json
{ "status": 409, "error": "Conflict", "message": "Habit already completed for this date" }
```

---

### `DELETE /habits/{id}/complete`
Un-marks a completion for a given date (undo action).

**Request:**
```json
{ "date": "2026-07-23" }
```

**Response:** `204 No Content`

---

## 3. Analytics

### `GET /analytics/heatmap`
Returns completion data formatted for the heatmap calendar.

**Query Params:** `?year=2026&month=7`

**Response `200 OK`:**
```json
{
  "year": 2026,
  "month": 7,
  "days": [
    { "date": "2026-07-01", "completionRate": 1.0 },
    { "date": "2026-07-02", "completionRate": 0.5 }
  ]
}
```

---

### `GET /analytics/productivity-score`
Returns the user's current productivity score.

**Response `200 OK`:**
```json
{ "score": 78, "trend": "up", "comparedToLastWeek": 6 }
```

See [`ANALYTICS.md`](./ANALYTICS.md) for the scoring algorithm.

---

## 4. Reports

### `GET /reports/weekly`
Returns the weekly analytics report.

**Query Params:** `?weekStart=2026-07-14`

**Response `200 OK`:**
```json
{
  "weekStart": "2026-07-14",
  "weekEnd": "2026-07-20",
  "totalCompletions": 18,
  "totalPossible": 21,
  "completionRate": 0.857,
  "habitsBreakdown": [
    { "habitId": 1, "name": "Morning Run", "completions": 6, "possible": 7 }
  ]
}
```

---

### `GET /reports/monthly`
Returns the monthly analytics report. Same structure as weekly, scoped to a month.

**Status Codes (all report endpoints):** `200 OK`, `404 Not Found` (no data for range)

---

### `GET /reports/export`
Exports a report as PDF or CSV.

**Query Params:** `?type=monthly&format=pdf&month=2026-07`

**Response:** Binary file stream (`Content-Type: application/pdf` or `text/csv`)

**Status Codes:** `200 OK`, `400 Bad Request` (invalid format)

---

## 5. Insights

### `GET /insights`
Returns current rule-based AI insights for the user.

**Response `200 OK`:**
```json
[
  {
    "ruleId": "STREAK_RISK",
    "message": "Your 'Morning Run' streak may break — you haven't logged it in 2 days.",
    "generatedAt": "2026-07-23T08:00:00Z"
  },
  {
    "ruleId": "BEST_TIME",
    "message": "You complete 'Read 20 Pages' most consistently in the evenings.",
    "generatedAt": "2026-07-23T08:00:00Z"
  }
]
```

**Status Codes:** `200 OK` (empty array if insufficient data)

See [`AI_INSIGHTS.md`](./AI_INSIGHTS.md) for the rule engine.

---

## 6. Profile

### `GET /profile`
Returns the authenticated user's profile.

**Response `200 OK`:**
```json
{
  "id": 1,
  "email": "sam@example.com",
  "displayName": "Structured Sam",
  "themePreference": "DARK",
  "badgeCount": 4
}
```

---

### `PUT /profile`
Updates profile fields.

**Request:**
```json
{ "displayName": "Sam R.", "themePreference": "DARK" }
```

**Response `200 OK`:** Updated profile object.

---

### `PUT /profile/password`
Changes the user's password.

**Request:**
```json
{ "currentPassword": "OldPass123!", "newPassword": "NewPass456!" }
```

**Response:** `204 No Content`
**Status Codes:** `204 No Content`, `401 Unauthorized` (wrong current password)

---

## Global Error Responses

| Status | Meaning | Example Scenario |
|---|---|---|
| 400 | Bad Request | Validation failure on request body |
| 401 | Unauthorized | Missing/invalid/expired JWT |
| 403 | Forbidden | User doesn't own the resource |
| 404 | Not Found | Resource ID doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email, completion) |
| 429 | Too Many Requests | Rate limit exceeded (see [`SECURITY.md`](./SECURITY.md)) |
| 500 | Internal Server Error | Unhandled exception |

Related: [`SECURITY.md`](./SECURITY.md), [`BACKEND.md`](./BACKEND.md), [`ANALYTICS.md`](./ANALYTICS.md)
