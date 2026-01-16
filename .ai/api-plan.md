# REST API Plan — Subbase (MVP)

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Subscriptions | `subscriptions` | User's recurring subscription entries |
| AI Insights | — (ephemeral) | AI-generated insights based on subscription data |

**Note:** The `profiles` table is not exposed via API. Profiles are created automatically via database trigger when a user registers through Supabase Auth.

---

## 2. Endpoints

### 2.1 Subscriptions

#### GET /api/subscriptions

Retrieves all subscriptions for the authenticated user with pagination support.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `limit` | integer | No | 10 | Items per page (max: 100) |
| `status` | string | No | — | Filter by status: `active`, `paused`, `cancelled` |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Netflix",
      "cost": 43.00,
      "currency": "PLN",
      "billing_cycle": "monthly",
      "status": "active",
      "start_date": "2024-01-15",
      "next_billing_date": "2025-02-15",
      "description": "Standard plan",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 401 Unauthorized | Missing or invalid authentication token |
| 500 Internal Server Error | Database or server error |

---

#### GET /api/subscriptions/:id

Retrieves a single subscription by ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Subscription identifier |

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Netflix",
    "cost": 43.00,
    "currency": "PLN",
    "billing_cycle": "monthly",
    "status": "active",
    "start_date": "2024-01-15",
    "next_billing_date": "2025-02-15",
    "description": "Standard plan",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 Bad Request | Invalid UUID format |
| 401 Unauthorized | Missing or invalid authentication token |
| 404 Not Found | Subscription not found or not owned by user |
| 500 Internal Server Error | Database or server error |

---

#### POST /api/subscriptions

Creates a new subscription for the authenticated user.

**Request Body:**

```json
{
  "name": "Netflix",
  "cost": 43.00,
  "currency": "PLN",
  "billing_cycle": "monthly",
  "status": "active",
  "start_date": "2024-01-15",
  "next_billing_date": "2025-02-15",
  "description": "Standard plan"
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Non-empty string |
| `cost` | number | Yes | > 0 and ≤ 100000, max 2 decimal places |
| `currency` | string | No | Default: `PLN` |
| `billing_cycle` | string | Yes | `monthly` or `yearly` |
| `status` | string | No | `active`, `paused`, or `cancelled`. Default: `active` |
| `start_date` | string | Yes | ISO 8601 date format (YYYY-MM-DD) |
| `next_billing_date` | string | No | ISO 8601 date format, must be ≥ `start_date` |
| `description` | string | No | Optional notes |

**Response (201 Created):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Netflix",
    "cost": 43.00,
    "currency": "PLN",
    "billing_cycle": "monthly",
    "status": "active",
    "start_date": "2024-01-15",
    "next_billing_date": "2025-02-15",
    "description": "Standard plan",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 Bad Request | Validation error (invalid fields, constraints violated) |
| 401 Unauthorized | Missing or invalid authentication token |
| 500 Internal Server Error | Database or server error |

---

#### PUT /api/subscriptions/:id

Updates an existing subscription. Requires all fields to be provided.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Subscription identifier |

**Request Body:**

```json
{
  "name": "Netflix Premium",
  "cost": 63.00,
  "currency": "PLN",
  "billing_cycle": "monthly",
  "status": "active",
  "start_date": "2024-01-15",
  "next_billing_date": "2025-02-15",
  "description": "Upgraded to Premium"
}
```

**Field Validation:** Same as POST /api/subscriptions

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Netflix Premium",
    "cost": 63.00,
    "currency": "PLN",
    "billing_cycle": "monthly",
    "status": "active",
    "start_date": "2024-01-15",
    "next_billing_date": "2025-02-15",
    "description": "Upgraded to Premium",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2025-01-16T14:30:00Z"
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 Bad Request | Invalid UUID or validation error |
| 401 Unauthorized | Missing or invalid authentication token |
| 404 Not Found | Subscription not found or not owned by user |
| 500 Internal Server Error | Database or server error |

---

#### PATCH /api/subscriptions/:id

Partially updates an existing subscription. Only provided fields are updated.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Subscription identifier |

**Request Body (partial):**

```json
{
  "status": "cancelled",
  "next_billing_date": null
}
```

**Field Validation:** Same constraints as POST, but all fields are optional.

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Netflix",
    "cost": 43.00,
    "currency": "PLN",
    "billing_cycle": "monthly",
    "status": "cancelled",
    "start_date": "2024-01-15",
    "next_billing_date": null,
    "description": "Standard plan",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2025-01-16T14:30:00Z"
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 Bad Request | Invalid UUID or validation error |
| 401 Unauthorized | Missing or invalid authentication token |
| 404 Not Found | Subscription not found or not owned by user |
| 500 Internal Server Error | Database or server error |

---

#### DELETE /api/subscriptions/:id

Permanently deletes a subscription.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Subscription identifier |

**Response (204 No Content):**

No response body.

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 Bad Request | Invalid UUID format |
| 401 Unauthorized | Missing or invalid authentication token |
| 404 Not Found | Subscription not found or not owned by user |
| 500 Internal Server Error | Database or server error |

---

### 2.2 Subscription Summary

#### GET /api/subscriptions/summary

Returns calculated monthly and yearly cost totals for active subscriptions.

**Response (200 OK):**

```json
{
  "data": {
    "monthly_total": 256.97,
    "yearly_total": 3083.64,
    "currency": "PLN",
    "active_count": 6,
    "paused_count": 1,
    "cancelled_count": 2
  }
}
```

**Calculation Logic:**

- `monthly_total`: Sum of all active monthly subscriptions + (yearly subscriptions ÷ 12)
- `yearly_total`: (Sum of all active monthly subscriptions × 12) + yearly subscriptions
- Only subscriptions with `status = 'active'` are included in cost calculations
- All counts include subscriptions regardless of status

**Error Responses:**

| Code | Description |
|------|-------------|
| 401 Unauthorized | Missing or invalid authentication token |
| 500 Internal Server Error | Database or server error |

---

### 2.3 AI Insights

#### POST /api/ai/insights

Generates AI-powered insights based on the user's subscription data.

**Request Body:**

```json
{
  "subscription_ids": ["uuid1", "uuid2", "uuid3"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subscription_ids` | UUID[] | No | Specific subscriptions to analyze. If omitted, all active subscriptions are used. |

**Response (200 OK):**

```json
{
  "data": {
    "insights": [
      {
        "type": "observation",
        "message": "You have 3 streaming services totaling 110.98 PLN monthly."
      },
      {
        "type": "observation",
        "message": "Your yearly subscriptions cost 538.88 PLN, which is 45.00 PLN per month."
      }
    ],
    "generated_at": "2025-01-16T14:30:00Z",
    "subscription_count": 8
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 Bad Request | Invalid subscription_ids |
| 401 Unauthorized | Missing or invalid authentication token |
| 503 Service Unavailable | AI service temporarily unavailable |
| 500 Internal Server Error | Server error |

**Note:** When AI service is unavailable (503), the application should continue functioning. The frontend must handle this gracefully and inform the user that insights are temporarily unavailable.

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Auth** with JWT tokens for authentication.

**Implementation Details:**

1. **Token Acquisition:** Users obtain JWT tokens through Supabase Auth client SDK (login/register flows)
2. **Token Transmission:** Clients include the token in the `Authorization` header:
   ```
   Authorization: Bearer <supabase_jwt_token>
   ```
3. **Token Validation:** API endpoints validate tokens using Supabase's `@supabase/ssr` server-side client
4. **Session Handling:** Astro middleware extracts and validates the session for each request

### 3.2 Authorization

**Row-Level Security (RLS):**

All data access is enforced at the database level through Supabase RLS policies:

- Users can only SELECT their own subscriptions (`auth.uid() = user_id`)
- Users can only INSERT subscriptions for themselves (`auth.uid() = user_id`)
- Users can only UPDATE their own subscriptions (`auth.uid() = user_id`)
- Users can only DELETE their own subscriptions (`auth.uid() = user_id`)

**API-Level Enforcement:**

- All endpoints except public routes require a valid authentication token
- The `user_id` field is **never** accepted from client input during INSERT operations
- Server-side code always sets `user_id = auth.uid()` when creating subscriptions

### 3.3 Authentication Endpoints (Handled by Supabase Auth Client)

Authentication is managed client-side through Supabase Auth SDK:

- `supabase.auth.signUp()` — User registration
- `supabase.auth.signInWithPassword()` — Login
- `supabase.auth.signOut()` — Logout
- `supabase.auth.getSession()` — Get current session

These are not custom API endpoints but use Supabase's built-in authentication infrastructure.

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Subscription Fields

| Field | Validation Rules |
|-------|------------------|
| `name` | Required, non-empty string, max 255 characters |
| `cost` | Required, number > 0 and ≤ 100000, max 2 decimal places |
| `currency` | Optional, 3-character ISO currency code, default: `PLN` |
| `billing_cycle` | Required, must be `monthly` or `yearly` |
| `status` | Optional, must be `active`, `paused`, or `cancelled`, default: `active` |
| `start_date` | Required, valid ISO 8601 date (YYYY-MM-DD) |
| `next_billing_date` | Optional, valid ISO 8601 date, must be ≥ `start_date` when provided |
| `description` | Optional, max 1000 characters |

#### Pagination Parameters

| Parameter | Validation Rules |
|-----------|------------------|
| `page` | Integer ≥ 1, default: 1 |
| `limit` | Integer 1-100, default: 10 |
| `status` | Must be `active`, `paused`, or `cancelled` when provided |

### 4.2 Business Logic Implementation

#### Cost Calculation (GET /api/subscriptions/summary)

```typescript
// Monthly total calculation
const monthlyTotal = subscriptions
  .filter(s => s.status === 'active')
  .reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') {
      return sum + s.cost;
    } else {
      return sum + (s.cost / 12);
    }
  }, 0);

// Yearly total calculation
const yearlyTotal = subscriptions
  .filter(s => s.status === 'active')
  .reduce((sum, s) => {
    if (s.billing_cycle === 'yearly') {
      return sum + s.cost;
    } else {
      return sum + (s.cost * 12);
    }
  }, 0);
```

#### Server-Side User ID Assignment (POST /api/subscriptions)

```typescript
// Always set user_id from authenticated session, never from client input
const { data: { user } } = await supabase.auth.getUser();
const subscriptionData = {
  ...validatedInput,
  user_id: user.id  // Server-assigned, not from request body
};
```

### 4.3 Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "cost",
        "message": "Cost must be greater than 0"
      },
      {
        "field": "next_billing_date",
        "message": "Next billing date must be on or after start date"
      }
    ]
  }
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `INVALID_UUID` | 400 | Provided ID is not a valid UUID |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `NOT_FOUND` | 404 | Resource not found or access denied |
| `AI_SERVICE_UNAVAILABLE` | 503 | AI provider temporarily unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### 4.4 AI Insights Constraints

Per PRD requirements, AI insights must:

1. Be explicitly triggered by the user (POST request required)
2. Rely only on subscription metadata (name, cost, billing_cycle, status)
3. Provide high-level, conservative observations
4. Avoid assumptions about real usage or behavior
5. Avoid prescriptive recommendations or financial advice
6. Fail gracefully without blocking core functionality (return 503, not 500)

---

## 5. API Implementation Notes

### 5.1 Astro API Routes Structure

```
src/pages/api/
├── subscriptions/
│   ├── index.ts          # GET (list), POST (create)
│   ├── [id].ts           # GET, PUT, PATCH, DELETE (single subscription)
│   └── summary.ts        # GET (cost summary)
└── ai/
    └── insights.ts       # POST (generate insights)
```

### 5.2 Supabase Client Usage

- Use `supabase.auth.getUser()` to verify authentication
- Use the authenticated Supabase client for all database operations (RLS enforcement)
- Never use the service role key for user-facing operations

### 5.3 Response Headers

All API responses should include:

```
Content-Type: application/json
X-Request-Id: <uuid>  # For debugging and tracing
```

### 5.4 Rate Limiting Considerations

While not required for MVP, consider implementing:

- General API rate limit: 100 requests per minute per user
- AI insights endpoint: 10 requests per minute per user (due to external API costs)
