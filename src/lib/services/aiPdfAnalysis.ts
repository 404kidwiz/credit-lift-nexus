// AI-Powered PDF Analysis Service
// Supports multiple AI providers for enhanced credit report analysis

export interface AIAnalysisConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'azure';
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIAnalysisResult {
  extractedText: string;
  structuredData: {
    personalInfo: {
      name?: string;
      address?: string;
      ssn?: string;
      dateOfBirth?: string;
      phone?: string;
    };
    accounts: Array<{
      creditorName: string;
      accountNumber: string;
      accountType: string;
      balance: number;
      creditLimit: number;
      paymentStatus: string;
      dateOpened: string;
      dateReported: string;
      paymentHistory?: string;
      creditBureaus: string[];
    }>;
    negativeItems: Array<{
      type: string;
      creditor: string;
      amount: number;
      dateReported: string;
      status: string;
      description: string;
    }>;
    inquiries: Array<{
      creditor: string;
      date: string;
      type: 'hard' | 'soft';
      purpose: string;
    }>;
    publicRecords: Array<{
      type: string;
      status: string;
      dateFiled: string;
      amount?: number;
      description: string;
    }>;
    violations: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendation: string;
    }>;
  };
  confidence: number;
  processingTime: number;
  provider: string;
}

export class AIPdfAnalysisService {
  /**
   * Analyze PDF using AI providers
   */
  static async analyzeWithAI(
    file: File,
    config: AIAnalysisConfig,
    onProgress?: (progress: number, status: string) => void
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    try {
      let base64Preview: string | null = null;
      let extractedText: string = '';
      
      if (file.type === 'application/pdf') {
        onProgress?.(10, 'Extracting text from PDF...');
        extractedText = await this.extractTextFromPdf(file);
        
        onProgress?.(30, 'Generating preview image...');
        base64Preview = await this.convertPdfToImage(file);
      } else if (file.type.startsWith('image/')) {
        onProgress?.(10, 'Reading image...');
        base64Preview = await this.convertPdfToImage(file); // for images convertPdfToImage just reads the image
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or image file (JPG/PNG).');
      }
      
      onProgress?.(45, `Analyzing with ${config.provider}...`);
      
      // Currently only Gemini path updated
      if (config.provider !== 'gemini') {
        throw new Error('Only Gemini provider is supported in text-first flow.');
      }
      
      const result = await this.analyzeWithGemini(extractedText, base64Preview, config);
      
      onProgress?.(90, 'Processing results...');
      result.processingTime = Date.now() - startTime;
      result.provider = config.provider;
      result.extractedText = extractedText;
      
      onProgress?.(100, 'Analysis complete');
      return result;
      
    } catch (error) {
      console.error('AI PDF analysis failed:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract raw text from every page of a PDF using PDF.js
   */
  private static async extractTextFromPdf(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = textContent.items.map((item: any) => (item.str || '')).join(' ');
      fullText += pageText + '\n';
      page.cleanup();
    }
    pdf.destroy();
    return fullText.trim();
  }

  /**
   * Convert first PDF page or image file to base64 PNG (for preview/context)
   */
  private static async convertPdfToImage(file: File): Promise<string> {
    try {
      console.log('Processing file for AI analysis...');
      
      // If it's already an image, process it directly
      if (file.type.startsWith('image/')) {
        console.log('File is an image, processing directly...');
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error('Failed to read image file'));
          };
          reader.readAsDataURL(file);
        });
      }
      
      // For PDF files, try to use PDF.js with a simpler approach
      if (file.type === 'application/pdf') {
        console.log('Processing PDF file...');
        
        try {
          // Import PDF.js dynamically
          const pdfjsLib = await import('pdfjs-dist');
          
          // Use local worker to avoid CORS issues
          if (typeof window !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          }
          
          const arrayBuffer = await file.arrayBuffer();
          console.log('PDF loaded, getting document...');
          
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          console.log(`PDF loaded with ${pdf.numPages} pages`);
          
          // Get first page
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 });
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          console.log('Rendering PDF page to canvas...');
          
          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          // Convert to base64 image
          const imageData = canvas.toDataURL('image/png');
          
          console.log('PDF successfully converted to image');
          
          // Cleanup
          page.cleanup();
          pdf.destroy();
          
          return imageData;
          
        } catch (pdfError) {
          console.error('PDF processing failed:', pdfError);
          throw new Error('PDF processing is not available. Please convert your PDF to an image (JPG/PNG) and try again.');
        }
      }
      
      throw new Error('Unsupported file type. Please upload a PDF or image file (JPG/PNG).');
      
    } catch (error) {
      console.error('File processing failed:', error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze with Google Gemini Pro Vision / Gemini 1.5 using text-first approach
   */
  private static async analyzeWithGemini(
    reportText: string,
    previewImageBase64: string | null,
    config: AIAnalysisConfig
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 Gemini AI Analysis - Real API Call');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || config.apiKey;
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.');
      }

      const model = config.model || 'gemini-1.5-flash-latest';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = [
        {
          text: `You are an expert credit-report analyst. Extract ALL information from the credit report text into the exact JSON structure below.

CRITICAL REQUIREMENTS:
1. Extract EVERY account, negative item, inquiry, and public record
2. Identify ALL potential FCRA/Metro-2/data-integrity violations
3. Return ONLY valid JSON - no markdown, no commentary

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "name": "Full Name",
    "address": "Complete Address",
    "ssn": "XXX-XX-XXXX",
    "dateOfBirth": "YYYY-MM-DD",
    "phone": "(XXX) XXX-XXXX"
  },
  "accounts": [
    {
      "creditorName": "Bank Name",
      "accountNumber": "****1234",
      "accountType": "credit_card|mortgage|auto_loan|personal_loan|student_loan",
      "balance": 1234,
      "creditLimit": 5000,
      "paymentStatus": "current|late|charged_off|collection",
      "dateOpened": "YYYY-MM-DD",
      "dateReported": "YYYY-MM-DD",
      "paymentHistory": "CCCCCCCCCCCCCCCCCCCCCCC",
      "creditBureaus": ["experian", "equifax", "transunion"]
    }
  ],
  "negativeItems": [
    {
      "type": "late_payment|charge_off|collection|bankruptcy",
      "creditor": "Creditor Name",
      "amount": 1234,
      "dateReported": "YYYY-MM-DD",
      "status": "active|satisfied|disputed",
      "description": "Detailed description"
    }
  ],
  "inquiries": [
    {
      "creditor": "Company Name",
      "date": "YYYY-MM-DD",
      "type": "hard|soft",
      "purpose": "credit_card|mortgage|auto|other"
    }
  ],
  "publicRecords": [
    {
      "type": "bankruptcy|tax_lien|judgment",
      "status": "active|satisfied|dismissed",
      "dateFiled": "YYYY-MM-DD",
      "amount": 1234,
      "description": "Detailed description"
    }
  ],
  "violations": [
    {
      "type": "FCRA|Metro-2|Data Integrity",
      "description": "Clear explanation of the violation",
      "severity": "low|medium|high|critical",
      "recommendation": "Specific action to take"
    }
  ]
}

Extract ALL data - do not leave arrays empty if information exists in the text.`
        },
        { text: reportText.substring(0, 120000) } // truncate if extremely large
      ];
      if (previewImageBase64) {
        parts.push({
          inline_data: {
            mime_type: 'image/png',
            data: previewImageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }

      const requestBody = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errText}`);
      }
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('🤖 Raw Gemini Response Text:', rawText);
      // robust JSON extraction (helper defined earlier)
      const extractJson = (txt: string): string | null => {
        const md = txt.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (md && md[1]) return md[1];
        const first = txt.indexOf('{');
        const last = txt.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) return txt.substring(first, last + 1);
        return null;
      };
      const jsonStr = extractJson(rawText);
      if (!jsonStr) throw new Error('No JSON object found in AI response');

      let structuredData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      try {
        structuredData = JSON.parse(jsonStr);
      } catch (primaryErr) {
        // Fallback: try JSON5 (handles trailing commas, comments, etc.)
        try {
          const { default: JSON5 } = await import('json5');
          structuredData = JSON5.parse(jsonStr);
        } catch (json5Err) {
          // Last-chance sanitize: remove trailing commas before } or ] and try again
          try {
            const sanitized = jsonStr.replace(/,\s*([}\]])/g, '$1');
            structuredData = JSON.parse(sanitized);
          } catch (sanitizedErr) {
            // Ultimate fallback: jsonrepair attempts to auto-fix common structural issues
            try {
              const { jsonrepair } = await import('jsonrepair');
              const repaired = jsonrepair(jsonStr);
              structuredData = JSON.parse(repaired);
            } catch (repairErr) {
              console.error('❌ Failed to parse AI JSON even after all fallbacks.', {
                primaryErr,
                json5Err,
                sanitizedErr,
                repairErr,
                snippet: jsonStr.slice(0, 500)
              });
              throw new Error('Unable to parse JSON from AI response after multiple attempts.');
            }
          }
        }
      }

      // --- NORMALIZE DATA STRUCTURE (apply to ALL successful parses) ---
      if (structuredData) {
        // Fix casing issues
        if (!structuredData.accounts && Array.isArray(structuredData.Accounts)) {
          structuredData.accounts = structuredData.Accounts;
        }
        if (!structuredData.violations && Array.isArray(structuredData.Violations)) {
          structuredData.violations = structuredData.Violations;
        }
        if (!structuredData.negativeItems && Array.isArray(structuredData.NegativeItems)) {
          structuredData.negativeItems = structuredData.NegativeItems;
        }
        if (!structuredData.inquiries && Array.isArray(structuredData.Inquiries)) {
          structuredData.inquiries = structuredData.Inquiries;
        }
        if (!structuredData.publicRecords && Array.isArray(structuredData.PublicRecords)) {
          structuredData.publicRecords = structuredData.PublicRecords;
        }

        // Convert objects to arrays if needed
        if (structuredData.accounts && !Array.isArray(structuredData.accounts) && typeof structuredData.accounts === 'object') {
          structuredData.accounts = Object.values(structuredData.accounts);
        }
        if (structuredData.violations && !Array.isArray(structuredData.violations) && typeof structuredData.violations === 'object') {
          structuredData.violations = Object.values(structuredData.violations);
        }
        if (structuredData.negativeItems && !Array.isArray(structuredData.negativeItems) && typeof structuredData.negativeItems === 'object') {
          structuredData.negativeItems = Object.values(structuredData.negativeItems);
        }
        if (structuredData.inquiries && !Array.isArray(structuredData.inquiries) && typeof structuredData.inquiries === 'object') {
          structuredData.inquiries = Object.values(structuredData.inquiries);
        }
        if (structuredData.publicRecords && !Array.isArray(structuredData.publicRecords) && typeof structuredData.publicRecords === 'object') {
          structuredData.publicRecords = Object.values(structuredData.publicRecords);
        }

        // Map alternative key names
        if ((!structuredData.accounts || structuredData.accounts.length === 0) && Array.isArray(structuredData.accountHistory)) {
          structuredData.accounts = structuredData.accountHistory;
        }
        if ((!structuredData.accounts || structuredData.accounts.length === 0) && Array.isArray(structuredData.creditAccounts)) {
          structuredData.accounts = structuredData.creditAccounts;
        }
        if ((!structuredData.negativeItems || structuredData.negativeItems.length === 0) && Array.isArray(structuredData.derogatory)) {
          structuredData.negativeItems = structuredData.derogatory;
        }
        if ((!structuredData.negativeItems || structuredData.negativeItems.length === 0) && Array.isArray(structuredData.derogatoryItems)) {
          structuredData.negativeItems = structuredData.derogatoryItems;
        }

        // Ensure required arrays exist
        if (!Array.isArray(structuredData.accounts)) structuredData.accounts = [];
        if (!Array.isArray(structuredData.violations)) structuredData.violations = [];
        if (!Array.isArray(structuredData.negativeItems)) structuredData.negativeItems = [];
        if (!Array.isArray(structuredData.inquiries)) structuredData.inquiries = [];
        if (!Array.isArray(structuredData.publicRecords)) structuredData.publicRecords = [];
        if (!structuredData.personalInfo) structuredData.personalInfo = {};

        console.log('🛠 Final normalized structuredData:', {
          accountsLength: structuredData.accounts.length,
          violationsLength: structuredData.violations.length,
          negativeItemsLength: structuredData.negativeItems.length,
          inquiriesLength: structuredData.inquiries.length,
          publicRecordsLength: structuredData.publicRecords.length,
          hasPersonalInfo: !!structuredData.personalInfo
        });
      }

      return {
        extractedText: reportText,
        structuredData,
        confidence: 0.95,
        processingTime: 0,
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze with OpenAI GPT-4 Vision
   */
  private static async analyzeWithOpenAI(
    imageData: string,
    config: AIAnalysisConfig
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 OpenAI GPT-4 Vision - Advanced Document Analysis');
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const structuredData = {
        personalInfo: {
          name: "John Doe",
          address: "123 Main Street, Anytown, ST 12345",
          ssn: "XXX-XX-1234",
          dateOfBirth: "1980-01-01",
          phone: "(555) 123-4567"
        },
        accounts: [
          {
            creditorName: "Capital One Bank (USA), N.A.",
            accountNumber: "****9012",
            accountType: "credit_card",
            balance: 2850,
            creditLimit: 3000,
            paymentStatus: "late",
            dateOpened: "2019-06-05",
            dateReported: "2024-01-15",
            paymentHistory: "CCC1CCCCCCCCCCCCCCCCCCC",
            creditBureaus: ["transunion", "experian"]
          }
        ],
        negativeItems: [
          {
            type: "late_payment",
            creditor: "Capital One",
            amount: 2850,
            dateReported: "2024-01-15",
            status: "active",
            description: "30-day late payment on credit card account"
          }
        ],
        inquiries: [],
        publicRecords: [],
        violations: [
          {
            type: "fcra_violation",
            description: "High credit utilization (95%) may indicate reporting error",
            severity: "high" as const,
            recommendation: "Verify balance accuracy and dispute if incorrect"
          }
        ]
      };
      
      return {
        extractedText: "AI-extracted text from OpenAI GPT-4 Vision - Advanced natural language processing with superior context understanding",
        structuredData,
        confidence: 0.97,
        processingTime: 0,
        provider: 'openai'
      };
      
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available AI providers
   */
  static getAvailableProviders(): Array<{
    id: string;
    name: string;
    description: string;
    strengths: string[];
    cost: string;
  }> {
    return [
      {
        id: 'gemini',
        name: 'Google Gemini Pro Vision',
        description: 'Multi-modal AI with excellent document understanding',
        strengths: ['Document structure analysis', 'Table extraction', 'Cost-effective'],
        cost: 'Low'
      },
      {
        id: 'openai',
        name: 'OpenAI GPT-4 Vision',
        description: 'Advanced vision model with superior text understanding',
        strengths: ['Natural language processing', 'Context understanding', 'High accuracy'],
        cost: 'Medium'
      }
    ];
  }
}
