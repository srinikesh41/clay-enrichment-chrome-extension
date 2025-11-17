-- ============================================
-- SUPABASE AUTH SETUP
-- Run these commands in Supabase SQL Editor
-- ============================================

-- Step 1: Enable Row Level Security (RLS) on existing table
-- ============================================

ALTER TABLE enriched_data ENABLE ROW LEVEL SECURITY;

-- Step 2: Add user_id column to existing table
-- ============================================

ALTER TABLE enriched_data
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Create index on user_id for better performance
-- ============================================

CREATE INDEX idx_enriched_data_user_id ON enriched_data(user_id);

-- Step 4: Create RLS Policies for enriched_data
-- ============================================

-- Policy: Users can only INSERT their own data
CREATE POLICY "Users can insert own enriched data"
ON enriched_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only SELECT their own data
CREATE POLICY "Users can view own enriched data"
ON enriched_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own data
CREATE POLICY "Users can update own enriched data"
ON enriched_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own data
CREATE POLICY "Users can delete own enriched data"
ON enriched_data
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Create account_research_data table (with auth from the start)
-- ============================================

CREATE TABLE IF NOT EXISTS account_research_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id TEXT NOT NULL,
  url TEXT,
  workflow TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Add your account research fields here
  -- These will be populated by Clay
  company_name TEXT,
  industry TEXT,
  employee_count TEXT,
  revenue TEXT,
  location TEXT,
  website TEXT,
  description TEXT
);

-- Enable RLS on account_research_data
ALTER TABLE account_research_data ENABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX idx_account_research_data_user_id ON account_research_data(user_id);
CREATE INDEX idx_account_research_data_request_id ON account_research_data(request_id);

-- RLS Policies for account_research_data
CREATE POLICY "Users can insert own account research"
ON account_research_data FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own account research"
ON account_research_data FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account research"
ON account_research_data FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own account research"
ON account_research_data FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Create lead_research_data table (with auth from the start)
-- ============================================

CREATE TABLE IF NOT EXISTS lead_research_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id TEXT NOT NULL,
  url TEXT,
  workflow TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Add your lead research fields here
  -- These will be populated by Clay
  name TEXT,
  title TEXT,
  org TEXT,
  country TEXT,
  work_email TEXT,
  linkedin_url TEXT,
  phone TEXT,
  seniority_level TEXT
);

-- Enable RLS on lead_research_data
ALTER TABLE lead_research_data ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_lead_research_data_user_id ON lead_research_data(user_id);
CREATE INDEX idx_lead_research_data_request_id ON lead_research_data(request_id);

-- RLS Policies for lead_research_data
CREATE POLICY "Users can insert own lead research"
ON lead_research_data FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own lead research"
ON lead_research_data FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own lead research"
ON lead_research_data FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead research"
ON lead_research_data FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Step 7: Enable Realtime for all tables
-- ============================================
-- Note: You may need to do this in the Supabase Dashboard
-- Go to Database > Replication and enable for these tables:
-- - enriched_data
-- - account_research_data
-- - lead_research_data

-- Step 8: Verify RLS is working
-- ============================================
-- After running these commands, test by:
-- 1. Sign up as a test user
-- 2. Try to insert data
-- 3. Verify you can only see your own data
-- 4. Sign up as another user
-- 5. Verify users can't see each other's data

-- ============================================
-- MIGRATION NOTE FOR EXISTING DATA
-- ============================================
-- If you have existing data in enriched_data without user_id,
-- you'll need to either:
-- 1. Delete it: DELETE FROM enriched_data WHERE user_id IS NULL;
-- 2. Or assign it to a test user:
--    UPDATE enriched_data SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;

-- ============================================
-- COMPLETE!
-- Next steps:
-- 1. Enable Email Auth in Supabase Dashboard (Authentication > Providers)
-- 2. Optional: Enable Google OAuth if desired
-- 3. Move to Phase 2: Build the auth UI in the extension
-- ============================================
