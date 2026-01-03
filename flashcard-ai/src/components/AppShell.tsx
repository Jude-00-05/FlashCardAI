// src/components/AppShell.tsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
