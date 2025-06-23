#!/bin/bash

# Deployment script for Credit Report Processor Google Cloud Function
# Make sure to replace the placeholder values with your actual configuration

# Configuration variables - UPDATE THESE
PROJECT_ID="your-gcp-project-id"
FUNCTION_NAME="process-credit-report"
REGION="us-central1"
SERVICE_ACCOUNT_EMAIL="your-service-account@your-project-id.iam.gserviceaccount.com"

# Environment variables - UPDATE THESE
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your_supabase_service_role_key"
GEMINI_API_KEY="your_gemini_api_key"

# Deploy the function
echo "Deploying Google Cloud Function: $FUNCTION_NAME"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

gcloud functions deploy $FUNCTION_NAME \
  --runtime python311 \
  --trigger-http \
  --entry-point process_credit_report \
  --allow-unauthenticated \
  --region $REGION \
  --project $PROJECT_ID \
  --timeout 540s \
  --memory 1GB \
  --set-env-vars SUPABASE_URL="$SUPABASE_URL",SUPABASE_KEY="$SUPABASE_KEY",GEMINI_API_KEY="$GEMINI_API_KEY" \
  --service-account $SERVICE_ACCOUNT_EMAIL

echo "Deployment complete!"
echo "Function URL will be displayed above."
echo ""
echo "To test the function, use:"
echo "curl -X POST -H \"Content-Type: application/json\" \\"
echo "-d '{\"pdf_url\": \"https://your-pdf-url.com/sample.pdf\", \"user_id\": \"test-user-123\"}' \\"
echo "https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME"
