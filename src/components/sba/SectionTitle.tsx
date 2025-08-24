import React from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export function SectionTitle({ children, className, subtitle }: SectionTitleProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h2 className="text-2xl font-bold text-white mb-2">
        {children}
      </h2>
      {subtitle && (
        <p className="text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}