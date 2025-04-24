import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">CLINICA SANT GERVSI</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;