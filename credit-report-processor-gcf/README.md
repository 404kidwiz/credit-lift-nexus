# Credit Report Processor - Google Cloud Function

A Google Cloud Function that processes PDF credit reports using Google Cloud Vision AI for OCR, Google Gemini for AI analysis, and stores results in Supabase.

## 🚀 Features

- **OCR Processing**: Extract text from PDF credit reports using Google Cloud Vision AI
- **AI Analysis**: Parse credit report data and detect FCRA/Metro2 violations using Google Gemini
- **Dispute Letter Generation**: Automatically generate dispute letters based on detected violations
- **Supabase Integration**: Store processed data in your Supabase PostgreSQL database
- **Comprehensive Logging**: Detailed logging for monitoring and debugging

## 📁 Project Structure

```
credit-report-processor-gcf/
├── main.py                 # Main Google Cloud Function entry point
├── requirements.txt        # Python dependencies
├── deploy.sh              # Deployment script
├── test_local.py          # Local testing script
├── env_template.txt       # Environment variables template
├── supabase_schema.sql    # Database schema for Supabase
└── README.md             # This file
```

## 🛠️ Prerequisites

### Google Cloud Setup
1. **Google Cloud Project**: Create or select a GCP project
2. **Enable APIs**:
   ```bash
   gcloud services enable cloudfunctions.googleapis.com
   gcloud services enable vision.googleapis.com
   gcloud services enable generativelanguage.googleapis.com
   ```
3. **Service Account**: Create a service account with the following roles:
   - Cloud Functions Invoker
   - Cloud Vision AI User
   - Storage Object Viewer (if accessing GCS)

### API Keys
1. **Google Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Supabase**: Service role key from your Supabase project

### Supabase Setup
1. Run the SQL schema from `supabase_schema.sql` in your Supabase SQL editor
2. Ensure your storage bucket allows the appropriate access for PDF files

## 🔧 Local Development

### 1. Install Dependencies
```bash
cd credit-report-processor-gcf
pip install -r requirements.txt
```

### 2. Environment Setup
Create a `.env` file based on `env_template.txt`:
```bash
cp env_template.txt .env
# Edit .env with your actual credentials
```

### 3. Run Locally
```bash
functions-framework --target process_credit_report --debug
```

### 4. Test Locally
```bash
python test_local.py
```

## 🚀 Deployment

### 1. Configure Deployment Script
Edit `deploy.sh` and update the configuration variables:
```bash
PROJECT_ID="your-gcp-project-id"
FUNCTION_NAME="process-credit-report"
REGION="us-central1"
SERVICE_ACCOUNT_EMAIL="your-service-account@your-project-id.iam.gserviceaccount.com"
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your_supabase_service_role_key"
GEMINI_API_KEY="your_gemini_api_key"
```

### 2. Deploy to Google Cloud
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Test Deployed Function
```bash
python test_local.py https://REGION-PROJECT_ID.cloudfunctions.net/FUNCTION_NAME
```

## 📊 API Usage

### Request Format
```json
{
  "pdf_url": "https://your-supabase-storage-url/credit-report.pdf",
  "user_id": "user-uuid-from-supabase-auth"
}
```

### Response Format (Success)
```json
{
  "status": "success",
  "message": "Credit report processed successfully",
  "data": [
    {
      "id": "analysis-uuid",
      "user_id": "user-uuid",
      "pdf_url": "storage-url",
      "processed_at": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "violations_found": 3,
    "accounts_analyzed": 5,
    "inquiries_found": 2
  }
}
```

### Response Format (Error)
```json
{
  "status": "error",
  "message": "Error description"
}
```

## 🗄️ Database Schema

The function stores results in the `credit_reports_analysis` table:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| pdf_url | TEXT | Original PDF URL |
| extracted_text | TEXT | OCR extracted text |
| parsed_data | JSONB | Structured credit report data |
| violations | JSONB | Detected FCRA/Metro2 violations |
| dispute_letter | TEXT | Generated dispute letter |
| processed_at | TIMESTAMP | Processing timestamp |

## 🔗 Supabase Integration

### Webhook Setup
1. Go to your Supabase project dashboard
2. Navigate to Storage → Webhooks
3. Create a new webhook:
   - **Event**: `object.created`
   - **URL**: Your deployed Cloud Function URL
   - **Headers**: Add authentication if needed

### Frontend Integration
Query processed results in your React app:
```typescript
const { data: analyses } = await supabase
  .from('credit_reports_analysis')
  .select('*')
  .eq('user_id', user.id)
  .order('processed_at', { ascending: false });
```

## 🔍 AI Processing Pipeline

1. **PDF Download**: Downloads PDF from Supabase Storage URL
2. **OCR Extraction**: Uses Google Cloud Vision AI to extract text
3. **Data Parsing**: Uses Google Gemini to parse structured data
4. **Violation Detection**: Uses Google Gemini to detect FCRA/Metro2 violations
5. **Dispute Letter Generation**: Uses Google Gemini to generate dispute letters
6. **Data Storage**: Stores all results in Supabase PostgreSQL

## 📈 Monitoring & Logging

- **Google Cloud Logging**: All function logs are available in GCP Console
- **Error Tracking**: Comprehensive error handling with detailed logging
- **Performance Monitoring**: Function execution time and memory usage tracking

## 🔒 Security Considerations

- **Row Level Security**: Enabled on all database tables
- **Authentication**: Service account authentication for GCP services
- **API Keys**: Stored as environment variables, not in code
- **Data Privacy**: All processing happens in secure cloud environments

## 🛠️ Troubleshooting

### Common Issues

1. **Vision AI Errors**:
   - Ensure service account has Vision AI User role
   - Check PDF format compatibility

2. **Gemini API Errors**:
   - Verify API key is valid and has quota
   - Check for rate limiting

3. **Supabase Connection Issues**:
   - Verify service role key permissions
   - Check network connectivity

4. **Memory/Timeout Issues**:
   - Increase function memory allocation
   - Optimize PDF processing for large files

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export PYTHONPATH="${PYTHONPATH}:."
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

## 📝 License

This project is part of the Credit Lift Nexus platform. Please refer to the main project license.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Google Cloud Function logs
3. Check Supabase database logs
4. Create an issue in the main repository
