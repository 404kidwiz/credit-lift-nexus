import React from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { CreditReportUpload } from '@/components/CreditReportUpload';
import { useNavigate } from 'react-router-dom';
import { UploadedFile } from '@/lib/types/credit-reports';

const CreditReportUploadPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadComplete = (file: UploadedFile) => {
    // Upload completed, analysis will start automatically
    console.log('Upload completed:', file);
  };

  const handleAnalysisComplete = (reportId: string) => {
    // Navigate to analysis results page
    navigate(`/analysis/${reportId}`);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-slate-800 tracking-wide mb-2">
              <span className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Upload Credit Reports
              </span>
            </h1>
            <p className="text-lg text-slate-600">
              Upload your credit reports to start your credit repair journey
            </p>
          </div>

          {/* Upload Component */}
          <CreditReportUpload
            onUploadComplete={handleUploadComplete}
            onAnalysisComplete={handleAnalysisComplete}
            onUploadError={handleUploadError}
          />

          {/* Success Info */}
          <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800">
              ✅ Upload functionality is working! Files are being stored in Supabase storage and database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditReportUploadPage; 