export interface EOscarValidation {
  score: number;
  machineReadable: boolean;
  recommendations: string[];
  compliance: {
    format: boolean;
    content: boolean;
    structure: boolean;
  };
}

export interface EOscarOptimizationResult {
  originalScore: number;
  optimizedScore: number;
  optimizedContent: string;
  improvements: string[];
  compliance: EOscarValidation;
}

export class EOscarOptimizer {
  static validateLetter(letterContent: string): EOscarValidation {
    const validations = {
      hasProperHeader: this.checkHeader(letterContent),
      hasAccountInfo: this.checkAccountInfo(letterContent),
      hasDisputeReason: this.checkDisputeReason(letterContent),
      hasRequestedAction: this.checkRequestedAction(letterContent),
      hasSignature: this.checkSignature(letterContent),
      hasProperFormat: this.checkFormat(letterContent),
      hasPersonalInfo: this.checkPersonalInfo(letterContent),
      hasDate: this.checkDate(letterContent),
      hasSubject: this.checkSubject(letterContent)
    };

    const score = Object.values(validations).filter(Boolean).length / Object.keys(validations).length * 100;
    
    return {
      score: Math.round(score),
      machineReadable: score >= 85,
      recommendations: this.generateRecommendations(validations),
      compliance: {
        format: validations.hasProperFormat && validations.hasDate,
        content: validations.hasAccountInfo && validations.hasDisputeReason,
        structure: validations.hasProperHeader && validations.hasSignature
      }
    };
  }

  static optimizeLetter(letterContent: string): EOscarOptimizationResult {
    const originalValidation = this.validateLetter(letterContent);
    let optimized = letterContent;
    
    // Add proper formatting
    optimized = this.addProperFormatting(optimized);
    
    // Ensure machine readability
    optimized = this.ensureMachineReadability(optimized);
    
    // Add required elements
    optimized = this.addRequiredElements(optimized);
    
    const optimizedValidation = this.validateLetter(optimized);
    
    return {
      originalScore: originalValidation.score,
      optimizedScore: optimizedValidation.score,
      optimizedContent: optimized,
      improvements: this.getImprovements(originalValidation, optimizedValidation),
      compliance: optimizedValidation
    };
  }

  private static checkHeader(content: string): boolean {
    // Check for proper name and address format at the beginning
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 3) return false;
    
    // Check if first line looks like a name (contains letters and possibly spaces)
    const namePattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/;
    if (!namePattern.test(lines[0].trim())) return false;
    
    // Check if second line looks like an address (contains numbers and street words)
    const addressPattern = /\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/i;
    return addressPattern.test(lines[1]);
  }

  private static checkAccountInfo(content: string): boolean {
    const accountPatterns = [
      /account.{0,20}(number|#|no)/i,
      /account.{0,20}\d+/i,
      /acct.{0,20}\d+/i
    ];
    return accountPatterns.some(pattern => pattern.test(content));
  }

  private static checkDisputeReason(content: string): boolean {
    const reasons = [
      'inaccurate', 'incomplete', 'unverifiable', 'outdated', 'not mine',
      'wrong', 'error', 'mistake', 'incorrect', 'false'
    ];
    return reasons.some(reason => content.toLowerCase().includes(reason));
  }

  private static checkRequestedAction(content: string): boolean {
    const actions = [
      'remove', 'delete', 'correct', 'update', 'verify', 'investigate',
      'fix', 'resolve', 'dispute', 'challenge'
    ];
    return actions.some(action => content.toLowerCase().includes(action));
  }

  private static checkSignature(content: string): boolean {
    const signaturePatterns = [
      /sincerely,?\s*\n\n?[A-Z][a-z]+ [A-Z][a-z]+/i,
      /respectfully,?\s*\n\n?[A-Z][a-z]+ [A-Z][a-z]+/i,
      /best regards,?\s*\n\n?[A-Z][a-z]+ [A-Z][a-z]+/i
    ];
    return signaturePatterns.some(pattern => pattern.test(content));
  }

  private static checkFormat(content: string): boolean {
    // Check for proper paragraph breaks and structure
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.length >= 3 && content.length > 200;
  }

  private static checkPersonalInfo(content: string): boolean {
    const personalPatterns = [
      /name:?\s*[A-Z][a-z]+ [A-Z][a-z]+/i,
      /address:?\s*\d+/i,
      /phone:?\s*\d{3}[-.]?\d{3}[-.]?\d{4}/i
    ];
    return personalPatterns.some(pattern => pattern.test(content));
  }

  private static checkDate(content: string): boolean {
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/,
      /\d{1,2}-\d{1,2}-\d{4}/,
      /[A-Za-z]+ \d{1,2},? \d{4}/,
      /\d{1,2} [A-Za-z]+ \d{4}/
    ];
    return datePatterns.some(pattern => pattern.test(content));
  }

  private static checkSubject(content: string): boolean {
    return /subject:?\s*.+/i.test(content) || /re:?\s*.+/i.test(content);
  }

  private static generateRecommendations(validations: Record<string, boolean>): string[] {
    const recommendations: string[] = [];
    
    if (!validations.hasProperHeader) {
      recommendations.push('Add proper header with your name and address');
    }
    if (!validations.hasAccountInfo) {
      recommendations.push('Include specific account information or account numbers');
    }
    if (!validations.hasDisputeReason) {
      recommendations.push('Clearly state the reason for dispute (inaccurate, incomplete, etc.)');
    }
    if (!validations.hasRequestedAction) {
      recommendations.push('Specify the action you want taken (remove, correct, verify)');
    }
    if (!validations.hasSignature) {
      recommendations.push('Add proper signature block with "Sincerely" and your name');
    }
    if (!validations.hasProperFormat) {
      recommendations.push('Improve letter formatting with proper paragraphs and spacing');
    }
    if (!validations.hasPersonalInfo) {
      recommendations.push('Include your personal information (name, address, phone)');
    }
    if (!validations.hasDate) {
      recommendations.push('Add the current date to the letter');
    }
    if (!validations.hasSubject) {
      recommendations.push('Add a subject line describing the dispute');
    }
    
    return recommendations;
  }

  private static addProperFormatting(content: string): string {
    // Ensure proper line breaks and spacing
    let formatted = content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\n\s*\n/g, '\n\n') // Standardize paragraph breaks
      .trim();
    
    // Add proper spacing around signature
    if (!formatted.includes('\n\nSincerely') && !formatted.includes('\n\nRespectfully')) {
      formatted += '\n\nSincerely,';
    }
    
    return formatted;
  }

  private static ensureMachineReadability(content: string): string {
    // Remove special characters that might confuse OCR
    const readable = content
      .replace(/[^\w\s.,!?;:()@#$%&*+\-=[\]{}|\\:"'<>?/]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s+/g, '\n') // Remove leading spaces on lines
      .trim();
    
    return readable;
  }

  private static addRequiredElements(content: string): string {
    let enhanced = content;
    
    // Add date if missing
    if (!this.checkDate(enhanced)) {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      enhanced = `${currentDate}\n\n${enhanced}`;
    }
    
    // Add subject if missing
    if (!this.checkSubject(enhanced)) {
      enhanced = enhanced.replace(/^/, 'Subject: Dispute of Inaccurate Information\n\n');
    }
    
    return enhanced;
  }

  private static getImprovements(
    original: EOscarValidation,
    optimized: EOscarValidation
  ): string[] {
    const improvements: string[] = [];
    
    if (optimized.score > original.score) {
      improvements.push(`E-OSCAR compatibility improved from ${original.score}% to ${optimized.score}%`);
    }
    
    if (!original.machineReadable && optimized.machineReadable) {
      improvements.push('Letter is now machine-readable for automated processing');
    }
    
    if (optimized.compliance.format && !original.compliance.format) {
      improvements.push('Letter format now meets E-OSCAR requirements');
    }
    
    if (optimized.compliance.content && !original.compliance.content) {
      improvements.push('Letter content now includes all required elements');
    }
    
    return improvements;
  }

  static getBestPractices(): string[] {
    return [
      'Use clear, typed text (avoid handwriting)',
      'Include your full name and address at the top',
      'Add the current date',
      'Include a subject line',
      'Reference specific account numbers when possible',
      'Clearly state the reason for dispute',
      'Specify the action you want taken',
      'Use proper business letter format',
      'Sign the letter with your full name',
      'Keep copies of all correspondence',
      'Send via certified mail with return receipt'
    ];
  }
} 