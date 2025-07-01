-- Credit Reports Analysis Table Schema for Supabase
-- This table stores the results from the Google Cloud Function processing

-- Create the credit_reports_analysis table
CREATE TABLE IF NOT EXISTS public.credit_reports_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    pdf_url TEXT NOT NULL,
    extracted_text TEXT,
    parsed_data JSONB,
    violations JSONB,
    dispute_letter TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_user_id ON public.credit_reports_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_processed_at ON public.credit_reports_analysis(processed_at);
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_created_at ON public.credit_reports_analysis(created_at);

-- Create a GIN index for JSONB columns to enable efficient querying
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_parsed_data ON public.credit_reports_analysis USING GIN(parsed_data);
CREATE INDEX IF NOT EXISTS idx_credit_reports_analysis_violations ON public.credit_reports_analysis USING GIN(violations);

-- Enable RLS
ALTER TABLE public.credit_reports_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow users to create their own analysis"
ON public.credit_reports_analysis FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to read their own analysis"
ON public.credit_reports_analysis FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own analysis"
ON public.credit_reports_analysis FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own analysis"
ON public.credit_reports_analysis FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.credit_reports_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

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
FROM public.credit_reports_analysis;

-- Grant permissions for the view
GRANT SELECT ON credit_report_violation_summary TO authenticated;
GRANT SELECT ON credit_report_violation_summary TO service_role;

-- Add RLS to the view
ALTER VIEW credit_report_violation_summary SET (security_invoker = true);

COMMENT ON TABLE public.credit_reports_analysis IS 'Stores processed credit report data from Google Cloud Function';
COMMENT ON COLUMN public.credit_reports_analysis.pdf_url IS 'URL of the original PDF in Supabase Storage';
COMMENT ON COLUMN public.credit_reports_analysis.extracted_text IS 'Raw text extracted from PDF using Google Cloud Vision AI';
COMMENT ON COLUMN public.credit_reports_analysis.parsed_data IS 'Structured data parsed by Google Gemini AI';
COMMENT ON COLUMN public.credit_reports_analysis.violations IS 'FCRA and Metro2 violations detected by Google Gemini AI';
COMMENT ON COLUMN public.credit_reports_analysis.dispute_letter IS 'Generated dispute letter based on violations';
COMMENT ON VIEW credit_report_violation_summary IS 'Summary view of credit report violations and risk levels'; 