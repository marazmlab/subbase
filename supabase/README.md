# Supabase Database Setup

This directory contains the database schema and migrations for Subbase.

## Quick Start

### Option 1: Local Supabase (Recommended)

```bash
# Start local Supabase
npx supabase start

# Migrations will run automatically
# Your local database is now ready!
```

### Option 2: Remote Supabase

```bash
# Link to your remote project
npx supabase link --project-ref your-project-ref

# Push migrations to remote
npx supabase db push
```

## Database Schema

The database consists of two main tables:

### `profiles`
- Links 1:1 with `auth.users`
- Automatically created via trigger on user registration
- Contains minimal user profile data

### `subscriptions`
- Stores user subscription data
- Links to profiles via `user_id` foreign key
- Contains: name, cost, billing cycle, status, dates, description

## Migrations

Migrations are located in `supabase/migrations/`:

1. **`20260116120000_initial_schema.sql`**
   - Creates `profiles` and `subscriptions` tables
   - Sets up triggers for automatic profile creation
   - Configures Row Level Security (RLS) policies
   - Creates indexes for performance

2. **`20260116130000_disable_rls_policies.sql`**
   - Testing configuration (optional)
   - Temporarily disables RLS for E2E tests

## Useful Commands

```bash
# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# View status and credentials
npx supabase status

# Reset database (re-run all migrations)
npx supabase db reset

# Create a new migration
npx supabase migration new your_migration_name

# Open Supabase Studio (database UI)
# Visit http://127.0.0.1:54323 after starting Supabase
```

## Testing

For E2E tests, use the credentials from `.env.test`:

```bash
# E2E tests use a separate test database
npm run test:e2e
```

## Production Deployment

For production, use the hosted Supabase platform:

1. Create a project at [supabase.com](https://supabase.com)
2. Link your project: `npx supabase link`
3. Push migrations: `npx supabase db push`
4. Set environment variables in your hosting platform

## Security Notes

- RLS (Row Level Security) is enabled on all tables
- Users can only access their own data
- Profile creation is handled by secure triggers
- Anonymous users have no database access
