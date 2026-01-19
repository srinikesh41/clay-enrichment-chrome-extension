-- ============================================
-- FIX RLS TO ALLOW CLAY (SERVICE_ROLE) TO INSERT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'enriched_data';

-- Step 2: Disable FORCE (if enabled) so service_role can bypass RLS
ALTER TABLE enriched_data NO FORCE ROW LEVEL SECURITY;

-- Step 3: Keep RLS enabled for regular users
ALTER TABLE enriched_data ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old restrictive policies
DROP POLICY IF EXISTS "Users can insert own enriched data" ON enriched_data;
DROP POLICY IF EXISTS "Users and service can insert enriched data" ON enriched_data;

-- Step 5: Create new INSERT policy for authenticated users ONLY
-- (service_role will bypass this automatically)
CREATE POLICY "Authenticated users can insert own data"
  ON enriched_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Keep SELECT policy (users can only see their own data)
DROP POLICY IF EXISTS "Users can view own enriched data" ON enriched_data;
CREATE POLICY "Users can view own enriched data"
  ON enriched_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 7: Keep UPDATE policy
DROP POLICY IF EXISTS "Users can update own enriched data" ON enriched_data;
CREATE POLICY "Users can update own enriched data"
  ON enriched_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Keep DELETE policy
DROP POLICY IF EXISTS "Users can delete own enriched data" ON enriched_data;
CREATE POLICY "Users can delete own enriched data"
  ON enriched_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFY THE FIX
-- ============================================

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'enriched_data';

-- The INSERT policy should say "TO authenticated"
-- This means service_role bypasses it, regular users go through the policy
