import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/types';

interface StatusTrackerProps {
  status: ApplicationStatus;
  className?: string;
}

const STEPS = [
  { key: 'precheck', label: 'Pre-Check', description: 'Program matching' },
  { key: 'consent', label: 'Consent', description: 'Required disclosures' },
  { key: 'intake', label: 'Application', description: 'Business details' },
  { key: 'docs', label: 'Documents', description: 'Upload files' },
  { key: 'packaged', label: 'Packaged', description: 'Ready for lenders' },
  { key: 'sent_to_lender', label: 'Submitted', description: 'With SBA lender' },
] as const;

export function StatusTracker({ status, className }: StatusTrackerProps) {
  const currentIndex = STEPS.findIndex(step => step.key === status);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative flex-1">
              {/* Connection Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-6 left-1/2 w-full h-0.5 -z-10 transition-colors duration-300",
                    isCompleted ? "bg-green-500" : "bg-slate-600"
                  )}
                  style={{ transform: 'translateX(50%)' }}
                />
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-3",
                  isCompleted && "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30",
                  isCurrent && "bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-500/30 animate-pulse",
                  isUpcoming && "bg-slate-700 border-slate-600 text-slate-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="text-center">
                <h3
                  className={cn(
                    "font-semibold text-sm transition-colors duration-300",
                    isCompleted && "text-green-400",
                    isCurrent && "text-yellow-400",
                    isUpcoming && "text-slate-500"
                  )}
                >
                  {step.label}
                </h3>
                <p
                  className={cn(
                    "text-xs mt-1 transition-colors duration-300",
                    isCompleted && "text-green-300/70",
                    isCurrent && "text-yellow-300/70",
                    isUpcoming && "text-slate-600"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}