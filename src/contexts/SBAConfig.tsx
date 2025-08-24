import React, { createContext, useContext, ReactNode } from 'react';
import { SBAConfig } from '@/types';

const SBAConfigContext = createContext<SBAConfig | undefined>(undefined);

interface SBAConfigProviderProps {
  children: ReactNode;
}

export function SBAConfigProvider({ children }: SBAConfigProviderProps) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiBaseUrl) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-6 max-w-md">
          <h1 className="text-red-400 font-semibold mb-2">Configuration Error</h1>
          <p className="text-red-300 text-sm mb-4">
            Missing required environment variable: VITE_API_BASE_URL
          </p>
          <p className="text-slate-400 text-xs">
            Please set VITE_API_BASE_URL in your .env.local file:
            <br />
            <code className="bg-slate-800 px-2 py-1 rounded mt-1 block">
              VITE_API_BASE_URL=https://your-backend.onrender.com
            </code>
          </p>
        </div>
      </div>
    );
  }

  const config: SBAConfig = { apiBaseUrl };

  return (
    <SBAConfigContext.Provider value={config}>
      {children}
    </SBAConfigContext.Provider>
  );
}

export function useSBAConfig(): SBAConfig {
  const context = useContext(SBAConfigContext);
  if (!context) {
    throw new Error('useSBAConfig must be used within SBAConfigProvider');
  }
  return context;
}