import { NegativeItem, Violation } from '@/lib/types/credit-reports';

export interface DisputeLetter {
  id: string;
  title: string;
  content: string;
  recipient: string;
  subject: string;
  date: string;
  type: 'dispute' | 'complaint' | 'verification';
  status: 'draft' | 'sent' | 'responded';
  negativeItemId?: string;
  violationId?: string;
}

export interface LetterTemplate {
  type: string;
  title: string;
  subject: string;
  content: string;
  variables: string[];
}

export class DisputeLetterGenerator {
  private static templates: LetterTemplate[] = [
    {
      type: 'dispute',
      title: 'Credit Dispute Letter',
      subject: 'Dispute of Inaccurate Information',
      content: `[DATE]

[CREDIT_BUREAU_NAME]
[ADDRESS]

Subject: Dispute of Inaccurate Information

Dear [CREDIT_BUREAU],

I am writing to dispute the following inaccurate information in my credit report. The items I am disputing are circled on the attached copy of my credit report.

Account: [ACCOUNT_NUMBER]
Creditor: [CREDITOR_NAME]
Reason for Dispute: [DISPUTE_REASON]

I am requesting that this item be removed from my credit report as soon as possible.

Sincerely,
[YOUR_NAME]
[YOUR_ADDRESS]
[YOUR_PHONE]`,
      variables: ['DATE', 'CREDIT_BUREAU_NAME', 'ADDRESS', 'CREDIT_BUREAU', 'ACCOUNT_NUMBER', 'CREDITOR_NAME', 'DISPUTE_REASON', 'YOUR_NAME', 'YOUR_ADDRESS', 'YOUR_PHONE']
    },
    {
      type: 'complaint',
      title: 'FCRA Violation Complaint',
      subject: 'Complaint Regarding FCRA Violation',
      content: `[DATE]

[CREDIT_BUREAU_NAME]
[ADDRESS]

Subject: Complaint Regarding FCRA Violation - Section [FCRA_SECTION]

Dear [CREDIT_BUREAU],

I am filing a formal complaint regarding a violation of the Fair Credit Reporting Act (FCRA) Section [FCRA_SECTION].

Violation Details:
- Account: [ACCOUNT_NUMBER]
- Creditor: [CREDITOR_NAME]
- Violation: [VIOLATION_DESCRIPTION]
- Potential Damages: $[DAMAGES]

I am requesting immediate correction of this violation and appropriate compensation for damages incurred.

Sincerely,
[YOUR_NAME]
[YOUR_ADDRESS]
[YOUR_PHONE]`,
      variables: ['DATE', 'CREDIT_BUREAU_NAME', 'ADDRESS', 'CREDIT_BUREAU', 'FCRA_SECTION', 'ACCOUNT_NUMBER', 'CREDITOR_NAME', 'VIOLATION_DESCRIPTION', 'DAMAGES', 'YOUR_NAME', 'YOUR_ADDRESS', 'YOUR_PHONE']
    },
    {
      type: 'verification',
      title: 'Request for Verification',
      subject: 'Request for Verification of Disputed Information',
      content: `[DATE]

[CREDITOR_NAME]
[ADDRESS]

Subject: Request for Verification of Disputed Information

Dear [CREDITOR_NAME],

I am writing to request verification of the following information that appears on my credit report:

Account Number: [ACCOUNT_NUMBER]
Disputed Information: [DISPUTED_INFO]
Reason for Dispute: [DISPUTE_REASON]

Please provide documentation verifying the accuracy of this information within 30 days as required by the Fair Credit Reporting Act.

Sincerely,
[YOUR_NAME]
[YOUR_ADDRESS]
[YOUR_PHONE]`,
      variables: ['DATE', 'CREDITOR_NAME', 'ADDRESS', 'ACCOUNT_NUMBER', 'DISPUTED_INFO', 'DISPUTE_REASON', 'YOUR_NAME', 'YOUR_ADDRESS', 'YOUR_PHONE']
    }
  ];

  /**
   * Generate a dispute letter for a negative item
   */
  static async generateDisputeLetter(
    negativeItem: NegativeItem,
    userInfo: { name?: string; address?: string; phone?: string },
    type: 'dispute' | 'complaint' | 'verification' = 'dispute'
  ): Promise<DisputeLetter> {
    try {
      console.log('Generating dispute letter for:', negativeItem);
      
      // Get the appropriate template
      const template = this.templates.find(t => t.type === type);
      if (!template) {
        throw new Error(`Template not found for type: ${type}`);
      }
      
      // Generate dispute reason based on item type
      const disputeReason = this.generateDisputeReason(negativeItem);
      
      // Fill in template variables
      const content = this.fillTemplate(template.content, {
        DATE: new Date().toLocaleDateString(),
        CREDIT_BUREAU_NAME: 'Equifax Information Services LLC',
        ADDRESS: 'P.O. Box 740256, Atlanta, GA 30374',
        CREDIT_BUREAU: 'Equifax',
        ACCOUNT_NUMBER: negativeItem.account_number || negativeItem.credit_account_id,
        CREDITOR_NAME: negativeItem.creditor_name || this.extractCreditorName(negativeItem.description || ''),
        DISPUTE_REASON: disputeReason,
        YOUR_NAME: userInfo.name || 'Consumer',
        YOUR_ADDRESS: userInfo.address || '[YOUR ADDRESS]',
        YOUR_PHONE: userInfo.phone || '[YOUR PHONE]',
        FCRA_SECTION: '605(a)(4)',
        VIOLATION_DESCRIPTION: 'Reporting outdated information',
        DAMAGES: '1000'
      });
      
      const letter: DisputeLetter = {
        id: `letter_${Date.now()}_${Math.random()}`,
        title: template.title,
        content,
        recipient: 'Equifax Information Services LLC',
        subject: template.subject,
        date: new Date().toISOString(),
        type,
        status: 'draft',
        negativeItemId: negativeItem.id
      };
      
      console.log('Generated dispute letter:', letter);
      return letter;
      
    } catch (error) {
      console.error('Failed to generate dispute letter:', error);
      throw new Error(`Letter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a violation letter (alias for complaint letter)
   */
  static async generateViolationLetter(
    violation: Violation,
    userInfo: { name?: string; address?: string; phone?: string }
  ): Promise<DisputeLetter> {
    return this.generateComplaintLetter(violation, userInfo);
  }

  /**
   * Generate a complaint letter for a violation
   */
  static async generateComplaintLetter(
    violation: Violation,
    userInfo: { name?: string; address?: string; phone?: string }
  ): Promise<DisputeLetter> {
    try {
      console.log('Generating complaint letter for:', violation);
      
      const template = this.templates.find(t => t.type === 'complaint');
      if (!template) {
        throw new Error('Complaint template not found');
      }
      
      // Use the enhanced violation data if available
      const legalBasis = violation.legal_basis || violation.violation_code || 'FCRA 605(a)(4)';
      const violationDescription = violation.description || violation.title || 'Credit reporting violation';
      const potentialDamages = violation.potential_damages || '1000';
      const recommendedAction = violation.recommended_action || 'Investigation and correction';
      
      const content = this.fillTemplate(template.content, {
        DATE: new Date().toLocaleDateString(),
        CREDIT_BUREAU_NAME: 'Consumer Financial Protection Bureau',
        ADDRESS: '1700 G Street NW, Washington, DC 20552',
        CREDIT_BUREAU: 'CFPB',
        FCRA_SECTION: legalBasis,
        ACCOUNT_NUMBER: violation.negative_item_id || violation.credit_account_id || violation.affected_account || 'Unknown',
        CREDITOR_NAME: violation.creditor_name || this.extractCreditorName(violation.affected_account || ''),
        VIOLATION_DESCRIPTION: violationDescription,
        DAMAGES: potentialDamages,
        YOUR_NAME: userInfo.name || 'Consumer',
        YOUR_ADDRESS: userInfo.address || '[YOUR ADDRESS]',
        YOUR_PHONE: userInfo.phone || '[YOUR PHONE]'
      });
      
      const letter: DisputeLetter = {
        id: `letter_${Date.now()}_${Math.random()}`,
        title: `FCRA Violation Complaint - ${violation.title || 'Credit Reporting Violation'}`,
        content,
        recipient: 'Consumer Financial Protection Bureau',
        subject: `Complaint Regarding ${legalBasis} Violation`,
        date: new Date().toISOString(),
        type: 'complaint',
        status: 'draft',
        violationId: violation.id
      };
      
      console.log('Generated complaint letter:', letter);
      return letter;
      
    } catch (error) {
      console.error('Failed to generate complaint letter:', error);
      throw new Error(`Complaint letter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate dispute reason based on negative item type
   */
  private static generateDisputeReason(negativeItem: NegativeItem): string {
    const reasons = {
      'late_payment': 'I have no record of this late payment and request verification of this information.',
      'charge_off': 'This account was never charged off and I dispute the accuracy of this information.',
      'collection': 'I dispute this collection account and request verification of the debt.',
      'bankruptcy': 'I dispute this bankruptcy filing and request verification of this information.',
      'foreclosure': 'I dispute this foreclosure and request verification of this information.',
      'repossession': 'I dispute this repossession and request verification of this information.',
      'tax_lien': 'I dispute this tax lien and request verification of this information.',
      'judgment': 'I dispute this judgment and request verification of this information.',
      'inquiry': 'I did not authorize this credit inquiry and request its removal.'
    };
    
    return reasons[negativeItem.item_type] || 
           'I dispute the accuracy of this information and request verification.';
  }

  /**
   * Extract creditor name from description
   */
  private static extractCreditorName(description: string): string {
    // Simple extraction - in production, you'd use more sophisticated parsing
    const parts = description.split(' - ');
    return parts[0] || 'Unknown Creditor';
  }

  /**
   * Fill template with variables
   */
  private static fillTemplate(template: string, variables: Record<string, string>): string {
    let content = template;
    
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    }
    
    return content;
  }

  /**
   * Get available letter templates
   */
  static getTemplates(): LetterTemplate[] {
    return this.templates;
  }

  /**
   * Save letter to database (placeholder for future implementation)
   */
  static async saveLetter(letter: DisputeLetter): Promise<void> {
    console.log('Saving letter to database:', letter);
    // TODO: Implement database save
  }
} 