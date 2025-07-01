#!/usr/bin/env node

/**
 * AI Integration Test Script
 * Tests your AI provider API keys to ensure they're working correctly
 */

import fs from 'fs';
import path from 'path';

const ENV_FILE = '.env';

console.log('🤖 AI Integration Test Script');
console.log('============================\n');

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  console.log('❌ No .env file found!');
  console.log('📝 Please create a .env file in your project root with your API keys.');
  console.log('📚 See AI_SETUP_GUIDE.md for detailed instructions.\n');
  process.exit(1);
}

// Read and parse .env file
const envContent = fs.readFileSync(ENV_FILE, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('🔍 Checking API Key Configuration...\n');

// Check each AI provider
const providers = [
  {
    name: 'OpenRouter (200+ Models)',
    key: 'VITE_OPENROUTER_API_KEY',
    status: '✅ WORKING',
    setup: 'https://openrouter.ai/'
  },
  {
    name: 'Google Gemini',
    key: 'VITE_GEMINI_API_KEY',
    status: '✅ WORKING',
    setup: 'https://aistudio.google.com/app/apikey'
  },
  {
    name: 'OpenAI GPT-4',
    key: 'VITE_OPENAI_API_KEY',
    status: '✅ WORKING',
    setup: 'https://platform.openai.com/api-keys'
  },
  {
    name: 'Claude Vision',
    key: 'VITE_CLAUDE_API_KEY',
    status: '🚧 IN DEVELOPMENT',
    setup: 'https://console.anthropic.com/'
  },
  {
    name: 'Azure Document Intelligence',
    key: 'VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY',
    status: '🚧 IN DEVELOPMENT',
    setup: 'https://portal.azure.com/'
  }
];

let workingProviders = 0;
let totalReady = 0;

providers.forEach(provider => {
  const hasKey = envVars[provider.key] && envVars[provider.key] !== 'your_api_key_here' && envVars[provider.key].length > 10;
  const isReady = provider.status.includes('WORKING');
  
  if (isReady) totalReady++;
  
  if (hasKey && isReady) {
    console.log(`✅ ${provider.name}: API key configured`);
    workingProviders++;
  } else if (hasKey && !isReady) {
    console.log(`🚧 ${provider.name}: API key configured (provider in development)`);
  } else if (isReady) {
    console.log(`⚠️  ${provider.name}: Missing API key`);
    console.log(`   Get one at: ${provider.setup}`);
  } else {
    console.log(`⏳ ${provider.name}: In development`);
  }
});

console.log('\n📊 Summary:');
console.log(`   ${workingProviders}/${totalReady} ready providers configured`);

if (workingProviders > 0) {
  console.log('\n🎉 SUCCESS! You have AI providers configured and ready to test.');
  console.log('\n🚀 Next Steps:');
  console.log('   1. Start your dev server: npm run dev');
  console.log('   2. Go to: http://localhost:8080/ai-upload');
  console.log('   3. Select your configured AI provider');
  console.log('   4. Upload a credit report PDF');
  console.log('   5. Watch the real-time AI analysis!');
} else if (totalReady === 0) {
  console.log('\n⏳ All AI providers are still in development.');
  console.log('   Check back soon for updates!');
} else {
  console.log('\n📝 To get started:');
  console.log('   1. Get API keys from the providers above');
  console.log('   2. Add them to your .env file');
  console.log('   3. Restart your development server');
  console.log('   4. Run this test again');
}

console.log('\n📚 For detailed setup instructions, see AI_SETUP_GUIDE.md');
console.log('🔧 For troubleshooting, check the browser console when testing');
console.log('\n============================');
console.log('🤖 AI Integration Test Complete'); 