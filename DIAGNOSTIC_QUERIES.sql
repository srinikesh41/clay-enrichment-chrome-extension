-- ============================================
-- DIAGNOSTIC QUERIES FOR ENRICHED_DATA TABLE
-- Run these in Supabase SQL Editor to debug issues
-- ============================================

-- Query 1: Check exact table structure
-- This shows ALL columns in the enriched_data table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'enriched_data'
ORDER BY
    ordinal_position;

-- Query 2: Check RLS policies
-- This shows what Row Level Security policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'enriched_data';

-- Query 3: Check foreign key constraints
-- This shows the relationship to auth.users
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name='enriched_data';

-- Query 4: Check if url and workflow columns exist
-- If this returns 0 rows, the columns don't exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'enriched_data'
  AND column_name IN ('url', 'workflow');

-- Query 5: View all data (last 10 rows) with user_id status
-- This shows what data actually exists
SELECT
    id,
    user_id,
    CASE
        WHEN user_id IS NULL THEN 'NULL (PROBLEM!)'
        ELSE 'Has UUID (GOOD)'
    END as user_id_status,
    name,
    title,
    org,
    created_at
FROM
    enriched_data
ORDER BY
    id DESC
LIMIT 10;

-- Query 6: Count rows by user_id status
-- This shows how many rows have NULL vs valid user_id
SELECT
    CASE
        WHEN user_id IS NULL THEN 'NULL user_id'
        ELSE 'Valid user_id'
    END as status,
    COUNT(*) as count
FROM
    enriched_data
GROUP BY
    CASE WHEN user_id IS NULL THEN 'NULL user_id' ELSE 'Valid user_id' END;

-- Query 7: Test INSERT permission for current user
-- Try to insert a test row (will fail if RLS is blocking)
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can get your user ID from: SELECT id FROM auth.users WHERE email = 'your_email@example.com';

-- First, get your user ID:
SELECT id, email FROM auth.users;

-- Then test insert (uncomment and replace YOUR_USER_ID):
-- INSERT INTO enriched_data (user_id, name, title, org, country, work_email)
-- VALUES ('YOUR_USER_ID_HERE', 'Test Name', 'Test Title', 'Test Org', 'Test Country', 'test@example.com')
-- RETURNING *;

-- Query 8: Check if Realtime is enabled
-- This shows if the table has Realtime replication enabled
SELECT
    schemaname,
    tablename,
    CASE
        WHEN tablename IN (
            SELECT tablename
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
        ) THEN 'ENABLED'
        ELSE 'DISABLED'
    END as realtime_status
FROM
    pg_tables
WHERE
    tablename = 'enriched_data';

-- ============================================
-- RECOMMENDED FIX QUERIES
-- ============================================

-- Fix 1: Ensure url and workflow columns exist
ALTER TABLE enriched_data
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS workflow TEXT;

-- Fix 2: Clean up rows with NULL user_id (old test data)
-- WARNING: This deletes data! Only run if you want to remove test data.
-- DELETE FROM enriched_data WHERE user_id IS NULL;

-- Fix 3: Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_enriched_data_user_id ON enriched_data(user_id);
CREATE INDEX IF NOT EXISTS idx_enriched_data_created_at ON enriched_data(created_at DESC);

-- ============================================
-- COMPLETE TABLE RECREATION (if needed)
-- ============================================
-- Only use this if the table is completely broken
-- WARNING: This will DELETE ALL DATA in enriched_data table!

-- DROP TABLE IF EXISTS enriched_data CASCADE;

-- CREATE TABLE enriched_data (
--   id BIGSERIAL PRIMARY KEY,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
--   request_id TEXT,
--   url TEXT,
--   workflow TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   name TEXT,
--   title TEXT,
--   org TEXT,
--   country TEXT,
--   work_email TEXT
-- );

-- ALTER TABLE enriched_data ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can insert own enriched data"
--   ON enriched_data FOR INSERT TO authenticated
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can view own enriched data"
--   ON enriched_data FOR SELECT TO authenticated
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can update own enriched data"
--   ON enriched_data FOR UPDATE TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can delete own enriched data"
--   ON enriched_data FOR DELETE TO authenticated
--   USING (auth.uid() = user_id);

-- CREATE INDEX idx_enriched_data_user_id ON enriched_data(user_id);
-- CREATE INDEX idx_enriched_data_created_at ON enriched_data(created_at DESC);
-- CREATE INDEX idx_enriched_data_request_id ON enriched_data(request_id);
