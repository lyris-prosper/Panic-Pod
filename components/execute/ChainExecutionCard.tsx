import React from 'react';
import { ChainExecution, ExecutionStep } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AlertTriangle } from 'lucide-react';

interface ChainExecutionCardProps {
  execution: ChainExecution;
}

// Step icon rendering component
const StepIcon: React.FC<{ status: ExecutionStep['status'] }> = ({ status }) => {
  if (status === 'pending') {
    return <div className="w-6 h-6 rounded-full border-2 border-pod-muted" />;
  }
  if (status === 'processing') {
    return (
      <div className="w-6 h-6">
        <svg className="animate-spin text-warning" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="w-6 h-6 rounded-full bg-safe flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="w-6 h-6 rounded-full bg-danger flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return null;
};

// Recursive step rendering component
const StepItem: React.FC<{ step: ExecutionStep; isSubStep?: boolean }> = ({ step, isSubStep = false }) => {
  const borderColor =
    step.status === 'pending'
      ? 'border-pod-border'
      : step.status === 'processing'
      ? 'border-warning'
      : step.status === 'success'
      ? 'border-safe'
      : 'border-danger';

  const bgColor =
    step.status === 'pending'
      ? 'bg-pod-surface/30'
      : step.status === 'processing'
      ? 'bg-warning/10'
      : step.status === 'success'
      ? 'bg-safe/10'
      : 'bg-danger/10';

  return (
    <div className={isSubStep ? 'ml-6' : ''}>
      <div className={`p-4 rounded border-2 ${bgColor} ${borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StepIcon status={step.status} />
            <div className="flex-1">
              <span className={`font-mono ${isSubStep ? 'text-xs' : 'text-sm'} text-pod-text font-semibold`}>
                {step.name}
              </span>

              {/* Warning */}
              {step.warning && (
                <div className="flex items-center gap-2 mt-2 text-xs text-warning">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{step.warning}</span>
                </div>
              )}

              {/* Skip Reason */}
              {step.skipReason && (
                <div className="mt-2 text-xs text-pod-muted italic">
                  {step.skipReason}
                </div>
              )}
            </div>
          </div>

          {step.txHash && (
            <a
              href="#"
              className="text-xs text-safe hover:text-safe-dark font-mono"
              onClick={(e) => e.preventDefault()}
            >
              {step.txHash}
            </a>
          )}
        </div>
      </div>

      {/* Sub-steps */}
      {step.subSteps && step.subSteps.length > 0 && (
        <div className="mt-2 ml-4 border-l-2 border-pod-border/30 pl-2 space-y-2">
          {step.subSteps.map((subStep, index) => (
            <StepItem key={index} step={subStep} isSubStep={true} />
          ))}
        </div>
      )}
    </div>
  );
};

const chainInfo = {
  btc: { name: 'Bitcoin', icon: '₿', color: 'text-warning' },
  eth: { name: 'Ethereum', icon: 'Ξ', color: 'text-blue-400' },
  zeta: { name: 'ZetaChain', icon: 'Z', color: 'text-safe' },
};

// Map chain types to base chain for display
const getBaseChain = (chain: string): 'btc' | 'eth' | 'zeta' => {
  if (chain.includes('eth') || chain.includes('base') || chain.includes('linea')) {
    return 'eth';
  }
  if (chain.includes('zeta')) {
    return 'zeta';
  }
  return 'btc';
};

export const ChainExecutionCard: React.FC<ChainExecutionCardProps> = ({ execution }) => {
  const baseChain = getBaseChain(execution.chain);
  const info = chainInfo[baseChain];

  return (
    <Card className="relative overflow-hidden">
      {/* Background icon */}
      <div className={`absolute top-0 right-0 text-9xl font-display opacity-5 pointer-events-none ${info.color}`}>
        {info.icon}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className={`text-3xl ${info.color}`}>{info.icon}</span>
            <div>
              <h3 className="text-xl font-display font-bold text-pod-text">
                {info.name}
              </h3>
              <p className="text-xs text-pod-muted font-mono uppercase">
                {execution.chain}
              </p>
            </div>
          </div>
          <StatusBadge status={execution.status}>
            {execution.status}
          </StatusBadge>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {execution.steps.map((step, index) => (
            <StepItem key={index} step={step} />
          ))}
        </div>
      </div>
    </Card>
  );
};
