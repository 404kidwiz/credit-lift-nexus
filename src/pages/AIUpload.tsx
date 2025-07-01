import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIProviderSelector } from '@/components/AIProviderSelector';
import { AIPdfAnalysisService, AIAnalysisConfig, AIAnalysisResult } from '@/lib/services/aiPdfAnalysis';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsContent } from '@/components/ui/tabs';

function AIUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [aiConfig, setAiConfig] = useState<AIAnalysisConfig | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user || !session) {
      navigate('/auth');
      toast({
        title: "Authentication Required",
        description: "Please sign in to use this feature.",
        variant: "destructive"
      });
    }
  }, [user, session, navigate, toast]);

  const handleConfigChange = (config: AIAnalysisConfig | null) => {
    setAiConfig(config);
    if (config) {
      toast({
        title: "AI Provider Configured",
        description: `${config.provider} is ready for analysis.`,
      });
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    if (!user || !session) {
      throw new Error('Authentication required');
    }

    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${timestamp}.${fileExt}`;

    console.log('Uploading file to:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('credit-reports')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('credit-reports')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAnalysisComplete = (reportId: string, aiResult: AIAnalysisResult) => {
    console.log('🎉 AI Analysis completed for report:', reportId);
    console.log('📊 AI Result data:', aiResult);
    const accountsCount = Array.isArray(aiResult.structuredData?.accounts) ? aiResult.structuredData.accounts.length : 0;
    const violationsCount = Array.isArray(aiResult.structuredData?.violations) ? aiResult.structuredData.violations.length : 0;

    console.log('📈 Accounts found:', accountsCount);
    console.log('⚠️  Violations found:', violationsCount);
    
    toast({
      title: "🤖 AI Analysis Complete!",
      description: `Report analyzed with ${Math.round(aiResult.confidence * 100)}% confidence using ${aiResult.provider}. Found ${accountsCount} accounts and ${violationsCount} violations.`,
    });

    // Navigate to analysis results after a short delay
    console.log('🔄 Navigating to analysis results in 2 seconds...');
    setTimeout(() => {
      console.log('🚀 Navigating to:', `/analysis/${reportId}`);
      navigate(`/analysis/${reportId}`, { 
        state: { aiResult } 
      });
    }, 2000);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze credit reports.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    setIsAnalyzing(true);
    setProgress(0);
    setStatus('Starting analysis...');

    try {
      // First upload the file to storage
      setStatus('Uploading file...');
      const fileUrl = await uploadFileToStorage(file);
      setProgress(20);
      
      // Then start the AI analysis
      setStatus('Running AI analysis...');
      const result = await AIPdfAnalysisService.analyzeWithAI(
        file,
        aiConfig || {
          provider: 'openrouter',
          apiKey: 'key-loaded-from-env',
          model: ''
        },
        (progressValue, statusText) => {
          setProgress(20 + (progressValue * 0.6));
          setStatus(statusText);
        }
      );

      // Create the analysis record
      setStatus('Saving analysis results...');
      setProgress(90);
      
      console.log('🔄 Processing AI result for database storage...');
      console.log('👤 Current user:', user);
      console.log('👤 User ID:', user?.id);
      console.log('🔑 Session:', session);
      console.log('📊 Raw violations:', result.structuredData.violations);
      console.log('📊 Raw accounts:', result.structuredData.accounts);

      // Verify user exists in auth.users table
      console.log('🔍 Checking if user exists in auth.users...');
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      console.log('🔍 Auth user check result:', { authUser, authError });

      // Format violations with proper IDs for database storage
      const formattedViolations = (result.structuredData.violations || []).map((violation, index) => ({
        id: `violation_${Date.now()}_${index}`,
        type: violation.type || 'unknown',
        description: violation.description || 'No description provided',
        severity: violation.severity || 'medium',
        recommendation: violation.recommendation || 'Review with credit specialist',
        created_at: new Date().toISOString()
      }));

      // Format accounts with proper structure - use the known camelCase properties
      const formattedAccounts = (result.structuredData.accounts || []).map((account, index) => ({
        id: `account_${Date.now()}_${index}`,
        creditor_name: account.creditorName || 'Unknown Creditor',
        account_number: account.accountNumber || 'Unknown',
        account_type: account.accountType || 'unknown',
        balance: account.balance || 0,
        credit_limit: account.creditLimit || 0,
        status: account.paymentStatus || 'unknown',
        date_opened: account.dateOpened || '',
        last_activity: account.dateReported || '',
        payment_history: account.paymentHistory || '',
        credit_bureaus: account.creditBureaus || []
      }));

      console.log('✅ Formatted violations:', formattedViolations);
      console.log('✅ Formatted accounts:', formattedAccounts);

      // Format the structured data for storage
      const formattedParsedData = {
        ...result.structuredData,
        accounts: formattedAccounts,
        violations: formattedViolations
      };

      console.log('💾 Preparing to save to Supabase. Full record:', {
        user_id: user.id,
        pdf_url: fileUrl,
        extracted_text_length: result.extractedText?.length || 0,
        parsed_data: formattedParsedData,
        violations: formattedViolations,
      });
      
      const { data: reportData, error: reportError } = await supabase
        .from('credit_reports_analysis')
        .insert([
          {
            user_id: user.id,
            pdf_url: fileUrl,
            extracted_text: result.extractedText,
            parsed_data: formattedParsedData,
            violations: formattedViolations
          }
        ])
        .select()
        .single();

      if (reportError) {
        console.error('❌ Supabase error:', reportError);
        throw new Error(`Failed to save analysis: ${reportError.message}`);
      }

      if (!reportData) {
        console.error('❌ No data returned from insert operation');
        throw new Error('Failed to save analysis: No data returned');
      }

      setProgress(100);
      setStatus('Analysis complete!');
      console.log('✅ Analysis saved successfully to DB. Report ID:', reportData.id);

      handleAnalysisComplete(reportData.id, result);

    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      setProgress(0);
      setStatus('');
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive"
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isAnalyzing || !aiConfig
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Credit Report Analysis</h1>
          <p className="text-gray-600">
            Upload your credit report and get instant AI-powered analysis with violation detection
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">1. Upload Report</TabsTrigger>
              <TabsTrigger value="provider-config">2. Configure AI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Upload Your Credit Report</CardTitle>
                  <CardDescription>
                    Drag & drop your PDF, JPG, or PNG file below to start the analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${(!aiConfig || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input {...getInputProps()} />
                    
                    {isAnalyzing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">{status}</p>
                          <Progress value={progress} className="w-full" />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          {isDragActive
                            ? 'Drop the file here...'
                            : 'Drag & drop a credit report here, or click to select'}
                        </p>
                        <p className="mt-1 text-xs text-green-600 font-medium">
                          ✅ Best: JPG, PNG images (fast & reliable)
                        </p>
                        <p className="mt-1 text-xs text-yellow-600">
                          ⚠️ PDF files may have processing issues
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Max file size: 10MB
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Select a provider in the tab above to begin
                        </p>
                      </div>
                    )}
                  </div>

                  {aiConfig && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700">
                          Ready to analyze with {aiConfig.provider}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="provider-config">
              <div className="p-4">
                <AIProviderSelector
                  onConfigChange={handleConfigChange}
                  currentConfig={aiConfig}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">AI Analysis Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Extraction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automatically extract personal information, accounts, and payment history from any credit report format.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Violation Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Identify FCRA violations, reporting errors, and disputable items with AI-powered analysis.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actionable Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get specific recommendations for disputes and credit repair strategies based on your report.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIUpload; 