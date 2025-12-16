import React from 'react';
import { StepStatus } from '@/types';

interface StatusBadgeProps {
  status: StepStatus;
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const statusStyles = {
    pending: 'bg-pod-surface border-pod-muted text-pod-muted',
    processing: 'bg-warning/20 border-warning text-warning animate-pulse',
    success: 'bg-safe/20 border-safe text-safe',
    failed: 'bg-danger/20 border-danger text-danger',
  };

  const statusIcons = {
    pending: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
      </svg>
    ),
    processing: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <span
      className={`
        inline-flex items-center gap-2 px-3 py-1
        border-2 rounded-full
        text-xs font-mono font-semibold uppercase tracking-wider
        ${statusStyles[status]}
      `}
    >
      {statusIcons[status]}
      {children}
    </span>
  );
};
