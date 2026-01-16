-- =============================================
-- MIGRATION: Initial Schema for Subbase MVP
-- =============================================
-- Purpose: Create the foundational database schema for subscription tracking application
-- Tables affected: profiles, subscriptions
-- Special notes:
--   - profiles table is linked 1:1 with auth.users via trigger
--   - All tables have RLS enabled with granular policies
--   - Timestamps are stored in UTC (TIMESTAMPTZ)
-- =============================================

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 profiles table
-- Purpose: Store user profile data linked to Supabase Auth
-- This table is automatically populated via trigger when a new user registers
-- The id column directly references auth.users(id) establishing a 1:1 relationship
-- -----------------------------------------------------------------------------
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add table comment for documentation
comment on table profiles is 'User profiles linked 1:1 with auth.users. Created automatically on user registration.';
comment on column profiles.id is 'User ID copied from auth.users - serves as both PK and FK';
comment on column profiles.created_at is 'Profile creation timestamp (UTC)';
comment on column profiles.updated_at is 'Last update timestamp (UTC), auto-updated via trigger';

-- -----------------------------------------------------------------------------
-- 1.2 subscriptions table
-- Purpose: Store all subscription data for users
-- Each subscription belongs to exactly one user (1:N relationship with profiles)
-- Cost is stored as NUMERIC to prevent floating-point precision issues
-- -----------------------------------------------------------------------------
create table subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    name text not null,
    -- NUMERIC(10,2) allows values up to 99,999,999.99 with 2 decimal places
    -- CHECK constraint ensures positive cost with reasonable upper limit
    cost numeric(10,2) not null check (cost > 0 and cost <= 100000),
    -- Currency code prepared for future multi-currency support
    currency text not null default 'PLN',
    -- Using CHECK constraint instead of ENUM for easier future modifications
    billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
    -- Status defaults to 'active' for new subscriptions
    status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
    start_date date not null,
    -- next_billing_date can be NULL for cancelled subscriptions
    next_billing_date date check (next_billing_date >= start_date),
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add table and column comments for documentation
comment on table subscriptions is 'User subscription records with billing cycle and status tracking';
comment on column subscriptions.id is 'Unique subscription identifier (auto-generated UUID)';
comment on column subscriptions.user_id is 'FK to profiles - subscription owner';
comment on column subscriptions.name is 'Subscription name (e.g., Netflix, Spotify)';
comment on column subscriptions.cost is 'Cost per billing cycle, max 100000, 2 decimal places';
comment on column subscriptions.currency is 'Currency code, defaults to PLN';
comment on column subscriptions.billing_cycle is 'Billing frequency: monthly or yearly';
comment on column subscriptions.status is 'Current status: active, paused, or cancelled';
comment on column subscriptions.start_date is 'Date when subscription started';
comment on column subscriptions.next_billing_date is 'Next payment date (NULL for cancelled)';
comment on column subscriptions.description is 'Optional notes about the subscription';

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Index on subscriptions.user_id
-- Purpose: Critical for RLS policy performance and user subscription queries
-- All queries filtering by user_id will benefit from this index
-- Note: Index on status column omitted due to low cardinality (only 3 values)
-- -----------------------------------------------------------------------------
create index subscriptions_user_id_idx on subscriptions(user_id);

-- =============================================================================
-- 3. FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 update_updated_at_column()
-- Purpose: Reusable trigger function for automatic updated_at timestamp updates
-- Used by: profiles, subscriptions tables
-- -----------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column() is 'Trigger function to auto-update updated_at column on row modification';

-- -----------------------------------------------------------------------------
-- 3.2 handle_new_user()
-- Purpose: Automatically create a profile when a new user registers in auth.users
-- Security: SECURITY DEFINER is required because the trigger executes during
--           user registration when RLS policies would otherwise block the INSERT
-- search_path is explicitly set to 'public' to prevent search_path injection attacks
-- -----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, created_at, updated_at)
    values (new.id, now(), now());
    return new;
end;
$$ language plpgsql;

comment on function handle_new_user() is 'Creates a profile record when a new user registers. Runs with SECURITY DEFINER to bypass RLS.';

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.1 Trigger for auto-updating profiles.updated_at
-- Fires BEFORE UPDATE to set the new timestamp before the row is written
-- -----------------------------------------------------------------------------
create trigger profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4.2 Trigger for auto-updating subscriptions.updated_at
-- Fires BEFORE UPDATE to set the new timestamp before the row is written
-- -----------------------------------------------------------------------------
create trigger subscriptions_updated_at
    before update on subscriptions
    for each row
    execute function update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4.3 Trigger for automatic profile creation on user registration
-- Fires AFTER INSERT on auth.users to create corresponding profile
-- -----------------------------------------------------------------------------
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();

-- =============================================================================
-- 5. ROW-LEVEL SECURITY (RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 Enable RLS on all tables
-- RLS MUST be enabled for security, even if policies are permissive
-- -----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table subscriptions enable row level security;

-- -----------------------------------------------------------------------------
-- 5.2 RLS Policies for profiles table
-- 
-- Access rules:
-- - Users can only SELECT their own profile
-- - INSERT is handled by SECURITY DEFINER trigger (no direct insert policy needed)
-- - UPDATE and DELETE are not permitted (profiles are managed by system)
-- - Anonymous users have no access to profiles
-- -----------------------------------------------------------------------------

-- Policy: Authenticated users can SELECT only their own profile
-- Rationale: Users need to read their profile data but should never see other users' profiles
create policy profiles_select_own_authenticated
    on profiles
    for select
    to authenticated
    using (auth.uid() = id);

comment on policy profiles_select_own_authenticated on profiles is 
    'Authenticated users can only read their own profile record';

-- Note: No INSERT policy - profile creation is handled by handle_new_user() trigger with SECURITY DEFINER
-- Note: No UPDATE policy - profile updates are not supported in MVP
-- Note: No DELETE policy - profile deletion cascades from auth.users deletion
-- Note: No policies for 'anon' role - anonymous users cannot access profiles

-- -----------------------------------------------------------------------------
-- 5.3 RLS Policies for subscriptions table
-- 
-- Access rules:
-- - Authenticated users have full CRUD on their own subscriptions
-- - Anonymous users have no access to subscriptions
-- - user_id must match auth.uid() for all operations
-- -----------------------------------------------------------------------------

-- Policy: Authenticated users can SELECT only their own subscriptions
-- Rationale: Subscription data is private and should only be visible to the owner
create policy subscriptions_select_own_authenticated
    on subscriptions
    for select
    to authenticated
    using (auth.uid() = user_id);

comment on policy subscriptions_select_own_authenticated on subscriptions is 
    'Authenticated users can only view their own subscriptions';

-- Policy: Authenticated users can INSERT subscriptions only for themselves
-- Rationale: Users can create subscriptions but only with their own user_id
-- Note: Application layer should always set user_id = auth.uid(), not accept from client input
create policy subscriptions_insert_own_authenticated
    on subscriptions
    for insert
    to authenticated
    with check (auth.uid() = user_id);

comment on policy subscriptions_insert_own_authenticated on subscriptions is 
    'Authenticated users can only create subscriptions for themselves (user_id must match auth.uid())';

-- Policy: Authenticated users can UPDATE only their own subscriptions
-- Rationale: Users can modify their subscriptions but cannot transfer ownership
-- Both USING and WITH CHECK ensure user_id matches before and after update
create policy subscriptions_update_own_authenticated
    on subscriptions
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

comment on policy subscriptions_update_own_authenticated on subscriptions is 
    'Authenticated users can only update their own subscriptions and cannot change ownership';

-- Policy: Authenticated users can DELETE only their own subscriptions
-- Rationale: Users can remove their own subscriptions
create policy subscriptions_delete_own_authenticated
    on subscriptions
    for delete
    to authenticated
    using (auth.uid() = user_id);

comment on policy subscriptions_delete_own_authenticated on subscriptions is 
    'Authenticated users can only delete their own subscriptions';

-- Note: No policies for 'anon' role - anonymous users cannot access subscriptions
-- This is intentional as subscription data requires authentication

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
