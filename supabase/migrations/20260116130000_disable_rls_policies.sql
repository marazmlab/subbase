-- =============================================
-- Migration: Disable RLS Policies
-- Created: 2026-01-16
-- 
-- Purpose: Drops all RLS policies defined in the initial schema migration.
-- Note: RLS remains enabled on tables, but no policies restrict access.
-- =============================================

-- ---------------------------------------------
-- Drop policies for profiles table
-- ---------------------------------------------
drop policy if exists profiles_select_own on profiles;

-- ---------------------------------------------
-- Drop policies for subscriptions table
-- ---------------------------------------------
drop policy if exists subscriptions_select_own on subscriptions;
drop policy if exists subscriptions_insert_own on subscriptions;
drop policy if exists subscriptions_update_own on subscriptions;
drop policy if exists subscriptions_delete_own on subscriptions;

-- ---------------------------------------------
-- Disable RLS on all tables
-- ---------------------------------------------
alter table profiles disable row level security;
alter table subscriptions disable row level security;
