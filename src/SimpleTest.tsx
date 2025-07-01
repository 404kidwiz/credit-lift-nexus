import React from 'react';

const SimpleTest = () => {
  console.log('SimpleTest: Component rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'green' }}>✅ Basic React Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: 'white',
        border: '1px solid #ccc'
      }}>
        <strong>Debug Info:</strong>
        <ul>
          <li>React: Working ✅</li>
          <li>TypeScript: Working ✅</li>
          <li>Vite: Working ✅</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleTest; 