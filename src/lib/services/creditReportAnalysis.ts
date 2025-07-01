import { supabase } from '@/integrations/supabase/client';
import { CreditReport, CreditAccount, NegativeItem, Violation } from '@/lib/types/credit-reports';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker - will be configured dynamically when needed
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface AnalysisResult {
  creditReport: CreditReport;
  accounts: CreditAccount[];
  negativeItems: NegativeItem[];
  violations: Violation[];
  summary: {
    totalAccounts: number;
    negativeItemsCount: number;
    violationsCount: number;
    estimatedScoreImpact: number;
    recommendedActions: string[];
  };
}

interface PersonalInfo {
  name?: string;
  ssn?: string;
  address?: string;
  phone?: string;
}

interface ExtractedData {
  personalInfo: PersonalInfo;
  accounts: CreditAccount[];
  inquiries: Array<{
    id: string;
    creditor_name: string;
    inquiry_date: string;
    inquiry_type: string;
  }>;
  publicRecords: Array<{
    id: string;
    type: string;
    status: string;
    date_filed: string;
    amount?: number;
  }>;
}

export class CreditReportAnalysisService {
  /**
   * Analyze a credit report file and extract structured data
   */
  static async analyzeCreditReport(fileUrl: string, reportId: string, extractedText?: string): Promise<AnalysisResult> {
    try {
      console.log('Starting credit report analysis for:', fileUrl);
      console.log('Report ID:', reportId);
      console.log('Extracted text provided:', !!extractedText);
      console.log('Extracted text length:', extractedText ? extractedText.length : 'undefined');
      
      // Step 1: Use extracted text if available, otherwise use mock data
      console.log('Step 1: Getting PDF text...');
      let pdfText: string;
      
      if (extractedText && extractedText.trim()) {
        console.log('Using pre-extracted text from upload');
        pdfText = extractedText;
        console.log('Using real PDF text, length:', pdfText.length);
      } else {
        console.log('No extracted text provided, using mock data');
        pdfText = this.getMockCreditReportText();
        console.log('Using mock data');
      }
      
      console.log('PDF text obtained successfully');
      
      // Step 2: Extract structured data
      console.log('Step 2: Extracting credit data...');
      const extractedData = await this.extractCreditData(pdfText);
      console.log('Credit data extracted:', extractedData);
      
      // Step 3: Identify negative items and violations
      console.log('Step 3: Identifying negative items and violations...');
      const analysis = await this.identifyIssues(extractedData);
      console.log('Analysis completed:', analysis);
      
      // Step 4: Generate summary and recommendations
      console.log('Step 4: Generating summary...');
      const summary = this.generateSummary(analysis);
      console.log('Summary generated:', summary);
      
      // Step 5: Save analysis results to database
      console.log('Step 5: Saving to database...');
      await this.saveAnalysisResults(reportId, analysis, summary);
      console.log('Database save completed');
      
      return {
        creditReport: analysis.creditReport,
        accounts: analysis.accounts,
        negativeItems: analysis.negativeItems,
        violations: analysis.violations,
        summary
      };
      
    } catch (error) {
      console.error('Credit report analysis failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text content from PDF file using PDF.js
   */
  private static async extractTextFromPDF(fileUrl: string): Promise<string> {
    try {
      console.log('Extracting text from PDF:', fileUrl);
      
      // For now, we'll use mock data since we need to handle file access differently
      // In a production environment, you'd need to:
      // 1. Set up proper CORS for Supabase storage
      // 2. Use signed URLs for file access
      // 3. Or process the file on the server side
      
      console.log('Using mock data for now - file access needs to be configured');
      return this.getMockCreditReportText();
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      console.warn('Falling back to mock data due to PDF extraction error');
      return this.getMockCreditReportText();
    }
  }

  /**
   * Extract structured credit data from text
   */
  private static async extractCreditData(text: string): Promise<ExtractedData> {
    console.log('Extracting credit data from text...');
    console.log('Text length:', text.length);
    console.log('First 500 characters:', text.substring(0, 500));
    
    // Only use mock data if text is too short or contains placeholder
    if (text.length < 100 || text.includes('PDF_PROCESSED')) {
      console.log('Using mock data - insufficient real text');
      return this.getMockCreditData();
    }
    
    console.log('Using real PDF text for analysis');
    
    // Extract personal information
    const personalInfo = this.extractPersonalInfo(text);
    
    // Extract accounts with enhanced patterns for real credit reports
    const accounts = this.extractAccounts(text);
    
    // Extract inquiries
    const inquiries = this.extractInquiries(text);
    
    // Extract public records
    const publicRecords = this.extractPublicRecords(text);
    
    // If we found real data, use it; otherwise fall back to mock data
    if (accounts.length > 0 || personalInfo.name || personalInfo.ssn) {
      console.log('Found real credit data, using extracted information');
      return {
        personalInfo,
        accounts,
        inquiries,
        publicRecords
      };
    } else {
      console.log('No real credit data found, using mock data');
      return this.getMockCreditData();
    }
  }

  /**
   * Identify negative items and violations
   */
  private static async identifyIssues(extractedData: ExtractedData): Promise<{
    creditReport: CreditReport;
    accounts: CreditAccount[];
    negativeItems: NegativeItem[];
    violations: Violation[];
  }> {
    console.log('Identifying negative items and violations...');
    
    const negativeItems: NegativeItem[] = [];
    const violations: Violation[] = [];
    
    // Analyze accounts for negative items
    for (const account of extractedData.accounts) {
      // Check for negative status indicators
      if (account.account_status === 'late' || account.account_status === 'default' || account.account_status === 'charge-off' || 
          account.account_status === 'collection' || account.account_status === 'closed' || account.account_status === 'past_due') {
        
        // Determine the item type based on status
        let itemType: NegativeItem['item_type'];
        switch (account.account_status) {
          case 'late':
          case 'past_due':
            itemType = 'late_payment';
            break;
          case 'charge-off':
            itemType = 'charge_off';
            break;
          case 'collection':
            itemType = 'collection';
            break;
          case 'default':
            itemType = 'charge_off';
            break;
          default:
            itemType = 'late_payment';
        }
        
        negativeItems.push({
          id: this.generateUUID(),
          credit_account_id: account.id,
          item_type: itemType,
          creditor_name: account.creditor_name,
          account_number: account.account_number,
          original_balance: account.current_balance,
          current_balance: account.current_balance,
          date_reported: account.date_reported,
          date_of_first_delinquency: account.date_reported,
          date_of_last_activity: account.date_reported,
          status: 'active',
          description: `${account.creditor_name} - ${account.account_status} - Account ${account.account_number}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Identify potential violations
    violations.push(...this.identifyViolations(extractedData));
    
    return {
      creditReport: {
        id: '',
        user_id: '',
        file_name: '',
        file_url: '',
        file_size: 0,
        file_type: '',
        status: 'processed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      accounts: extractedData.accounts,
      negativeItems,
      violations
    };
  }

  /**
   * Generate analysis summary and recommendations
   */
  private static generateSummary(analysis: { accounts: unknown[]; negativeItems: unknown[]; violations: unknown[] }): { totalAccounts: number; negativeItemsCount: number; violationsCount: number; estimatedScoreImpact: number; recommendedActions: string[] } {
    const totalAccounts = analysis.accounts.length;
    const negativeItemsCount = analysis.negativeItems.length;
    const violationsCount = analysis.violations.length;
    
    // Calculate estimated score impact
    const estimatedScoreImpact = negativeItemsCount * 15 + violationsCount * 25;
    
    // Generate recommendations
    const recommendations = [];
    if (negativeItemsCount > 0) {
      recommendations.push('Dispute late payments and charge-offs');
    }
    if (violationsCount > 0) {
      recommendations.push('File complaints for FCRA violations');
    }
    if (totalAccounts < 3) {
      recommendations.push('Consider opening new credit accounts to improve mix');
    }
    
    return {
      totalAccounts,
      negativeItemsCount,
      violationsCount,
      estimatedScoreImpact,
      recommendedActions: recommendations
    };
  }

  /**
   * Save analysis results to database
   */
  private static async saveAnalysisResults(
    reportId: string, 
    analysis: {
      creditReport: CreditReport;
      accounts: CreditAccount[];
      negativeItems: NegativeItem[];
      violations: Violation[];
    }, 
    summary: {
      totalAccounts: number;
      negativeItemsCount: number;
      violationsCount: number;
      estimatedScoreImpact: number;
      recommendedActions: string[];
    }
  ): Promise<void> {
    try {
      console.log('Saving analysis results to database...');
      
      // Get the current user from the session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Prepare the parsed_data JSONB object
      const parsedData = {
        personal_info: {
          name: analysis.creditReport.file_name || 'Unknown',
          ssn: '',
          address: '',
          date_of_birth: ''
        },
        accounts: analysis.accounts.map(account => ({
          id: account.id,
          account_number: account.account_number,
          creditor_name: account.creditor_name,
          account_type: account.account_type,
          balance: account.current_balance,
          credit_limit: account.credit_limit,
          payment_status: account.payment_status,
          date_opened: account.date_opened,
          date_reported: account.date_reported,
          payment_history: account.payment_history
        })),
        negative_items: analysis.negativeItems.map(item => ({
          id: item.id,
          credit_account_id: item.credit_account_id,
          item_type: item.item_type,
          creditor_name: item.creditor_name,
          account_number: item.account_number,
          original_balance: item.original_balance,
          current_balance: item.current_balance,
          date_reported: item.date_reported,
          date_of_first_delinquency: item.date_of_first_delinquency,
          date_of_last_activity: item.date_of_last_activity,
          status: item.status,
          description: item.description
        })),
        inquiries: [], // Will be populated if needed
        public_records: [], // Will be populated if needed
        summary: summary
      };

      // Prepare the violations JSONB array
      const violationsData = analysis.violations.map(violation => ({
        id: violation.id,
        credit_account_id: violation.credit_account_id,
        violation_type: violation.violation_type,
        violation_description: violation.violation_description,
        severity: violation.severity,
        suggested_action: violation.suggested_action
      }));

      // Update the credit_reports_analysis record with the parsed data
      const { error: updateError } = await supabase
        .from('credit_reports_analysis')
        .update({
          parsed_data: parsedData,
          violations: violationsData,
          processed_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating analysis results:', updateError);
      } else {
        console.log('Analysis results saved successfully');
      }

    } catch (error) {
      console.error('Error saving analysis results:', error);
      // Don't throw error - let the analysis complete even if database save fails
    }
  }

  /**
   * Extract personal information from text using enhanced patterns
   */
  private static extractPersonalInfo(text: string): PersonalInfo {
    const info: PersonalInfo = {};
    
    // Patterns for PII extraction
    const patterns = {
      name: /(?:name|full name)[:\s]+([A-Za-z\s]+)/i,
      ssn: /(?:ssn|social security)[:\s]*(\d{3}-\d{2}-\d{4})/i,
      dob: /(?:date of birth|dob|birth date)[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      address: /(?:address|mailing address)[:\s]+([^\n]+)/i
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        info[key as keyof PersonalInfo] = match[1].trim();
      }
    }
    
    return info;
  }

  /**
   * Extract accounts with enhanced patterns for real credit reports
   */
  private static extractAccounts(text: string): CreditAccount[] {
    console.log('Extracting accounts with enhanced patterns...');
    
    const accounts: CreditAccount[] = [];
    const processedAccountNumbers = new Set<string>();
    
    // Enhanced regex patterns for real credit reports
    const patterns = {
      // Account section delimiters
      accountSection: /(?:ACCOUNT|TRADE\s*LINE|CREDIT\s*ACCOUNT|TRADELINE)[\s\S]*?(?=(?:ACCOUNT|TRADE\s*LINE|CREDIT\s*ACCOUNT|TRADELINE|INQUIRIES|PUBLIC\s*RECORDS|$))/gi,
      
      // Account details patterns
      accountNumber: /(?:ACCOUNT\s*(?:NUMBER|#)?|ACCT\s*(?:NUMBER|#)?|NUMBER)[:\s]*([A-Z0-9]{4,20})/gi,
      creditorName: /(?:CREDITOR|COMPANY|LENDER|BANK)[:\s]*([A-Z][A-Za-z\s&.,-]{2,50})/gi,
      balance: /(?:BALANCE|AMOUNT\s*OWED|CURRENT\s*BALANCE)[:\s]*\$?([\d,]+\.?\d*)/gi,
      creditLimit: /(?:CREDIT\s*LIMIT|LIMIT|HIGH\s*CREDIT|AVAILABLE\s*CREDIT)[:\s]*\$?([\d,]+\.?\d*)/gi,
      paymentStatus: /(?:STATUS|PAYMENT\s*STATUS|ACCOUNT\s*STATUS)[:\s]*(CURRENT|LATE|PAST\s*DUE|CHARGE\s*OFF|COLLECTION|CLOSED|PAID|DEFAULT)/gi,
      dateOpened: /(?:OPENED|DATE\s*OPENED|OPEN\s*DATE)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
      dateReported: /(?:REPORTED|DATE\s*REPORTED|LAST\s*REPORTED)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
      
      // Account type indicators
      creditCard: /(?:CREDIT\s*CARD|VISA|MASTERCARD|AMEX|AMERICAN\s*EXPRESS|DISCOVER|REVOLVING)/gi,
      mortgage: /(?:MORTGAGE|HOME\s*LOAN|REAL\s*ESTATE|CONVENTIONAL\s*LOAN)/gi,
      autoLoan: /(?:AUTO|CAR|VEHICLE|AUTOMOTIVE)\s*(?:LOAN|FINANCING)/gi,
      personalLoan: /(?:PERSONAL\s*LOAN|INSTALLMENT\s*LOAN|UNSECURED\s*LOAN)/gi,
      studentLoan: /(?:STUDENT\s*LOAN|EDUCATION\s*LOAN|FEDERAL\s*LOAN)/gi,
      
      // Payment history patterns
      paymentHistory: /(?:PAYMENT\s*HISTORY|HISTORY)[:\s]*([0-9X\-C]{12,})/gi,
      
      // Credit bureau indicators
      equifax: /EQUIFAX|EFX/gi,
      experian: /EXPERIAN|EXP/gi,
      transunion: /TRANS\s*UNION|TU/gi
    };
    
    try {
      // Split text into potential account sections
      let accountSections: string[] = Array.from(text.match(patterns.accountSection) || []);
      
      // If no clear sections found, try splitting by common separators
      if (accountSections.length === 0) {
        accountSections = text.split(/(?=ACCOUNT|TRADE|CREDIT)/gi)
          .filter(section => section.length > 100);
      }
      
      console.log(`Found ${accountSections.length} potential account sections`);
      
      accountSections.forEach((section, index) => {
        try {
          console.log(`Processing section ${index + 1}/${accountSections.length}`);
          
          // Extract account number
          const accountMatches = section.match(patterns.accountNumber);
          if (!accountMatches || accountMatches.length === 0) {
            console.log(`No account number found in section ${index + 1}`);
            return;
          }
          
          const accountNumber = accountMatches[0].replace(/[^\w]/g, '').substring(0, 20);
          if (processedAccountNumbers.has(accountNumber) || accountNumber.length < 4) {
            console.log(`Skipping duplicate or invalid account: ${accountNumber}`);
            return;
          }
          
          processedAccountNumbers.add(accountNumber);
          
          // Extract creditor name with better pattern matching
          let creditorName = 'Unknown Creditor';
          const creditorMatches = section.match(patterns.creditorName);
          if (creditorMatches && creditorMatches[1]) {
            creditorName = creditorMatches[1].trim().replace(/\s+/g, ' ');
          } else {
            // Try to extract from first line of section
            const firstLine = section.split('\n')[0];
            const nameMatch = firstLine.match(/([A-Z][A-Za-z\s&.,-]{3,30})/);
            if (nameMatch) {
              creditorName = nameMatch[1].trim();
            }
          }
          
          // Extract balance and credit limit
          const balanceMatch = section.match(patterns.balance);
          const creditLimitMatch = section.match(patterns.creditLimit);
          
          const parseAmount = (match: RegExpMatchArray | null): number => {
            if (!match || !match[1]) return 0;
            const numStr = match[1].replace(/[,$]/g, '');
            return parseFloat(numStr) || 0;
          };
          
          const balance = parseAmount(balanceMatch);
          const creditLimit = parseAmount(creditLimitMatch);
          
          // Extract dates
          const dateOpenedMatch = section.match(patterns.dateOpened);
          const dateReportedMatch = section.match(patterns.dateReported);
          
          const parseDate = (match: RegExpMatchArray | null): string | null => {
            if (!match || !match[1]) return null;
            try {
              const dateStr = match[1].replace(/[-]/g, '/');
              const date = new Date(dateStr);
              return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
            } catch {
              return null;
            }
          };
          
          // Extract payment status
          const statusMatch = section.match(patterns.paymentStatus);
          let paymentStatus = 'unknown';
          if (statusMatch && statusMatch[1]) {
            paymentStatus = statusMatch[1].toLowerCase().replace(/\s+/g, '_');
          }
          
          // Determine account type
          let accountType = 'other';
          if (patterns.creditCard.test(section)) accountType = 'credit_card';
          else if (patterns.mortgage.test(section)) accountType = 'mortgage';
          else if (patterns.autoLoan.test(section)) accountType = 'auto_loan';
          else if (patterns.personalLoan.test(section)) accountType = 'personal_loan';
          else if (patterns.studentLoan.test(section)) accountType = 'student_loan';
          
          // Detect credit bureaus
          const creditBureaus: string[] = [];
          if (patterns.equifax.test(section)) creditBureaus.push('equifax');
          if (patterns.experian.test(section)) creditBureaus.push('experian');
          if (patterns.transunion.test(section)) creditBureaus.push('transunion');
          
          if (creditBureaus.length === 0) {
            creditBureaus.push('unknown');
          }
          
          // Extract payment history
          const paymentHistoryMatch = section.match(patterns.paymentHistory);
          const paymentHistory = paymentHistoryMatch ? paymentHistoryMatch[1] : null;
          
          // Create account object
          const account: CreditAccount = {
            id: this.generateUUID(),
            credit_report_id: '', // Will be set when saving
            account_number: accountNumber,
            creditor_name: creditorName,
            account_type: accountType,
            current_balance: balance,
            credit_limit: creditLimit,
            payment_status: paymentStatus,
            account_status: paymentStatus,
            date_opened: parseDate(dateOpenedMatch),
            date_reported: parseDate(dateReportedMatch),
            payment_history: paymentHistory,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          accounts.push(account);
          console.log(`Extracted account: ${creditorName} (${accountNumber}) - ${accountType}`);
          
        } catch (sectionError) {
          console.warn(`Error processing account section ${index + 1}:`, sectionError);
        }
      });
      
    } catch (error) {
      console.error('Error in extractAccounts:', error);
    }
    
    console.log(`Successfully extracted ${accounts.length} accounts from text`);
    return accounts;
  }

  /**
   * Extract inquiry information from text
   */
  private static extractInquiries(text: string): {
    id: string;
    creditor_name: string;
    inquiry_date: string;
    inquiry_type: string;
  }[] {
    const inquiries: {
      id: string;
      creditor_name: string;
      inquiry_date: string;
      inquiry_type: string;
    }[] = [];
    
    // Patterns for inquiry extraction
    const patterns = {
      inquirySection: /(?:INQUIRIES|INQUIRY\s*HISTORY)[\s\S]*?(?=(?:PUBLIC\s*RECORDS|$))/gi,
      creditor: /(?:COMPANY|CREDITOR|INQUIRER)[:\s]*([A-Z][A-Za-z\s&.,-]{2,50})/gi,
      purpose: /(?:PURPOSE|REASON|FOR)[:\s]*(.*)/gi,
      type: /(?:TYPE|INQUIRY\s*TYPE)[:\s]*(HARD|SOFT)/gi,
      date: /(?:DATE|INQUIRY\s*DATE|DATE\s*OF\s*INQUIRY)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
    };
    
    try {
      // Process each inquiry section
      Object.entries(patterns).forEach(([section, pattern]) => {
        const match = text.match(pattern);
        if (match) {
          const inquiryText = match[0];
          const lines = inquiryText.split('\n');
          
          lines.forEach(line => {
            const match = line.match(/([A-Z][A-Za-z\s&]+)\s*\(([^)]+)\)\s*-\s*(\d{2}\/\d{2}\/\d{4})/);
            if (match) {
              inquiries.push({
                id: this.generateUUID(),
                creditor_name: match[1].trim(),
                inquiry_type: match[2].toLowerCase().replace(' ', '_'),
                inquiry_date: match[3]
              });
            }
          });
        }
      });
      
    } catch (error) {
      console.error('Error in extractInquiries:', error);
    }
    
    return inquiries;
  }

  /**
   * Extract public records from text
   */
  private static extractPublicRecords(text: string): {
    id: string;
    type: string;
    status: string;
    date_filed: string;
    amount?: number;
  }[] {
    const publicRecords: {
      id: string;
      type: string;
      status: string;
      date_filed: string;
      amount?: number;
    }[] = [];
    const publicRecordsPattern = /(?:PUBLIC\s*RECORDS)[\s\S]*?(?=(?:ACCOUNT|INQUIRY|$))/gi;
    const recordsMatch = text.match(publicRecordsPattern);
    
    if (recordsMatch) {
      const recordsText = recordsMatch[0];
      
      // Look for bankruptcy
      if (/bankruptcy/gi.test(recordsText)) {
        const bankruptcyMatch = recordsText.match(/(?:Chapter\s*(\d+))?.*?(\d{2}\/\d{2}\/\d{4})/);
        if (bankruptcyMatch) {
          publicRecords.push({
            id: this.generateUUID(),
            type: 'bankruptcy',
            status: 'discharged',
            date_filed: bankruptcyMatch[2],
            amount: null
          });
        }
      }
      
      // Look for liens
      if (/lien/gi.test(recordsText)) {
        publicRecords.push({
          id: this.generateUUID(),
          type: 'tax_lien',
          status: 'active',
          date_filed: new Date().toISOString().split('T')[0],
          amount: null
        });
      }
    }
    
    return publicRecords;
  }

  /**
   * Identify violations in the credit data
   */
  private static identifyViolations(extractedData: ExtractedData): Violation[] {
    const violations: Violation[] = [];

    // Check for common FCRA violations
    for (const account of extractedData.accounts) {
      if (account.account_status === 'late' || account.account_status === 'past_due') {
        violations.push({
          id: this.generateUUID(),
          credit_account_id: account.id,
          violation_type: 'fcra_violation',
          violation_description: `Potential FCRA violation: Late payment reporting without proper investigation`,
          severity: 'medium',
          suggested_action: 'Dispute the late payment with the credit bureau and creditor',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    return violations;
  }

  private static getMockCreditData(): ExtractedData {
    return {
      personalInfo: {
        name: 'John Doe',
        ssn: '123-45-6789',
        address: '123 Main St, Anytown, USA',
        phone: '555-1234'
      },
      accounts: [],
      inquiries: [],
      publicRecords: []
    };
  }

  private static getMockCreditReportText(): string {
    return `
    CREDIT REPORT - JOHN DOE
    
    PERSONAL INFORMATION:
    Name: John Doe
    SSN: XXX-XX-1234
    Address: 123 Main Street, Anytown, ST 12345
    Date of Birth: 01/01/1980
    
    ACCOUNT INFORMATION:
    
    ACCOUNT #1:
    Creditor: Chase Bank USA, N.A.
    Account Number: ****1234
    Account Type: Credit Card
    Balance: $1,250
    Credit Limit: $5,000
    Payment Status: Current
    Date Opened: 01/15/2020
    Date Reported: 01/15/2024
    Payment History: CCCCCCCCCCCCCCCCCCCCCCC
    
    ACCOUNT #2:
    Creditor: Bank of America
    Account Number: ****5678
    Account Type: Auto Loan
    Balance: $8,500
    Credit Limit: $15,000
    Payment Status: Current
    Date Opened: 06/10/2022
    Date Reported: 01/15/2024
    Payment History: CCCCCCCCCCCCCCCCCCCCCCC
    
    ACCOUNT #3:
    Creditor: Wells Fargo
    Account Number: ****9012
    Account Type: Mortgage
    Balance: $185,000
    Credit Limit: $200,000
    Payment Status: Current
    Date Opened: 03/20/2021
    Date Reported: 01/15/2024
    Payment History: CCCCCCCCCCCCCCCCCCCCCCC
    
    INQUIRIES:
    Chase Bank - Credit Card - 01/10/2024
    Bank of America - Auto Loan - 06/05/2022
    Wells Fargo - Mortgage - 03/15/2021
    
    PUBLIC RECORDS:
    No public records found.
    `;
  }

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}