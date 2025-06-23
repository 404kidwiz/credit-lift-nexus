import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadProgress, UploadedFile } from '@/lib/types/credit-reports';
import { CreditReportAnalysisService } from '@/lib/services/creditReportAnalysis';

interface CreditReportUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  onAnalysisComplete?: (reportId: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
  'image/tif'
];

// Helper function to extract text from PDF
const extractTextFromPDF = async (file: File): Promise<string> => {
  console.log('Starting PDF text extraction for file:', file.name, 'Size:', file.size);
  
  try {
    // Import PDF.js dynamically to avoid build-time issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure PDF.js worker source using unpkg CDN with correct file extension
    // The worker file is actually .mjs, not .js in version 5.3.31
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs`;
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('PDF processing timeout')), 30000); // 30 second timeout
    });
    
    // PDF processing promise
    const processingPromise = (async () => {
      console.log('Loading PDF document...');
      
      // Load the PDF document with specific options for better compatibility
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        cMapPacked: true,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.3.31/cmaps/',
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.3.31/standard_fonts/'
      });
      
      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully. Pages:', pdf.numPages);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) { // Limit to first 10 pages
        console.log(`Processing page ${pageNum}/${pdf.numPages}`);
        
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items with proper spacing
          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (pageText) {
            fullText += pageText + '\n\n';
            console.log(`Page ${pageNum} extracted ${pageText.length} characters`);
          }
          
          // Clean up page resources
          page.cleanup();
          
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError);
          // Continue with other pages even if one fails
        }
      }
      
      // Clean up PDF resources
      pdf.destroy();
      
      console.log('PDF text extraction completed. Total length:', fullText.length);
      
      if (fullText.length < 100) {
        console.warn('Extracted text is very short, might indicate extraction issues');
        return 'PDF_PROCESSED_MINIMAL_TEXT';
      }
      
      return fullText.trim();
      
    })();
    
    // Race between processing and timeout
    const result = await Promise.race([processingPromise, timeoutPromise]);
    
    console.log('PDF text extraction successful');
    return result;
    
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    
    // Provide informative fallback based on error type
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.log('PDF processing timed out, using fallback');
        return 'PDF_PROCESSED_TIMEOUT';
      } else if (error.message.includes('Invalid PDF')) {
        console.log('Invalid PDF file, using fallback');
        return 'PDF_PROCESSED_INVALID';
      }
    }
    
    // Generic fallback for any other errors
    console.log('PDF processing failed, using fallback for analysis');
    return 'PDF_PROCESSED_ERROR';
  }
};

export const CreditReportUpload: React.FC<CreditReportUploadProps> = ({
  onUploadComplete,
  onUploadError,
  onAnalysisComplete
}) => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = useCallback(async (file: File, uploadIndex: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Uploading file:', file.name, 'for user:', user.id);

    // Create abort controller for this upload
    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Extract PDF text if it's a PDF file
      let extractedText = '';
      if (file.type === 'application/pdf') {
        console.log('Extracting text from PDF...');
        updateUploadStatus(uploadIndex, 'extracting');
        extractedText = await extractTextFromPDF(file);
        console.log('PDF text extraction completed, length:', extractedText.length);
      }

      // Step 2: Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      console.log('Uploading to storage with filename:', fileName);
      
      updateUploadStatus(uploadIndex, 'uploading');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('credit-reports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully to storage');

      // Step 3: Get public URL
      const { data: urlData } = supabase.storage
        .from('credit-reports')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', urlData.publicUrl);

      // Step 4: Create database record
      const insertData = {
        user_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: 'uploaded'
      };

      console.log('Inserting into database:', insertData);

      const { data: reportData, error: dbError } = await supabase
        .from('credit_reports')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log('Database record created:', reportData);

      // Step 5: Update status to completed
      updateUploadStatus(uploadIndex, 'completed');
      
      const uploadedFile: UploadedFile = {
        id: reportData.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl
      };

      onUploadComplete?.(uploadedFile);
      
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully. Starting analysis...`,
      });

      // Step 6: Start analysis with extracted text
      setAnalyzing(reportData.id);
      updateUploadStatus(uploadIndex, 'analyzing');
      
      try {
        console.log('Starting enhanced Phase 2 credit report analysis with extracted text...');
        const analysisResult = await CreditReportAnalysisService.enhancedAnalyzeCreditReport(
          urlData.publicUrl,
          reportData.id,
          extractedText // Pass the extracted text for enhanced processing
        );
        
        console.log('Enhanced Phase 2 analysis completed:', analysisResult);
        console.log('Analysis quality:', analysisResult.summary.analysisQuality);
        console.log('Real data detected:', analysisResult.summary.isRealData);
        
        updateUploadStatus(uploadIndex, 'analyzed');
        setAnalyzing(null);
        
        toast({
          title: "Enhanced Analysis Complete", 
          description: `${analysisResult.summary.analysisQuality} - Found ${analysisResult.summary.negativeItemsCount} negative items and ${analysisResult.summary.violationsCount} violations.`,
        });
        
        // Wait for GCF webhook to process and create analysis record
        console.log('Waiting for GCF webhook to process the uploaded file...');
        
        // Poll for the analysis record to be created by GCF
        let analysisRecord = null;
        let attempts = 0;
        const maxAttempts = 30; // Wait up to 30 seconds
        
        while (!analysisRecord && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;
          
          // Check if GCF has created an analysis record
          const { data: analysisData, error: analysisError } = await supabase
            .from('credit_reports_analysis')
            .select('id, parsed_data, violations')
            .eq('user_id', user.id)
            .eq('pdf_url', urlData.publicUrl)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (analysisData && analysisData.length > 0 && !analysisError) {
            analysisRecord = analysisData[0];
            console.log('GCF analysis record found:', analysisRecord.id);
            break;
          }
          
          console.log(`Attempt ${attempts}/${maxAttempts}: Waiting for GCF analysis...`);
        }
        
        if (analysisRecord) {
          // Use the GCF analysis ID for navigation
          onAnalysisComplete?.(analysisRecord.id);
        } else {
          // Fallback to the report ID if GCF analysis is not found
          console.warn('GCF analysis record not found, using report ID as fallback');
          onAnalysisComplete?.(reportData.id);
        }
        
      } catch (analysisError) {
        console.error('Analysis failed:', analysisError);
        updateUploadStatus(uploadIndex, 'analysis_error', analysisError instanceof Error ? analysisError.message : 'Analysis failed');
        setAnalyzing(null);
        
        toast({
          title: "Analysis Failed",
          description: "Credit report analysis failed. You can still view the uploaded file.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, [user, onUploadComplete, onAnalysisComplete, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload credit reports.",
        variant: "destructive"
      });
      return;
    }

    console.log('User authenticated:', user.id);
    console.log('Files to upload:', acceptedFiles.map(f => f.name));

    setIsUploading(true);
    const newUploads: FileUploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(prev => [...prev, ...newUploads]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const uploadIndex = uploadProgress.length + i;
      
      try {
        await uploadFile(file, uploadIndex);
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        updateUploadStatus(uploadIndex, 'error', errorMessage);
        onUploadError?.(errorMessage);
      }
    }

    setIsUploading(false);
  }, [user, uploadProgress.length, toast, uploadFile, onUploadError]);

  const updateUploadProgress = (index: number, progress: number) => {
    setUploadProgress(prev => 
      prev.map((upload, i) => 
        i === index ? { ...upload, progress } : upload
      )
    );
  };

  const updateUploadStatus = (index: number, status: FileUploadProgress['status'], error?: string) => {
    setUploadProgress(prev => 
      prev.map((upload, i) => 
        i === index ? { ...upload, status, error } : upload
      )
    );
  };

  const removeUpload = (index: number) => {
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  };

  const cancelUpload = (index: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    removeUpload(index);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.tif']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'extracting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'analyzed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'error':
      case 'analysis_error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'extracting':
        return 'Extracting text...';
      case 'completed':
        return 'Upload Complete';
      case 'analyzing':
        return 'Analyzing...';
      case 'analyzed':
        return 'Analysis Complete';
      case 'error':
        return 'Upload Failed';
      case 'analysis_error':
        return 'Analysis Failed';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className={`p-8 border-2 border-dashed transition-colors ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : isDragReject 
            ? 'border-red-500 bg-red-50' 
            : 'border-gray-300 hover:border-gray-400'
      }`}>
        <div {...getRootProps()} className="text-center cursor-pointer">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive 
              ? 'Drop your credit reports here' 
              : 'Upload Credit Reports'
            }
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop your credit report PDFs here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, JPG, PNG, TIFF (Max 10MB)
          </p>
        </div>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Progress</h3>
          <div className="space-y-4">
            {uploadProgress.map((upload, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(upload.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>
                  <Progress value={upload.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {getStatusText(upload.status)}
                    {upload.error && (
                      <span className="text-red-500 ml-2">- {upload.error}</span>
                    )}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUpload(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}; 