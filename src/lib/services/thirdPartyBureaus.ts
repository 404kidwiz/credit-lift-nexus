import { AIAnalysisResult } from './aiPdfAnalysis';

export interface ThirdPartyBureau {
  id: string;
  name: string;
  address: string;
  phone: string;
  reportTypes: string[];
  disputeMethods: ('online' | 'mail' | 'phone')[];
  processingTime: string;
  legalFramework: string[];
  website: string;
  successRate: number;
}

export interface DisputeLetter {
  id: string;
  bureauId: string;
  content: string;
  generatedAt: Date;
  status: 'draft' | 'sent' | 'delivered' | 'responded';
  trackingNumber?: string;
}

export interface PersonalInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  ssn?: string;
}

export const THIRD_PARTY_BUREAUS: Record<string, ThirdPartyBureau> = {
  lexisnexis: {
    id: 'lexisnexis',
    name: 'LexisNexis Risk Solutions',
    address: '1000 Alderman Drive, Alpharetta, GA 30005',
    phone: '1-866-897-8126',
    reportTypes: ['RentBureau Report', 'ResidentScore', 'Criminal Background'],
    disputeMethods: ['online', 'mail', 'phone'],
    processingTime: '30 days',
    legalFramework: ['FCRA', 'State Privacy Laws'],
    website: 'https://www.lexisnexis.com/risk/',
    successRate: 85
  },
  corelogic: {
    id: 'corelogic',
    name: 'CoreLogic Credco',
    address: '4 First American Way, Santa Ana, CA 92707',
    phone: '1-800-637-2422',
    reportTypes: ['SafeRent Report', 'Property History', 'Insurance Claims'],
    disputeMethods: ['online', 'mail'],
    processingTime: '30 days',
    legalFramework: ['FCRA', 'CLUE Database Regulations'],
    website: 'https://www.corelogic.com/',
    successRate: 82
  },
  chexsystems: {
    id: 'chexsystems',
    name: 'ChexSystems',
    address: '7805 Hudson Road, Suite 100, Woodbury, MN 55125',
    phone: '1-800-428-9623',
    reportTypes: ['Banking History', 'Overdraft Reports', 'Account Closures'],
    disputeMethods: ['online', 'mail', 'phone'],
    processingTime: '30 days',
    legalFramework: ['FCRA', 'Banking Regulations'],
    website: 'https://www.chexsystems.com/',
    successRate: 78
  },
  factortrust: {
    id: 'factortrust',
    name: 'FactorTrust',
    address: '1 Chestnut Street, Suite 1, Nashua, NH 03060',
    phone: '1-855-385-5341',
    reportTypes: ['Payday Loans', 'Check Cashing', 'Alternative Credit'],
    disputeMethods: ['online', 'mail'],
    processingTime: '30 days',
    legalFramework: ['FCRA', 'Alternative Credit Regulations'],
    website: 'https://www.factortrust.com/',
    successRate: 75
  },
  clarity: {
    id: 'clarity',
    name: 'Clarity Services',
    address: '10200 Forest Green Blvd, Louisville, KY 40223',
    phone: '1-866-390-3118',
    reportTypes: ['Subprime Credit', 'Alternative Lending', 'Debt Collection'],
    disputeMethods: ['online', 'mail'],
    processingTime: '30 days',
    legalFramework: ['FCRA', 'Subprime Lending Regulations'],
    website: 'https://www.clarityservices.com/',
    successRate: 80
  },
  innovis: {
    id: 'innovis',
    name: 'Innovis Data Solutions',
    address: '1 Columbus Center, Virginia Beach, VA 23462',
    phone: '1-800-540-2505',
    reportTypes: ['Credit Reports', 'Identity Verification', 'Fraud Detection'],
    disputeMethods: ['online', 'mail', 'phone'],
    processingTime: '30 days',
    legalFramework: ['FCRA', 'Identity Verification Laws'],
    website: 'https://www.innovis.com/',
    successRate: 88
  }
};

export class ThirdPartyBureauService {
  static async generateDisputeLetter(
    bureau: ThirdPartyBureau,
    disputeType: string,
    details: string,
    personalInfo: PersonalInfo
  ): Promise<string> {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
${personalInfo.name}
${personalInfo.address}
${personalInfo.city}, ${personalInfo.state} ${personalInfo.zip}

${currentDate}

${bureau.name}
${bureau.address}

Subject: Dispute of Inaccurate Information - FCRA Section 611

Dear ${bureau.name} Dispute Department,

I am writing to dispute inaccurate information in my consumer report. Under the FCRA, I have the right to dispute information that I believe is inaccurate, incomplete, or unverifiable.

**Dispute Type:** ${disputeType}
**Details:** ${details}

I request that you investigate this matter and either remove the inaccurate information, correct it, or provide verification.

Sincerely,
${personalInfo.name}
    `.trim();
  }

  static async identifyDisputeOpportunities(
    analysisResult: AIAnalysisResult
  ): Promise<Array<{
    bureau: ThirdPartyBureau;
    reportType: string;
    disputeOpportunity: string;
    successProbability: number;
  }>> {
    const opportunities = [];
    const text = analysisResult.extractedText.toLowerCase();

    if (text.includes('rental') || text.includes('lease')) {
      opportunities.push({
        bureau: THIRD_PARTY_BUREAUS.lexisnexis,
        reportType: 'RentBureau Report',
        disputeOpportunity: 'Rental history verification',
        successProbability: 85
      });
    }

    if (text.includes('overdraft') || text.includes('nsf')) {
      opportunities.push({
        bureau: THIRD_PARTY_BUREAUS.chexsystems,
        reportType: 'Banking History',
        disputeOpportunity: 'Overdraft dispute',
        successProbability: 78
      });
    }

    return opportunities;
  }

  static async trackDispute(disputeId: string): Promise<{
    status: 'pending' | 'received' | 'investigating' | 'completed' | 'rejected';
    lastUpdated: Date;
    estimatedCompletion?: Date;
    notes?: string;
  }> {
    // Simulate dispute tracking
    // In a real implementation, this would integrate with bureau APIs
    const statuses = ['pending', 'received', 'investigating', 'completed', 'rejected'] as const;
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      lastUpdated: new Date(),
      estimatedCompletion: randomStatus === 'investigating' ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      notes: randomStatus === 'investigating' ? 
        'Dispute is under investigation. Expected completion within 30 days.' : undefined
    };
  }

  static getBureauByReportType(reportType: string): ThirdPartyBureau | null {
    for (const bureau of Object.values(THIRD_PARTY_BUREAUS)) {
      if (bureau.reportTypes.some(type => 
        type.toLowerCase().includes(reportType.toLowerCase())
      )) {
        return bureau;
      }
    }
    return null;
  }

  static getRecommendedBureaus(analysisResult: AIAnalysisResult): ThirdPartyBureau[] {
    const text = analysisResult.extractedText.toLowerCase();
    const recommendations: ThirdPartyBureau[] = [];

    // Add recommendations based on content analysis
    if (text.includes('rental') || text.includes('lease')) {
      recommendations.push(THIRD_PARTY_BUREAUS.lexisnexis);
    }
    if (text.includes('banking') || text.includes('overdraft')) {
      recommendations.push(THIRD_PARTY_BUREAUS.chexsystems);
    }
    if (text.includes('insurance') || text.includes('property')) {
      recommendations.push(THIRD_PARTY_BUREAUS.corelogic);
    }

    // Always include Innovis as they handle general credit reports
    if (!recommendations.includes(THIRD_PARTY_BUREAUS.innovis)) {
      recommendations.push(THIRD_PARTY_BUREAUS.innovis);
    }

    return recommendations;
  }
} 