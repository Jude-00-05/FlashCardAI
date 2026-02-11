// src/components/AppShell.tsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="app-shell flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
};
