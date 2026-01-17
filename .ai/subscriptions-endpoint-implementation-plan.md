# API Endpoint Implementation Plan: Subscriptions API

## 1. Endpoint Overview

The Subscriptions API module provides full CRUD functionality for managing user subscriptions. The API consists of the following endpoints:

- `GET /api/subscriptions` - List subscriptions with pagination and filtering
- `GET /api/subscriptions/:id` - Get single subscription
- `POST /api/subscriptions` - Create new subscription
- `PUT /api/subscriptions/:id` - Full subscription update
- `PATCH /api/subscriptions/:id` - Partial subscription update
- `DELETE /api/subscriptions/:id` - Delete subscription
- `GET /api/subscriptions/summary` - Cost summary
- `POST /api/ai/insights` - Generate AI insights

All endpoints require user authorization via Supabase Auth and operate exclusively on data belonging to the authenticated user.

---

## 2. Request Details

### 2.1 GET /api/subscriptions

**HTTP Method:** GET  
**URL Structure:** `/api/subscriptions`

**Query Parameters:**

- `page` (integer, optional, default: 1) - Page number, must be ≥ 1
- `limit` (integer, optional, default: 10) - Items per page, range: 1-100
- `status` (string, optional) - Filter by status, allowed values: `active`, `paused`, `cancelled`

### 2.2 GET /api/subscriptions/:id

**HTTP Method:** GET  
**URL Structure:** `/api/subscriptions/[id]`

**Path Parameters:**

- `id` (UUID, required) - Subscription identifier

### 2.3 POST /api/subscriptions

**HTTP Method:** POST  
**URL Structure:** `/api/subscriptions`

**Request Body:**

- `name` (string, required) - Subscription name, non-empty, max 255 characters
- `cost` (number, required) - Cost amount, must be > 0 and ≤ 100000, max 2 decimal places
- `currency` (string, optional, default: `PLN`) - ISO currency code
- `billing_cycle` (string, required) - Billing frequency, allowed values: `monthly` or `yearly`
- `status` (string, optional, default: `active`) - Subscription status, allowed values: `active`, `paused`, `cancelled`
- `start_date` (string, required) - Start date in ISO 8601 format (YYYY-MM-DD)
- `next_billing_date` (string, optional) - Next billing date in ISO 8601 format, must be ≥ `start_date`
- `description` (string, optional) - Additional notes, max 1000 characters

### 2.4 PUT /api/subscriptions/:id

**HTTP Method:** PUT  
**URL Structure:** `/api/subscriptions/[id]`

**Request Body:** All fields same as POST, but all are required (full replacement).

### 2.5 PATCH /api/subscriptions/:id

**HTTP Method:** PATCH  
**URL Structure:** `/api/subscriptions/[id]`

**Request Body:** Any fields from POST - only provided fields will be updated.

### 2.6 DELETE /api/subscriptions/:id

**HTTP Method:** DELETE  
**URL Structure:** `/api/subscriptions/[id]`

### 2.7 GET /api/subscriptions/summary

**HTTP Method:** GET  
**URL Structure:** `/api/subscriptions/summary`

No parameters.

### 2.8 POST /api/ai/insights

**HTTP Method:** POST  
**URL Structure:** `/api/ai/insights`

**Request Body:**

- `subscription_ids` (UUID[], optional) - List of subscription IDs to analyze. If omitted, all active subscriptions are analyzed.

---

## 3. Types Used

### 3.1 Existing Types from `src/types.ts`

**Literal Types:**

```typescript
type SubscriptionStatus = "active" | "paused" | "cancelled";
type BillingCycle = "monthly" | "yearly";
type ErrorCode = "VALIDATION_ERROR" | "INVALID_UUID" | "UNAUTHORIZED" | "NOT_FOUND" | "AI_SERVICE_UNAVAILABLE" | "INTERNAL_ERROR";
```

**Entity Types:**

```typescript
type SubscriptionEntity = Tables<"subscriptions">;
type ProfileEntity = Tables<"profiles">;
```

**Response DTOs:**

```typescript
type SubscriptionDTO = Omit<SubscriptionEntity, "user_id">;
interface SubscriptionResponseDTO { data: SubscriptionDTO; }
interface SubscriptionListResponseDTO { data: SubscriptionDTO[]; pagination: PaginationDTO; }
interface SubscriptionSummaryResponseDTO { data: SubscriptionSummaryDTO; }
interface AIInsightsResponseDTO { data: AIInsightsDataDTO; }
```

**Command Models:**

```typescript
interface CreateSubscriptionCommand { /* ... */ }
interface UpdateSubscriptionCommand { /* ... */ }
type PatchSubscriptionCommand = Partial<UpdateSubscriptionCommand>;
interface SubscriptionQueryParams { /* ... */ }
interface AIInsightsCommand { subscription_ids?: string[]; }
```

**Error Types:**

```typescript
interface ErrorResponseDTO { error: ErrorDetailDTO; }
interface ErrorDetailDTO { code: ErrorCode; message: string; details?: FieldErrorDTO[]; }
interface FieldErrorDTO { field: string; message: string; }
```

### 3.2 Zod Schemas to Create

Validation schemas to create in `src/lib/schemas/subscription.schema.ts`:

```typescript
// UUID validation schema
const uuidSchema = z.string().uuid();

// Query params for GET /api/subscriptions
const subscriptionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
});

// Create subscription command
const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(255),
  cost: z.number().positive().max(100000).multipleOf(0.01),
  currency: z.string().length(3).default("PLN"),
  billing_cycle: z.enum(["monthly", "yearly"]),
  status: z.enum(["active", "paused", "cancelled"]).default("active"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  next_billing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
}).refine(
  (data) => !data.next_billing_date || data.next_billing_date >= data.start_date,
  { message: "next_billing_date must be >= start_date", path: ["next_billing_date"] }
);

// Update subscription command (PUT - all fields required)
const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(255),
  cost: z.number().positive().max(100000).multipleOf(0.01),
  currency: z.string().length(3),
  billing_cycle: z.enum(["monthly", "yearly"]),
  status: z.enum(["active", "paused", "cancelled"]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  next_billing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  description: z.string().max(1000).nullable(),
}).refine(
  (data) => !data.next_billing_date || data.next_billing_date >= data.start_date,
  { message: "next_billing_date must be >= start_date", path: ["next_billing_date"] }
);

// Patch subscription command (PATCH - all fields optional)
const patchSubscriptionSchema = updateSubscriptionSchema.partial();

// AI insights command
const aiInsightsSchema = z.object({
  subscription_ids: z.array(z.string().uuid()).optional(),
});
```

---

## 4. Response Details

### 4.1 GET /api/subscriptions

**Status 200 OK:**

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

### 4.2 GET /api/subscriptions/:id, POST, PUT, PATCH

**Status 200/201:**

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

### 4.3 DELETE /api/subscriptions/:id

**Status 204 No Content:** No response body.

### 4.4 GET /api/subscriptions/summary

**Status 200 OK:**

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

### 4.5 POST /api/ai/insights

**Status 200 OK:**

```json
{
  "data": {
    "insights": [
      {
        "type": "observation",
        "message": "You have 3 streaming services totaling 110.98 PLN monthly."
      }
    ],
    "generated_at": "2025-01-16T14:30:00Z",
    "subscription_count": 8
  }
}
```

### 4.6 Error Responses

**Status 400 Bad Request:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "cost", "message": "Cost must be greater than 0" },
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

**Status 401 Unauthorized:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Status 404 Not Found:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Subscription not found"
  }
}
```

**Status 500 Internal Server Error:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Status 503 Service Unavailable (AI only):**

```json
{
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable"
  }
}
```

---

## 5. Data Flow

### 5.1 Data Flow Diagram for CRUD Operations

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Client    │────▶│   Astro     │────▶│ SubscriptionService │────▶│   Supabase   │
│  (Request)  │     │  Endpoint   │     │                     │     │   Database   │
└─────────────┘     └─────────────┘     └─────────────────────┘     └──────────────┘
                          │                        │
                          ▼                        ▼
                    ┌─────────────┐          ┌──────────────┐
                    │    Zod      │          │     RLS      │
                    │ Validation  │          │   Policies   │
                    └─────────────┘          └──────────────┘
```

### 5.2 Detailed Flow for POST /api/subscriptions

1. **Request** - Client sends POST request with subscription data
2. **Middleware** - Verifies authorization token, adds `supabase` to `context.locals`
3. **Endpoint Handler** - Receives request in `src/pages/api/subscriptions/index.ts`
4. **Validation** - Validates body using Zod schema (`createSubscriptionSchema`)
5. **Service Call** - Calls `SubscriptionService.create(userId, data)`
6. **Database Insert** - Supabase insert with automatic `user_id`
7. **DTO Mapping** - Maps `SubscriptionEntity` → `SubscriptionDTO` (removes `user_id`)
8. **Response** - Returns 201 Created with created subscription

### 5.3 Flow for GET /api/subscriptions/summary

1. **Request** - Client sends GET request
2. **Authorization** - User verification
3. **Service Call** - Calls `SummaryService.calculate(userId)`
4. **Database Query** - Fetches all user subscriptions
5. **Calculation Logic:**
   - `monthly_total = SUM(active monthly costs) + SUM(yearly costs / 12)`
   - `yearly_total = SUM(active monthly costs * 12) + SUM(yearly costs)`
   - Counts subscriptions by status
6. **Response** - Returns 200 OK with summary

### 5.4 Flow for POST /api/ai/insights

1. **Request** - Client sends request with optional `subscription_ids`
2. **Authorization** - User verification
3. **Fetch Subscriptions** - Fetches subscriptions (all active or selected)
4. **Validation** - Verifies all `subscription_ids` belong to user
5. **AI Service Call** - Sends data to Openrouter.ai
6. **Parse Response** - Parses AI response
7. **Response** - Returns 200 OK with insights or 503 if AI unavailable

---

## 6. Security Considerations

### 6.1 Authentication

- All endpoints require a valid JWT token from Supabase Auth
- Token passed in `Authorization: Bearer <token>` header
- Middleware verifies token and sets `supabase` in `context.locals`

### 6.2 Authorization

- **Row Level Security (RLS)** in Supabase ensures users only access their own subscriptions
- Additional `user_id` verification in service layer as defense-in-depth
- Each endpoint verifies the resource belongs to the authenticated user

### 6.3 Input Validation

- All input data validated by Zod before processing
- UUID validated before database queries
- Numeric parameters checked for valid ranges
- Dates validated for format and relationships

### 6.4 Data Protection

- `user_id` is **never** exposed in API responses
- Sensitive data is not logged
- Rate limiting at middleware level (optional)

### 6.5 SQL Injection Prevention

- Using Supabase client with parameterized queries
- No direct string concatenation in queries

---

## 7. Error Handling

### 7.1 Error Codes

**HTTP 400 - VALIDATION_ERROR**
- Invalid input data, Zod validation errors

**HTTP 400 - INVALID_UUID**
- Invalid UUID format in path parameters

**HTTP 401 - UNAUTHORIZED**
- Missing token, invalid token, expired session

**HTTP 404 - NOT_FOUND**
- Resource does not exist or does not belong to user

**HTTP 500 - INTERNAL_ERROR**
- Database errors, unexpected exceptions

**HTTP 503 - AI_SERVICE_UNAVAILABLE**
- AI service temporarily unavailable

### 7.2 Error Handling Strategy

```typescript
// src/lib/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: FieldErrorDTO[]
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return new Response(JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }), { status: error.statusCode });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  return new Response(JSON.stringify({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }), { status: 500 });
}
```

### 7.3 Zod Error Mapping

```typescript
function mapZodErrors(error: ZodError): FieldErrorDTO[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
}
```

---

## 8. Performance Considerations

### 8.1 Pagination

- Implement cursor-based pagination for large datasets (optional for future)
- Default limit 10, maximum limit 100
- Index on `user_id` column for fast filtering

### 8.2 Database Indexes

Recommended indexes:

```sql
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_user_created ON subscriptions(user_id, created_at DESC);
```

### 8.3 Caching

- Cache at summary endpoint level (optional)
- Cache invalidation on any subscription change
- TTL: 5 minutes for summary

### 8.4 AI Insights Optimization

- Timeout for AI service: 30 seconds
- Graceful degradation when AI is unavailable
- Batch processing for multiple subscriptions

---

## 9. Implementation Steps

### Phase 1: Infrastructure Setup

#### 1.1 Create Zod Validation Schemas

**File:** `src/lib/schemas/subscription.schema.ts`

- [ ] Schema for query params (`subscriptionQuerySchema`)
- [ ] Schema for subscription creation (`createSubscriptionSchema`)
- [ ] Schema for subscription update (`updateSubscriptionSchema`)
- [ ] Schema for partial update (`patchSubscriptionSchema`)
- [ ] Schema for UUID validation (`uuidSchema`)
- [ ] Schema for AI insights (`aiInsightsSchema`)

#### 1.2 Create Error Handling Class

**File:** `src/lib/errors.ts`

- [ ] `ApiError` class with fields: `statusCode`, `code`, `message`, `details`
- [ ] `handleApiError()` function for error transformation
- [ ] `mapZodErrors()` function for validation error mapping

---

### Phase 2: Service Layer

#### 2.1 SubscriptionService

**File:** `src/lib/services/subscription.service.ts`

- [ ] `list(supabase, userId, params)` - fetch list with pagination
- [ ] `getById(supabase, userId, id)` - fetch single subscription
- [ ] `create(supabase, userId, data)` - create subscription
- [ ] `update(supabase, userId, id, data)` - full update
- [ ] `patch(supabase, userId, id, data)` - partial update
- [ ] `delete(supabase, userId, id)` - delete subscription
- [ ] Helper `toDTO(entity)` - map entity → DTO

#### 2.2 SummaryService

**File:** `src/lib/services/summary.service.ts`

- [ ] `calculate(supabase, userId)` - calculate summary
- [ ] Calculation logic: monthly_total, yearly_total
- [ ] Count subscriptions by status

#### 2.3 AIInsightsService

**File:** `src/lib/services/ai-insights.service.ts`

- [ ] `generateInsights(supabase, userId, subscriptionIds?)` - generate insights
- [ ] Integration with Openrouter.ai
- [ ] Graceful handling for 503

---

### Phase 3: API Endpoints

#### 3.1 Subscriptions CRUD

**File:** `src/pages/api/subscriptions/index.ts`

- [ ] `GET` handler - list subscriptions
- [ ] `POST` handler - create subscription
- [ ] `export const prerender = false`

**File:** `src/pages/api/subscriptions/[id].ts`

- [ ] `GET` handler - single subscription
- [ ] `PUT` handler - full update
- [ ] `PATCH` handler - partial update
- [ ] `DELETE` handler - delete
- [ ] `export const prerender = false`

#### 3.2 Summary Endpoint

**File:** `src/pages/api/subscriptions/summary.ts`

- [ ] `GET` handler - summary
- [ ] `export const prerender = false`

#### 3.3 AI Insights Endpoint

**File:** `src/pages/api/ai/insights.ts`

- [ ] `POST` handler - generate insights
- [ ] `export const prerender = false`

---

### Phase 4: Middleware and Integration

#### 4.1 Update Middleware

**File:** `src/middleware/index.ts`

- [ ] Token verification for `/api/*` paths
- [ ] Set `context.locals.supabase`
- [ ] Set `context.locals.user`
- [ ] Handle 401 for unauthorized requests

---

### Phase 5: Testing

#### 5.1 Unit Tests

- [ ] Zod schema tests (valid/invalid data validation)
- [ ] Summary calculation function tests
- [ ] DTO mapping tests

#### 5.2 Integration Tests

- [ ] CRUD endpoint tests
- [ ] Authorization tests (access to other users' resources)
- [ ] Pagination tests
- [ ] Error handling tests

---

### Phase 6: Documentation and Finalization

#### 6.1 Documentation Updates

- [ ] Update README with API information
- [ ] Document environment variables
- [ ] API usage examples

#### 6.2 Code Review Checklist

- [ ] All endpoints have `export const prerender = false`
- [ ] All input data is validated by Zod
- [ ] `user_id` is not exposed in any response
- [ ] Errors are handled according to established structure
- [ ] Supabase is used from `context.locals`, not from direct import
