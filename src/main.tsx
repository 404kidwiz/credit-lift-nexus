import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
// import SimpleTest from './SimpleTest.tsx';
import './index.css';

console.log('main.tsx: Starting application initialization');

const root = document.getElementById('root');
console.log('main.tsx: Root element found:', !!root);

if (!root) {
  console.error('main.tsx: Root element not found!');
  throw new Error('Root element not found');
}

console.log('main.tsx: Creating React root');
const reactRoot = createRoot(root);

console.log('main.tsx: Rendering App component');

try {
  reactRoot.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('main.tsx: App rendered successfully');
} catch (error) {
  console.error('main.tsx: Error rendering App:', error);
  // Fallback to simple test if App fails
  const SimpleTest = () => (
    <div style={{ padding: '20px', color: 'red' }}>
      <h1>App Failed to Load</h1>
      <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  );
  reactRoot.render(<SimpleTest />);
}
