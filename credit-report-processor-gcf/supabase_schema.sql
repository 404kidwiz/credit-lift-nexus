-- Credit Reports Analysis Table Schema for Supabase
-- This table stores the results from the Google Cloud Function processing

-- Create the credit_reports_analysis table
CREATE TABLE IF NOT EXISTS credit_reports_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    extracted_text TEXT,
    parsed_data JSONB,
    violations JSONB,
    dispute_letter TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_user_id ON credit_reports_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_processed_at ON credit_reports_analysis(processed_at);
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_created_at ON credit_reports_analysis(created_at);

-- Create a GIN index for JSONB columns to enable efficient querying
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_parsed_data ON credit_reports_analysis USING GIN(parsed_data);
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_violations ON credit_reports_analysis USING GIN(violations);

-- Enable Row Level Security (RLS)
ALTER TABLE credit_reports_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own credit report analyses
CREATE POLICY "Users can view their own credit reports" ON credit_reports_analysis
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own credit report analyses (though typically done by GCF)
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

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_credit_reports_analysis_updated_at
    BEFORE UPDATE ON credit_reports_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easier querying of violation summaries
CREATE OR REPLACE VIEW credit_report_violation_summary AS
SELECT 
    id,
    user_id,
    processed_at,
    jsonb_array_length(COALESCE(violations, '[]'::jsonb)) as violation_count,
    jsonb_array_length(COALESCE(parsed_data->'accounts', '[]'::jsonb)) as account_count,
    jsonb_array_length(COALESCE(parsed_data->'inquiries', '[]'::jsonb)) as inquiry_count,
    parsed_data->'personal_info'->>'name' as consumer_name,
    CASE 
        WHEN jsonb_array_length(COALESCE(violations, '[]'::jsonb)) = 0 THEN 'No Violations'
        WHEN jsonb_array_length(COALESCE(violations, '[]'::jsonb)) <= 3 THEN 'Low Risk'
        WHEN jsonb_array_length(COALESCE(violations, '[]'::jsonb)) <= 7 THEN 'Medium Risk'
        ELSE 'High Risk'
    END as risk_level
FROM credit_reports_analysis;

-- Grant permissions for the view
GRANT SELECT ON credit_report_violation_summary TO authenticated;
GRANT SELECT ON credit_report_violation_summary TO service_role;

-- Add RLS to the view
ALTER VIEW credit_report_violation_summary SET (security_invoker = true);

COMMENT ON TABLE credit_reports_analysis IS 'Stores processed credit report data from Google Cloud Function';
COMMENT ON COLUMN credit_reports_analysis.pdf_url IS 'URL of the original PDF in Supabase Storage';
COMMENT ON COLUMN credit_reports_analysis.extracted_text IS 'Raw text extracted from PDF using Google Cloud Vision AI';
COMMENT ON COLUMN credit_reports_analysis.parsed_data IS 'Structured data parsed by Google Gemini AI';
COMMENT ON COLUMN credit_reports_analysis.violations IS 'FCRA and Metro2 violations detected by Google Gemini AI';
COMMENT ON COLUMN credit_reports_analysis.dispute_letter IS 'Generated dispute letter based on violations';
COMMENT ON VIEW credit_report_violation_summary IS 'Summary view of credit report violations and risk levels';
