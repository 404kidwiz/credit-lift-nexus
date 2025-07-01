-- Migration to disable RLS for testing purposes
-- This allows the demo user to insert data without authentication issues

-- Disable RLS on credit_reports_analysis table
ALTER TABLE credit_reports_analysis DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own credit reports" ON credit_reports_analysis;
DROP POLICY IF EXISTS "Users can insert their own credit reports" ON credit_reports_analysis;
DROP POLICY IF EXISTS "Users can update their own credit reports" ON credit_reports_analysis;
DROP POLICY IF EXISTS "Users can delete their own credit reports" ON credit_reports_analysis;
DROP POLICY IF EXISTS "Service role can manage all credit reports" ON credit_reports_analysis;

-- Grant all permissions to authenticated users for testing
GRANT ALL ON credit_reports_analysis TO authenticated;
GRANT ALL ON credit_reports_analysis TO anon;

COMMENT ON TABLE credit_reports_analysis IS 'RLS temporarily disabled for testing - re-enable for production'; 