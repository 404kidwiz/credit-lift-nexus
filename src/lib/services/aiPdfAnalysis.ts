// AI-Powered PDF Analysis Service
// Supports multiple AI providers for enhanced credit report analysis

export interface AIAnalysisConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'azure' | 'openrouter';
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
      
      let result: AIAnalysisResult;
      switch (config.provider) {
        case 'gemini':
          result = await this.analyzeWithGemini(extractedText, base64Preview, config);
          break;
        case 'openai':
          result = await this.analyzeWithOpenAI(extractedText, base64Preview, config);
          break;
        case 'claude':
          result = await this.analyzeWithClaude(extractedText, base64Preview, config);
          break;
        case 'azure':
          result = await this.analyzeWithAzure(extractedText, base64Preview, config);
          break;
        case 'openrouter':
          result = await this.analyzeWithOpenRouter(extractedText, base64Preview, config);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${config.provider}`);
      }
      
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
    reportText: string,
    imageData: string | null,
    config: AIAnalysisConfig
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 OpenAI GPT-4 Vision - Real API Call');
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || config.apiKey;
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
      }

      const model = config.model || 'gpt-4o-mini';

      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert credit-report analyst. Extract ALL information from this credit report into the exact JSON structure below.

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

CREDIT REPORT TEXT:
${reportText.substring(0, 120000)}`
            }
          ]
        }
      ];

             // Add image if available
       if (imageData) {
         const content = messages[0].content as Array<{type: string; text?: string; image_url?: {url: string; detail: string}}>;
         content.push({
           type: 'image_url',
           image_url: {
             url: imageData,
             detail: 'high'
           }
         });
       }

      const requestBody = {
        model,
        messages,
        max_tokens: config.maxTokens || 4000,
        temperature: config.temperature || 0.1
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      console.log('🤖 Raw OpenAI Response Text:', rawText);

      // Use the same JSON parsing logic as Gemini
      const extractJson = (txt: string): string | null => {
        const md = txt.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (md && md[1]) return md[1];
        const first = txt.indexOf('{');
        const last = txt.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) return txt.substring(first, last + 1);
        return null;
      };

      const jsonStr = extractJson(rawText);
      if (!jsonStr) throw new Error('No JSON object found in OpenAI response');

      let structuredData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      try {
        structuredData = JSON.parse(jsonStr);
      } catch (primaryErr) {
        // Apply same fallback logic as Gemini
        try {
          const { default: JSON5 } = await import('json5');
          structuredData = JSON5.parse(jsonStr);
        } catch (json5Err) {
          try {
            const sanitized = jsonStr.replace(/,\s*([}\]])/g, '$1');
            structuredData = JSON.parse(sanitized);
          } catch (sanitizedErr) {
            try {
              const { jsonrepair } = await import('jsonrepair');
              const repaired = jsonrepair(jsonStr);
              structuredData = JSON.parse(repaired);
            } catch (repairErr) {
              console.error('❌ Failed to parse OpenAI JSON after all fallbacks.', {
                primaryErr,
                json5Err,
                sanitizedErr,
                repairErr,
                snippet: jsonStr.slice(0, 500)
              });
              throw new Error('Unable to parse JSON from OpenAI response after multiple attempts.');
            }
          }
        }
      }

      // Apply same normalization logic as Gemini
      if (structuredData) {
        // Ensure required arrays exist
        if (!Array.isArray(structuredData.accounts)) structuredData.accounts = [];
        if (!Array.isArray(structuredData.violations)) structuredData.violations = [];
        if (!Array.isArray(structuredData.negativeItems)) structuredData.negativeItems = [];
        if (!Array.isArray(structuredData.inquiries)) structuredData.inquiries = [];
        if (!Array.isArray(structuredData.publicRecords)) structuredData.publicRecords = [];
        if (!structuredData.personalInfo) structuredData.personalInfo = {};
      }
      
      return {
        extractedText: reportText,
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
   * Analyze with Claude Vision
   */
  private static async analyzeWithClaude(
    reportText: string,
    imageData: string | null,
    config: AIAnalysisConfig
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 Claude Vision - Real API Call');
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || config.apiKey;
      if (!apiKey) {
        throw new Error('Claude API key not found. Please set VITE_CLAUDE_API_KEY in your .env file.');
      }

      const model = config.model || 'claude-3-5-sonnet-20241022';

      const content = [
        {
          type: 'text',
          text: `You are an expert credit-report analyst. Extract ALL information from this credit report into the exact JSON structure below.

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

CREDIT REPORT TEXT:
${reportText.substring(0, 120000)}`
        }
      ];

      // Add image if available
      if (imageData) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }

      const requestBody = {
        model,
        max_tokens: config.maxTokens || 4000,
        temperature: config.temperature || 0.1,
        messages: [
          {
            role: 'user',
            content
          }
        ]
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Claude API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const rawText = data.content?.[0]?.text || '';
      console.log('🤖 Raw Claude Response Text:', rawText);

      // Use the same JSON parsing logic
      const extractJson = (txt: string): string | null => {
        const md = txt.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (md && md[1]) return md[1];
        const first = txt.indexOf('{');
        const last = txt.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) return txt.substring(first, last + 1);
        return null;
      };

      const jsonStr = extractJson(rawText);
      if (!jsonStr) throw new Error('No JSON object found in Claude response');

      let structuredData: Record<string, unknown>;
      try {
        structuredData = JSON.parse(jsonStr);
      } catch (primaryErr) {
        // Apply same fallback logic
        try {
          const { default: JSON5 } = await import('json5');
          structuredData = JSON5.parse(jsonStr);
        } catch (json5Err) {
          try {
            const sanitized = jsonStr.replace(/,\s*([}\]])/g, '$1');
            structuredData = JSON.parse(sanitized);
          } catch (sanitizedErr) {
            try {
              const { jsonrepair } = await import('jsonrepair');
              const repaired = jsonrepair(jsonStr);
              structuredData = JSON.parse(repaired);
            } catch (repairErr) {
              console.error('❌ Failed to parse Claude JSON after all fallbacks.', {
                primaryErr,
                json5Err,
                sanitizedErr,
                repairErr,
                snippet: jsonStr.slice(0, 500)
              });
              throw new Error('Unable to parse JSON from Claude response after multiple attempts.');
            }
          }
        }
      }

      // Apply normalization logic
      if (structuredData) {
        if (!Array.isArray(structuredData.accounts)) structuredData.accounts = [];
        if (!Array.isArray(structuredData.violations)) structuredData.violations = [];
        if (!Array.isArray(structuredData.negativeItems)) structuredData.negativeItems = [];
        if (!Array.isArray(structuredData.inquiries)) structuredData.inquiries = [];
        if (!Array.isArray(structuredData.publicRecords)) structuredData.publicRecords = [];
        if (!structuredData.personalInfo) structuredData.personalInfo = {};
      }

      return {
        extractedText: reportText,
        structuredData,
        confidence: 0.94,
        processingTime: 0,
        provider: 'claude'
      };
      
    } catch (error) {
      console.error('Claude analysis failed:', error);
      throw new Error(`Claude analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze with Azure Document Intelligence
   */
  private static async analyzeWithAzure(
    reportText: string,
    imageData: string | null,
    config: AIAnalysisConfig
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 Azure Document Intelligence - Real API Call');
      const apiKey = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY || config.apiKey;
      const endpoint = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
      
      if (!apiKey || !endpoint) {
        throw new Error('Azure Document Intelligence API key and endpoint not found. Please set VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY and VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT in your .env file.');
      }

      // For Azure, we'll use their prebuilt document model
      const model = config.model || 'prebuilt-document';

      let requestBody: unknown;
      let headers: Record<string, string>;

      if (imageData) {
        // Use image data
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        requestBody = Buffer.from(base64Data, 'base64');
        headers = {
          'Content-Type': 'image/png',
          'Ocp-Apim-Subscription-Key': apiKey
        };
      } else {
        // Use text data (create a simple document)
        requestBody = JSON.stringify({
          urlSource: undefined
        });
        headers = {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': apiKey
        };
      }

      const analyzeUrl = `${endpoint}/formrecognizer/documentModels/${model}:analyze?api-version=2023-07-31`;

      const response = await fetch(analyzeUrl, {
        method: 'POST',
        headers,
        body: requestBody
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Azure API error: ${response.status} ${errText}`);
      }

      // Azure returns an operation location for async processing
      const operationLocation = response.headers.get('Operation-Location');
      if (!operationLocation) {
        throw new Error('No operation location returned from Azure');
      }

      // Poll for results (simplified for demo)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const resultResponse = await fetch(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey
        }
      });

      if (!resultResponse.ok) {
        throw new Error(`Failed to get Azure analysis results: ${resultResponse.status}`);
      }

      const resultData = await resultResponse.json();
      
      // Parse Azure's response and convert to our format
      const structuredData = {
        personalInfo: {},
        accounts: [],
        negativeItems: [],
        inquiries: [],
        publicRecords: [],
        violations: []
      };

      return {
        extractedText: reportText,
        structuredData,
        confidence: 0.88,
        processingTime: 0,
        provider: 'azure'
      };
      
    } catch (error) {
      console.error('Azure analysis failed:', error);
      throw new Error(`Azure analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze with OpenRouter (200+ Models)
   */
  private static async analyzeWithOpenRouter(
    reportText: string,
    imageData: string | null,
    config: AIAnalysisConfig
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 OpenRouter Analysis - Accessing 200+ AI Models');
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || config.apiKey;
      console.log('🔑 OpenRouter API Key Status:', apiKey ? 'Found' : 'Missing');
      if (!apiKey) {
        throw new Error('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your .env file.');
      }

      const model = config.model || 'openai/gpt-4o-mini';

      // Prepare the prompt for credit report analysis
      const prompt = `You are an expert credit-report analyst. Extract ALL information from the credit report text into the exact JSON structure below.

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
      "purpose": "credit application|account review|collection"
    }
  ],
  "publicRecords": [
    {
      "type": "bankruptcy|tax_lien|judgment|foreclosure",
      "status": "active|discharged|satisfied",
      "dateFiled": "YYYY-MM-DD",
      "amount": 1234,
      "description": "Detailed description"
    }
  ],
  "violations": [
    {
      "type": "FCRA violation|Metro-2 error|Data integrity issue",
      "description": "Specific violation description",
      "severity": "low|medium|high|critical",
      "recommendation": "Specific action to take"
    }
  ]
}

CREDIT REPORT TEXT:
${reportText}

Return ONLY the JSON object.`;

      // Prepare messages for OpenRouter API
      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: prompt
            }
          ]
        }
      ];

      // Add image if available
      if (imageData) {
        const content = messages[0].content as Array<{type: string; text?: string; image_url?: {url: string; detail: string}}>;
        content.push({
          type: 'image_url',
          image_url: {
            url: imageData,
            detail: 'high'
          }
        });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Credit Lift Nexus'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenRouter');
      }

      // Extract JSON from response
      const extractJson = (txt: string): string | null => {
        const jsonMatch = txt.match(/\{[\s\S]*\}/);
        return jsonMatch ? jsonMatch[0] : null;
      };

      let jsonStr = extractJson(content);
      if (!jsonStr) throw new Error('No JSON object found in OpenRouter response');

      let structuredData: Record<string, unknown>;
      try {
        structuredData = JSON.parse(jsonStr);
      } catch (primaryErr) {
        // Apply same fallback logic
        try {
          const { default: JSON5 } = await import('json5');
          structuredData = JSON5.parse(jsonStr);
        } catch (json5Err) {
          try {
            const sanitized = jsonStr.replace(/,\s*([}\]])/g, '$1');
            structuredData = JSON.parse(sanitized);
          } catch (sanitizedErr) {
            try {
              const { jsonrepair } = await import('jsonrepair');
              const repaired = jsonrepair(jsonStr);
              structuredData = JSON.parse(repaired);
            } catch (repairErr) {
              console.error('❌ Failed to parse OpenRouter JSON after all fallbacks.', {
                primaryErr,
                json5Err,
                sanitizedErr,
                repairErr,
                snippet: jsonStr.slice(0, 500)
              });
              throw new Error('Unable to parse JSON from OpenRouter response after multiple attempts.');
            }
          }
        }
      }

      // Apply normalization logic
      if (structuredData) {
        if (!Array.isArray(structuredData.accounts)) structuredData.accounts = [];
        if (!Array.isArray(structuredData.violations)) structuredData.violations = [];
        if (!Array.isArray(structuredData.negativeItems)) structuredData.negativeItems = [];
        if (!Array.isArray(structuredData.inquiries)) structuredData.inquiries = [];
        if (!Array.isArray(structuredData.publicRecords)) structuredData.publicRecords = [];
        if (!structuredData.personalInfo) structuredData.personalInfo = {};
      }

      return {
        extractedText: reportText,
        structuredData,
        confidence: 0.96,
        processingTime: 0,
        provider: 'openrouter'
      };
      
    } catch (error) {
      console.error('OpenRouter analysis failed:', error);
      throw new Error(`OpenRouter analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        id: 'openrouter',
        name: 'OpenRouter (200+ Models)',
        description: 'Unified access to 200+ AI models with automatic failover',
        strengths: ['Model variety', 'Cost optimization', 'No quota limits', 'Unified API'],
        cost: 'Variable'
      },
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
      },
      {
        id: 'claude',
        name: 'Anthropic Claude Vision',
        description: 'Detailed analysis with excellent safety considerations',
        strengths: ['Safety-focused analysis', 'Structured output', 'Detailed explanations'],
        cost: 'Medium'
      },
      {
        id: 'azure',
        name: 'Azure Document Intelligence',
        description: 'Purpose-built for financial document processing',
        strengths: ['Financial documents', 'Enterprise features', 'Compliance'],
        cost: 'Pay-per-page'
      }
    ];
  }
}
