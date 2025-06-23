# Supabase Storage Webhook Setup Guide

This guide explains how to set up Supabase Storage webhooks to automatically trigger the Google Cloud Function when a new PDF credit report is uploaded.

## 🎯 Overview

The webhook will:
1. Monitor your Supabase Storage bucket for new PDF uploads
2. Automatically trigger the Google Cloud Function
3. Pass the PDF URL and user information to the function
4. Enable real-time processing of credit reports

## 🔧 Setup Methods

### Method 1: Supabase Dashboard (Recommended)

1. **Navigate to Webhooks**
   - Go to your Supabase project dashboard
   - Navigate to `Database` → `Webhooks`
   - Click `Create a new hook`

2. **Configure the Webhook**
   ```
   Name: Credit Report Processor
   Table: storage.objects
   Events: INSERT
   Type: HTTP Request
   HTTP Method: POST
   URL: https://REGION-PROJECT_ID.cloudfunctions.net/process-credit-report
   ```

3. **Add HTTP Headers** (Optional but recommended for security)
   ```
   Content-Type: application/json
   Authorization: Bearer YOUR_WEBHOOK_SECRET
   ```

4. **Configure Conditions** (Optional - filter for PDF files only)
   ```sql
   -- Only trigger for PDF files in credit-reports bucket
   NEW.bucket_id = 'credit-reports' AND 
   NEW.name LIKE '%.pdf'
   ```

### Method 2: Database Function (Advanced)

Create a database function that triggers on storage events:

```sql
-- Create a function to call the GCF
CREATE OR REPLACE FUNCTION trigger_credit_report_processing()
RETURNS TRIGGER AS $$
DECLARE
    pdf_url TEXT;
    user_id UUID;
    response TEXT;
BEGIN
    -- Only process PDF files in the credit-reports bucket
    IF NEW.bucket_id = 'credit-reports' AND NEW.name LIKE '%.pdf' THEN
        
        -- Extract user_id from the file path (assuming format: user_id/filename.pdf)
        user_id := split_part(NEW.name, '/', 1)::UUID;
        
        -- Construct the public URL for the PDF
        pdf_url := 'https://your-project.supabase.co/storage/v1/object/public/credit-reports/' || NEW.name;
        
        -- Call the Google Cloud Function using HTTP
        SELECT content INTO response
        FROM http((
            'POST',
            'https://REGION-PROJECT_ID.cloudfunctions.net/process-credit-report',
            ARRAY[http_header('Content-Type', 'application/json')],
            'application/json',
            json_build_object(
                'pdf_url', pdf_url,
                'user_id', user_id
            )::text
        ));
        
        -- Log the response (optional)
        RAISE NOTICE 'GCF Response: %', response;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER on_credit_report_upload
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION trigger_credit_report_processing();
```

**Note**: This method requires the `http` extension to be enabled in your Supabase project.

### Method 3: Edge Function (Supabase Edge Functions)

Create a Supabase Edge Function that acts as a middleman:

```typescript
// supabase/functions/process-credit-report-trigger/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Only process PDF files in credit-reports bucket
    if (record.bucket_id === 'credit-reports' && record.name.endsWith('.pdf')) {
      
      // Extract user_id from file path
      const userId = record.name.split('/')[0]
      const pdfUrl = `https://your-project.supabase.co/storage/v1/object/public/credit-reports/${record.name}`
      
      // Call Google Cloud Function
      const response = await fetch('https://REGION-PROJECT_ID.cloudfunctions.net/process-credit-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_url: pdfUrl,
          user_id: userId
        })
      })
      
      const result = await response.json()
      
      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { "Content-Type": "application/json" } }
      )
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Not a credit report PDF' }),
      { headers: { "Content-Type": "application/json" } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

## 🔒 Security Considerations

### 1. Webhook Authentication

Add a secret token to authenticate webhook requests:

```typescript
// In your GCF main.py, add verification
const WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")

@functions_framework.http
def process_credit_report(request):
    # Verify webhook secret
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer ') or auth_header[7:] != WEBHOOK_SECRET:
        return json.dumps({"status": "error", "message": "Unauthorized"}), 401
    
    # Continue with processing...
```

### 2. Storage Security

Ensure your storage bucket has proper RLS policies:

```sql
-- Only allow users to upload to their own folder
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'credit-reports' AND 
    auth.uid()::text = split_part(name, '/', 1)
);

-- Only allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'credit-reports' AND 
    auth.uid()::text = split_part(name, '/', 1)
);
```

## 📊 Monitoring & Debugging

### 1. Webhook Logs

Monitor webhook execution in Supabase:
- Go to `Database` → `Webhooks`
- Click on your webhook
- View the `Logs` tab for execution history

### 2. Google Cloud Function Logs

Monitor GCF execution:
```bash
gcloud functions logs read process-credit-report --limit 50
```

### 3. Testing Webhooks

Test your webhook manually:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "pdf_url": "https://your-project.supabase.co/storage/v1/object/public/credit-reports/test-user/sample.pdf",
    "user_id": "test-user-uuid"
  }' \
  https://REGION-PROJECT_ID.cloudfunctions.net/process-credit-report
```

## 🔄 Frontend Integration

Update your React upload component to work with the webhook:

```typescript
// In your upload component
const handleUpload = async (file: File) => {
  const user = supabase.auth.user()
  if (!user) return
  
  // Upload to storage with user_id prefix
  const fileName = `${user.id}/${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('credit-reports')
    .upload(fileName, file)
  
  if (error) {
    console.error('Upload failed:', error)
    return
  }
  
  // The webhook will automatically trigger processing
  // You can show a "Processing..." message and poll for results
  console.log('File uploaded, processing will begin automatically')
  
  // Optional: Poll for results
  pollForResults(user.id)
}

const pollForResults = async (userId: string) => {
  const maxAttempts = 30 // 5 minutes with 10-second intervals
  let attempts = 0
  
  const poll = async () => {
    const { data } = await supabase
      .from('credit_reports_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (data && data.length > 0) {
      // Processing complete
      console.log('Processing complete:', data[0])
      return data[0]
    }
    
    attempts++
    if (attempts < maxAttempts) {
      setTimeout(poll, 10000) // Check again in 10 seconds
    } else {
      console.log('Polling timeout - check function logs')
    }
  }
  
  poll()
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Triggering**
   - Check webhook configuration in Supabase dashboard
   - Verify the table/event conditions
   - Check Supabase webhook logs

2. **GCF Not Receiving Requests**
   - Verify the GCF URL is correct
   - Check GCF permissions (allow unauthenticated)
   - Review GCF logs for errors

3. **Authentication Errors**
   - Verify webhook secret configuration
   - Check HTTP headers in webhook setup

4. **File Access Issues**
   - Ensure storage bucket is publicly readable or use signed URLs
   - Check RLS policies on storage.objects

### Debug Steps

1. **Test the GCF directly** with curl
2. **Check Supabase webhook logs** for execution status
3. **Review GCF logs** in Google Cloud Console
4. **Verify storage permissions** and file accessibility

## 📋 Checklist

- [ ] Google Cloud Function deployed and accessible
- [ ] Supabase webhook configured
- [ ] Storage bucket permissions set up
- [ ] Database schema created
- [ ] Authentication/security configured
- [ ] Frontend updated to handle automatic processing
- [ ] Monitoring and logging set up
- [ ] Testing completed

## 🔗 Related Documentation

- [Supabase Webhooks Documentation](https://supabase.com/docs/guides/database/webhooks)
- [Google Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
