import React from 'react';

const Test = () => {
  console.log('Test page: Rendering');
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ React App Working!</h1>
        <p className="text-gray-600 mb-4">
          If you can see this page, the React application is loading correctly.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• Vite is running</p>
          <p>• React is rendering</p>
          <p>• Tailwind CSS is working</p>
          <p>• TypeScript is compiling</p>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-blue-800 text-sm">
            <strong>Next steps:</strong> Check the browser console for any authentication or routing logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Test; 