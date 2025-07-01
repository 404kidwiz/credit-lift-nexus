-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('credit-reports', 'credit-reports')
ON CONFLICT (id) DO NOTHING;