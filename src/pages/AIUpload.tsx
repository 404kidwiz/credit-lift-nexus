import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditReportUpload } from '@/components/CreditReportUpload';
import { UploadedFile } from '@/lib/types/credit-reports';
import { AIAnalysisResult } from '@/lib/services/aiPdfAnalysis';
import { CreditReportAnalysis } from '@/lib/types/credit-reports';
import { useToast } from '@/hooks/use-toast';

function AIUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUploadComplete = (file: UploadedFile) => {
    console.log('Upload completed:', file);
    toast({
      title: "Upload Successful",
      description: `${file.fileName} has been uploaded and is ready for analysis.`,
    });
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive"
    });
  };

  const handleAnalysisComplete = (reportId: string, aiResult?: AIAnalysisResult | CreditReportAnalysis) => {
    console.log('Analysis completed for report:', reportId);
    
    if (aiResult) {
      // Check if it's a GCF analysis result
      if ('violations' in aiResult && 'dispute_letter' in aiResult) {
        const gcfResult = aiResult as CreditReportAnalysis;
        toast({
          title: "🤖 Google AI Analysis Complete!",
          description: `Found ${gcfResult.violations.length} violations. Generated dispute letter. Redirecting to results...`,
        });
      } else {
        const traditionalResult = aiResult as AIAnalysisResult;
        toast({
          title: "AI Analysis Complete!",
          description: `Report analyzed with ${Math.round(traditionalResult.confidence * 100)}% confidence using ${traditionalResult.provider}. Redirecting to results...`,
        });
      }
    } else {
      toast({
        title: "Analysis Complete!",
        description: "Report analyzed successfully. Redirecting to results...",
      });
    }

    // Navigate to analysis results after a short delay
    setTimeout(() => {
      navigate(`/analysis/${reportId}`);
    }, 2000);
  };

  const handleGCFAnalysisComplete = (analysisId: string, analysis: CreditReportAnalysis) => {
    console.log('GCF Analysis completed:', analysisId, analysis);
    
    toast({
      title: "🚀 Google Cloud Function Complete!",
      description: `Found ${analysis.violations.length} violations using Google Vision AI + Gemini. Redirecting...`,
    });

    // Navigate to GCF analysis results
    setTimeout(() => {
      navigate(`/analysis/${analysisId}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <CreditReportUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>
    </div>
  );
}

export default AIUpload; 