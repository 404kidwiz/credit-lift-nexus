-- Migration to re-enable RLS for production
-- This enables proper security for the credit_reports_analysis table

-- Enable RLS on credit_reports_analysis table
ALTER TABLE credit_reports_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own credit report analyses
CREATE POLICY "Users can view their own credit reports" ON credit_reports_analysis
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own credit report analyses
CREATE POLICY "Users can insert their own credit reports" ON credit_reports_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own credit report analyses
CREATE POLICY "Users can update their own credit reports" ON credit_reports_analysis
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own credit report analyses
CREATE POLICY "Users can delete their own credit reports" ON credit_reports_analysis
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can perform all operations (for GCF)
CREATE POLICY "Service role can manage all credit reports" ON credit_reports_analysis
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE credit_reports_analysis IS 'RLS enabled for production - users can only access their own data'; 