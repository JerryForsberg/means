import React from 'react';
import ExampleComponent from './components/ExampleComponent';

const App: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">My React App</h1>
      <ExampleComponent />
    </div>
  );
};

export default App;