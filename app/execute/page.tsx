'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Navbar } from '@/components/layout/Navbar';
import { ChainExecutionCard } from '@/components/execute/ChainExecutionCard';
import { ExecutionLog } from '@/components/execute/ExecutionLog';
import { ExecutionPreview } from '@/components/execute/ExecutionPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useExecutionPreview, enrichPreviewWithEstimations } from '@/hooks/useExecutionPreview';
import { ExecutionPhase, ExecutionPreviewItem, StrategyMode, ExecutionStep, StepStatus } from '@/types';

function ExecuteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isFullyConnected,
    strategy,
    balances,
    prices,
    executions,
    executionLogs,
    startExecution,
    updateExecution,
    addLog,
    resetExecution,
  } = useStore();

  const [phase, setPhase] = useState<ExecutionPhase>('loading');
  const [mode, setMode] = useState<StrategyMode | null>(null);
  const [previewItems, setPreviewItems] = useState<ExecutionPreviewItem[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [totalValue] = useState(0);
  const [gasSpent] = useState((Math.random() * 50 + 20).toFixed(2));

  // Generate base preview (sync)
  const basePreview = useExecutionPreview(mode, strategy, balances, prices);

  // Phase 1: Loading - validate and prepare
  useEffect(() => {
    if (phase !== 'loading') return;

    // Read mode from URL
    const urlMode = searchParams.get('mode') as StrategyMode | null;

    if (!isFullyConnected) {
      router.push('/dashboard');
      return;
    }

    if (!urlMode || (urlMode !== 'escape' && urlMode !== 'haven')) {
      router.push('/dashboard');
      return;
    }

    if (!strategy) {
      router.push('/dashboard');
      return;
    }

    const config = urlMode === 'escape' ? strategy.escapeConfig : strategy.havenConfig;
    if (!config) {
      router.push('/dashboard');
      return;
    }

    setMode(urlMode);
    setPhase('preview');
  }, [phase, isFullyConnected, strategy, searchParams, router]);

  // Phase 2: Preview - enrich with estimations
  useEffect(() => {
    if (phase !== 'preview' || basePreview.length === 0) return;

    const fetchEstimations = async () => {
      const enriched = await enrichPreviewWithEstimations(basePreview);
      setPreviewItems(enriched);
    };

    fetchEstimations();
  }, [phase, basePreview]);

  // Phase 3: Executing - simulate execution
  useEffect(() => {
    if (phase !== 'executing' || !mode) return;

    setStartTime(new Date());

    // Simulate execution based on the executions from store
    const timeouts: NodeJS.Timeout[] = [];
    let totalDelay = 0;

    const processStep = (
      chainIndex: number,
      stepIndex: number,
      subStepIndex: number | null,
      status: StepStatus,
      delay: number,
      message: string,
      txHash?: string
    ) => {
      totalDelay += delay;

      const timeout = setTimeout(() => {
        const newExecution = { ...executions[chainIndex] };

        if (subStepIndex !== null && newExecution.steps[stepIndex].subSteps) {
          // Update sub-step
          newExecution.steps[stepIndex].subSteps![subStepIndex] = {
            ...newExecution.steps[stepIndex].subSteps![subStepIndex],
            status,
            txHash,
          };

          // Update parent step status
          const allSubStepsComplete = newExecution.steps[stepIndex].subSteps!.every(
            (s) => s.status === 'success' || s.skipReason
          );
          const anySubStepProcessing = newExecution.steps[stepIndex].subSteps!.some(
            (s) => s.status === 'processing'
          );

          newExecution.steps[stepIndex].status = allSubStepsComplete
            ? 'success'
            : anySubStepProcessing
            ? 'processing'
            : 'pending';
        } else {
          // Update main step
          newExecution.steps[stepIndex] = {
            ...newExecution.steps[stepIndex],
            status,
            txHash,
          };
        }

        // Update chain status
        const allStepsComplete = newExecution.steps.every(
          (s) => s.status === 'success' || s.skipReason
        );
        const anyStepProcessing = newExecution.steps.some((s) => s.status === 'processing');
        newExecution.status = allStepsComplete ? 'success' : anyStepProcessing ? 'processing' : 'pending';

        updateExecution(chainIndex, newExecution);

        // Add log
        addLog({
          timestamp: new Date().toISOString(),
          message,
          type: status === 'success' ? 'success' : status === 'failed' ? 'error' : 'info',
        });
      }, totalDelay);

      timeouts.push(timeout);
    };

    // Process each chain's executions
    executions.forEach((execution, chainIndex) => {
      execution.steps.forEach((step, stepIndex) => {
        // Skip steps with skipReason
        if (step.skipReason) {
          processStep(
            chainIndex,
            stepIndex,
            null,
            'success',
            0,
            `Skipped: ${step.skipReason}`
          );
          return;
        }

        // Process steps with sub-steps
        if (step.subSteps && step.subSteps.length > 0) {
          step.subSteps.forEach((subStep, subStepIndex) => {
            if (subStep.skipReason) {
              processStep(
                chainIndex,
                stepIndex,
                subStepIndex,
                'success',
                0,
                `${subStep.name}: Skipped - ${subStep.skipReason}`
              );
            } else {
              processStep(
                chainIndex,
                stepIndex,
                subStepIndex,
                'processing',
                500,
                `${subStep.name}...`
              );
              processStep(
                chainIndex,
                stepIndex,
                subStepIndex,
                'success',
                1500,
                `${subStep.name}: Complete`,
                `0x${Math.random().toString(16).substring(2, 10)}...`
              );
            }
          });
        } else {
          // Regular step without sub-steps
          processStep(chainIndex, stepIndex, null, 'processing', 500, `${step.name}...`);
          processStep(
            chainIndex,
            stepIndex,
            null,
            'success',
            2000,
            `${step.name}: Complete`,
            execution.chain === 'btc' ? `bc1q${Math.random().toString(36).substring(2, 10)}...` : `0x${Math.random().toString(16).substring(2, 10)}...`
          );
        }
      });
    });

    // Mark as complete
    const completeTimeout = setTimeout(() => {
      setPhase('complete');
      setIsComplete(true);
      addLog({
        timestamp: new Date().toISOString(),
        message: `${mode === 'escape' ? 'Security Escape' : 'Safe Haven'} evacuation completed successfully!`,
        type: 'success',
      });
    }, totalDelay + 1000);

    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [phase, mode, executions, updateExecution, addLog]);

  const handleConfirmPreview = () => {
    if (!mode) return;
    startExecution(mode);
    setPhase('executing');
  };

  const handleCancelPreview = () => {
    resetExecution();
    router.push('/dashboard');
  };

  const getElapsedTime = () => {
    if (!startTime) return '0:00';
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg className="animate-spin text-safe" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-pod-muted font-mono">Preparing evacuation...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Preview state
  if (phase === 'preview') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <ExecutionPreview
          isOpen={true}
          previewItems={previewItems}
          onConfirm={handleConfirmPreview}
          onCancel={handleCancelPreview}
        />
      </div>
    );
  }

  // Executing or Complete state
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status banner */}
        <div className="mb-12">
          <Card className={`p-8 border-l-4 ${isComplete ? 'border-l-safe' : 'border-l-danger'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  {!isComplete && (
                    <div className="w-4 h-4 bg-danger rounded-full animate-pulse-danger" />
                  )}
                  <h1 className={`text-4xl font-display font-black uppercase tracking-wider ${isComplete ? 'text-safe' : 'text-danger'}`}>
                    {isComplete ? 'Evacuation Complete' : 'Evacuation In Progress'}
                  </h1>
                </div>
                <p className="text-pod-muted font-mono">
                  {mode === 'escape' ? 'Security Escape' : 'Safe Haven'} Mode •
                  {startTime && ` Started at ${startTime.toLocaleTimeString()} •`} Elapsed: {getElapsedTime()}
                </p>
              </div>
              {isComplete && (
                <svg className="w-16 h-16 text-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </Card>
        </div>

        {/* Execution cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-6 text-pod-text uppercase tracking-wider">
            Chain Status
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {executions.map((execution, index) => (
              <ChainExecutionCard key={index} execution={execution} />
            ))}
          </div>
        </div>

        {/* Execution log */}
        <div className="mb-12">
          <ExecutionLog logs={executionLogs} />
        </div>

        {/* Summary (shown when complete) */}
        {isComplete && (
          <Card className="p-8 border border-safe/50 bg-safe/5">
            <h2 className="text-2xl font-display font-bold mb-6 text-safe uppercase tracking-wider">
              Evacuation Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-pod-muted font-mono mb-2">Mode</p>
                <p className="text-3xl font-display font-black text-safe">
                  {mode === 'escape' ? 'Security Escape' : 'Safe Haven'}
                </p>
              </div>
              <div>
                <p className="text-sm text-pod-muted font-mono mb-2">Gas Spent (est.)</p>
                <p className="text-3xl font-display font-black text-warning">
                  ${gasSpent}
                </p>
              </div>
              <div>
                <p className="text-sm text-pod-muted font-mono mb-2">Time Taken</p>
                <p className="text-3xl font-display font-black text-pod-text">
                  {getElapsedTime()}
                </p>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <Button
                variant="safe"
                size="lg"
                onClick={() => {
                  resetExecution();
                  router.push('/dashboard');
                }}
                className="flex-1"
              >
                Return to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function Execute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg className="animate-spin text-safe" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-pod-muted font-mono">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <ExecuteContent />
    </Suspense>
  );
}
