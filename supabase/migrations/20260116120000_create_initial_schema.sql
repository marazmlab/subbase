-- =============================================
-- Migration: Initial Schema for Subbase MVP
-- Created: 2026-01-16
-- 
-- Purpose: Creates the foundational database schema for the Subbase
-- subscription tracking application.
--
-- Tables created:
--   - profiles: User profile data linked to Supabase Auth
--   - subscriptions: User subscription records
--
-- This migration also sets up:
--   - Indexes for query performance
--   - Functions for automatic timestamp updates
--   - Triggers for profile creation and timestamp management
--   - Row Level Security (RLS) policies for data isolation
-- =============================================

-- =============================================
-- 1. TABLES
-- =============================================

-- profiles table
-- Stores user profile data linked to Supabase Auth.
-- Created automatically via trigger when a new user registers.
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add comment to profiles table
comment on table profiles is 'User profiles linked to Supabase Auth. Auto-created on user registration.';

-- subscriptions table
-- Stores all subscription data for users.
create table subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    name text not null,
    cost numeric(10,2) not null check (cost > 0 and cost <= 100000),
    currency text not null default 'PLN',
    billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
    status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
    start_date date not null,
    next_billing_date date check (next_billing_date >= start_date),
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add comment to subscriptions table
comment on table subscriptions is 'User subscription records with billing and status information.';

-- =============================================
-- 2. INDEXES
-- =============================================

-- Index on user_id for subscriptions table
-- Critical for RLS policy performance and user subscription queries
create index subscriptions_user_id_idx on subscriptions(user_id);

-- =============================================
-- 3. FUNCTIONS
-- =============================================

-- Reusable function for updating updated_at timestamp
-- Used by triggers on profiles and subscriptions tables
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Function to create profile on user registration
-- SECURITY DEFINER is required because the trigger executes during user
-- registration when RLS policies would otherwise block the INSERT
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

-- =============================================
-- 4. TRIGGERS
-- =============================================

-- Auto-update updated_at for profiles
create trigger profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at_column();

-- Auto-update updated_at for subscriptions
create trigger subscriptions_updated_at
    before update on subscriptions
    for each row
    execute function update_updated_at_column();

-- Auto-create profile on user registration
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();

-- =============================================
-- 5. ROW-LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
-- Even if a table is intended for restricted access, RLS must be enabled
alter table profiles enable row level security;
alter table subscriptions enable row level security;

-- ---------------------------------------------
-- Policies for profiles table
-- ---------------------------------------------

-- SELECT policy for authenticated users
-- Users can only read their own profile
-- Note: INSERT/UPDATE/DELETE policies are not defined for profiles.
-- Profile creation is handled by a SECURITY DEFINER trigger,
-- and users cannot modify or delete their profiles directly.
create policy profiles_select_own on profiles
    for select
    to authenticated
    using (auth.uid() = id);

-- ---------------------------------------------
-- Policies for subscriptions table
-- ---------------------------------------------

-- SELECT policy for authenticated users
-- Users can only view their own subscriptions
create policy subscriptions_select_own on subscriptions
    for select
    to authenticated
    using (auth.uid() = user_id);

-- INSERT policy for authenticated users
-- Users can only create subscriptions for themselves
create policy subscriptions_insert_own on subscriptions
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- UPDATE policy for authenticated users
-- Users can only update their own subscriptions
-- Both USING and WITH CHECK ensure ownership before and after update
create policy subscriptions_update_own on subscriptions
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- DELETE policy for authenticated users
-- Users can only delete their own subscriptions
create policy subscriptions_delete_own on subscriptions
    for delete
    to authenticated
    using (auth.uid() = user_id);
