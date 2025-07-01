import { AIAnalysisResult } from './aiPdfAnalysis';
import { EOscarOptimizer } from './eOscarOptimization';
import { ThirdPartyBureauService, ThirdPartyBureau } from './thirdPartyBureaus';

export interface EnhancedAnalysisResult extends AIAnalysisResult {
  eOscarScore: number;
  thirdPartyOpportunities: Array<{
    bureau: string;
    reportType: string;
    disputeOpportunity: string;
    successProbability: number;
  }>;
  recommendedActions: Array<{
    type: 'traditional' | 'third-party' | 'mail';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImpact: number;
  }>;
  creditScoreProjection: {
    currentScore: number;
    projectedScore: number;
    timeline: number; // months
    confidence: number;
  };
}

export interface DisputeStrategy {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedSuccessRate: number;
  estimatedTimeToComplete: number; // days
  requiredActions: string[];
  potentialScoreImpact: number;
}

export class EnhancedAIAnalysisService {
  static async analyzeWithEnhancements(
    file: File,
    aiProvider: string = 'gemini'
  ): Promise<EnhancedAnalysisResult> {
    // Use existing AI analysis
    const baseAnalysis = await this.performAIAnalysis(file, aiProvider);
    
    // Enhance with E-OSCAR optimization
    const eOscarScore = this.calculateEOscarCompatibility(baseAnalysis);
    
    // Identify third-party opportunities
    const thirdPartyOpportunities = await ThirdPartyBureauService.identifyDisputeOpportunities(baseAnalysis);
    
    // Convert to string format for the interface
    const thirdPartyOpportunitiesFormatted = thirdPartyOpportunities.map(opp => ({
      bureau: opp.bureau.name,
      reportType: opp.reportType,
      disputeOpportunity: opp.disputeOpportunity,
      successProbability: opp.successProbability
    }));
    
    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      baseAnalysis,
      thirdPartyOpportunities
    );
    
    // Calculate credit score projection
    const creditScoreProjection = this.calculateCreditScoreProjection(
      baseAnalysis,
      recommendedActions
    );
    
    return {
      ...baseAnalysis,
      eOscarScore,
      thirdPartyOpportunities: thirdPartyOpportunitiesFormatted,
      recommendedActions,
      creditScoreProjection
    };
  }

  static async generateDisputeStrategies(
    analysisResult: EnhancedAnalysisResult
  ): Promise<DisputeStrategy[]> {
    const strategies: DisputeStrategy[] = [];
    
    // Traditional bureau disputes
    if (analysisResult.structuredData.violations.length > 0) {
      strategies.push({
        id: 'traditional-fcra',
        name: 'FCRA Violations Dispute',
        description: 'Dispute FCRA violations across all three major bureaus',
        priority: 'high',
        estimatedSuccessRate: 92,
        estimatedTimeToComplete: 30,
        requiredActions: [
          'Generate dispute letters for each bureau',
          'Send via certified mail',
          'Track responses and follow up'
        ],
        potentialScoreImpact: analysisResult.structuredData.violations.length * 15
      });
    }
    
    // Third-party disputes
    analysisResult.thirdPartyOpportunities.forEach((opportunity, index) => {
      strategies.push({
        id: `third-party-${index}`,
        name: `${opportunity.bureau} Dispute`,
        description: opportunity.disputeOpportunity,
        priority: opportunity.successProbability > 80 ? 'high' : 'medium',
        estimatedSuccessRate: opportunity.successProbability,
        estimatedTimeToComplete: 45,
        requiredActions: [
          `Generate ${opportunity.bureau} dispute letter`,
          'Send via certified mail',
          'Track dispute progress'
        ],
        potentialScoreImpact: Math.round(opportunity.successProbability / 5)
      });
    });
    
    // Mail service strategy
    if (strategies.filter(s => s.priority === 'high').length > 0) {
      strategies.push({
        id: 'certified-mail',
        name: 'Certified Mail Service',
        description: 'Use USPS certified mail for legal documentation',
        priority: 'medium',
        estimatedSuccessRate: 95,
        estimatedTimeToComplete: 7,
        requiredActions: [
          'Prepare certified mail packages',
          'Send via USPS certified mail',
          'Track delivery confirmations'
        ],
        potentialScoreImpact: 10
      });
    }
    
    return strategies.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  static async optimizeDisputeLetters(
    letterContent: string,
    bureauType: 'traditional' | 'third-party'
  ): Promise<{
    originalContent: string;
    optimizedContent: string;
    improvements: string[];
    eOscarScore: number;
  }> {
    const optimization = EOscarOptimizer.optimizeLetter(letterContent);
    
    return {
      originalContent: letterContent,
      optimizedContent: optimization.optimizedContent,
      improvements: optimization.improvements,
      eOscarScore: optimization.optimizedScore
    };
  }

  private static calculateEOscarCompatibility(analysis: AIAnalysisResult): number {
    // Calculate E-OSCAR compatibility score based on extracted data
    let score = 0;
    
    if (analysis.structuredData.personalInfo) score += 20;
    if (analysis.structuredData.accounts.length > 0) score += 30;
    if (analysis.structuredData.negativeItems.length > 0) score += 25;
    if (analysis.structuredData.violations.length > 0) score += 25;
    
    return Math.min(score, 100);
  }

  private static generateRecommendedActions(
    analysis: AIAnalysisResult,
    thirdPartyOpportunities: Array<{
      bureau: ThirdPartyBureau;
      reportType: string;
      disputeOpportunity: string;
      successProbability: number;
    }>
  ): Array<{
    type: 'traditional' | 'third-party' | 'mail';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImpact: number;
  }> {
    const actions = [];
    
    // Traditional bureau disputes
    if (analysis.structuredData.violations.length > 0) {
      actions.push({
        type: 'traditional' as const,
        priority: 'high' as const,
        description: `Dispute ${analysis.structuredData.violations.length} FCRA violations`,
        estimatedImpact: analysis.structuredData.violations.length * 15
      });
    }
    
    // Third-party disputes
    thirdPartyOpportunities.forEach(opportunity => {
      actions.push({
        type: 'third-party' as const,
        priority: opportunity.successProbability > 80 ? 'high' as const : 'medium' as const,
        description: `${opportunity.bureau.name}: ${opportunity.disputeOpportunity}`,
        estimatedImpact: Math.round(opportunity.successProbability / 5)
      });
    });
    
    // Mail service recommendations
    if (actions.filter(a => a.priority === 'high').length > 0) {
      actions.push({
        type: 'mail' as const,
        priority: 'medium' as const,
        description: 'Send certified mail for legal documentation',
        estimatedImpact: 10
      });
    }
    
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static calculateCreditScoreProjection(
    analysis: AIAnalysisResult,
    recommendedActions: Array<{
      type: 'traditional' | 'third-party' | 'mail';
      priority: 'high' | 'medium' | 'low';
      description: string;
      estimatedImpact: number;
    }>
  ): {
    currentScore: number;
    projectedScore: number;
    timeline: number;
    confidence: number;
  } {
    // Simulate credit score calculation
    const currentScore = 650; // This would come from the analysis
    const totalPotentialImpact = recommendedActions.reduce((sum, action) => sum + action.estimatedImpact, 0);
    const projectedScore = Math.min(currentScore + totalPotentialImpact, 850);
    
    // Calculate timeline based on action types
    const timeline = recommendedActions.length * 30; // 30 days per action
    
    // Calculate confidence based on success rates
    const avgSuccessRate = recommendedActions.length > 0 ? 
      recommendedActions.reduce((sum, action) => sum + (action.type === 'traditional' ? 92 : 80), 0) / recommendedActions.length : 0;
    
    return {
      currentScore,
      projectedScore,
      timeline,
      confidence: Math.round(avgSuccessRate)
    };
  }

  private static async performAIAnalysis(file: File, provider: string): Promise<AIAnalysisResult> {
    // This should integrate with your existing AI analysis service
    // For now, return a mock result
    return {
      extractedText: 'Mock extracted text from credit report',
      structuredData: {
        personalInfo: { name: 'John Doe', ssn: '123-45-6789' },
        accounts: [],
        negativeItems: [],
        violations: [],
        inquiries: [],
        publicRecords: []
      },
      confidence: 0.95,
      processingTime: 5000,
      provider: provider
    };
  }
} 