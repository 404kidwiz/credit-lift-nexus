/**
 * Google Cloud Function Configuration
 * 
 * This file contains configuration settings for the Credit Report Processor GCF
 */

// Get the GCF URL from environment variables
const GCF_URL = import.meta.env.REACT_APP_GCF_URL || 'https://us-central1-creditlift.cloudfunctions.net/process-credit-report';

// Configuration object
export const gcfConfig = {
  url: GCF_URL,
  timeout: 540000, // 9 minutes to match GCF timeout
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
};

// Validation function
export function validateGCFConfig(): boolean {
  if (!gcfConfig.url) {
    console.error('GCF URL is not configured. Please set REACT_APP_GCF_URL environment variable.');
    return false;
  }
  
  if (!gcfConfig.url.includes('cloudfunctions.net')) {
    console.warn('GCF URL does not appear to be a valid Google Cloud Function URL.');
  }
  
  return true;
}

// Helper function to get the configured URL
export function getGCFUrl(): string {
  if (!validateGCFConfig()) {
    throw new Error('GCF configuration is invalid');
  }
  return gcfConfig.url;
}

export default gcfConfig; 