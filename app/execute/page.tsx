'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Navbar } from '@/components/layout/Navbar';
import { ChainExecutionCard } from '@/components/execute/ChainExecutionCard';
import { ExecutionLog } from '@/components/execute/ExecutionLog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Execute() {
  const router = useRouter();
  const {
    isFullyConnected,
    strategy,
    executions,
    executionLogs,
    startExecution,
    updateExecution,
    addLog,
    resetExecution,
    assets,
  } = useStore();

  const [startTime] = useState(new Date());
  const [isComplete, setIsComplete] = useState(false);
  const [totalValue] = useState(assets.reduce((sum, asset) => sum + asset.usdValue, 0));
  const [gasSpent] = useState((Math.random() * 50 + 20).toFixed(2));

  useEffect(() => {
    if (!isFullyConnected || !strategy) {
      router.push('/dashboard');
      return;
    }

    // Start execution
    startExecution();

    // Simulate execution progress
    const steps = [
      // BTC chain
      { chain: 0, step: 0, status: 'processing' as const, delay: 1000, message: 'Initiating BTC transfer to safe address...' },
      { chain: 0, step: 0, status: 'success' as const, delay: 3000, message: 'BTC transfer completed', txHash: 'bc1q...tx123' },

      // ETH chain
      { chain: 1, step: 0, status: 'processing' as const, delay: 1500, message: 'Approving ETH...' },
      { chain: 1, step: 0, status: 'success' as const, delay: 2500, message: 'ETH approved' },
      { chain: 1, step: 1, status: 'processing' as const, delay: 500, message: 'Swapping ETH to USDC...' },
      { chain: 1, step: 1, status: 'success' as const, delay: 4000, message: 'Swap completed', txHash: '0x4d5e6f...' },
      { chain: 1, step: 2, status: 'processing' as const, delay: 500, message: 'Bridging USDC to ZetaChain...' },
      { chain: 1, step: 2, status: 'success' as const, delay: 3500, message: 'Bridge transfer completed', txHash: '0x7g8h9i...' },

      // ZETA chain
      { chain: 2, step: 0, status: 'processing' as const, delay: 1000, message: 'Processing ZETA assets...' },
      { chain: 2, step: 0, status: 'success' as const, delay: 2500, message: 'ZETA assets processed' },
      { chain: 2, step: 1, status: 'processing' as const, delay: 500, message: 'Sending ZETA to safe address...' },
      { chain: 2, step: 1, status: 'success' as const, delay: 3000, message: 'ZETA transfer completed', txHash: '0xzeta123...' },
    ];

    let totalDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    steps.forEach((stepUpdate) => {
      totalDelay += stepUpdate.delay;

      const timeout = setTimeout(() => {
        // Update execution
        const newExecution = { ...executions[stepUpdate.chain] };
        newExecution.steps[stepUpdate.step] = {
          ...newExecution.steps[stepUpdate.step],
          status: stepUpdate.status,
          txHash: stepUpdate.txHash,
        };

        // Update chain status
        const allStepsComplete = newExecution.steps.every((s) => s.status === 'success');
        const anyStepProcessing = newExecution.steps.some((s) => s.status === 'processing');
        newExecution.status = allStepsComplete
          ? 'success'
          : anyStepProcessing
          ? 'processing'
          : 'pending';

        updateExecution(stepUpdate.chain, newExecution);

        // Add log
        addLog({
          timestamp: new Date().toISOString(),
          message: stepUpdate.message,
          type: stepUpdate.status === 'success' ? 'success' : 'info',
        });
      }, totalDelay);

      timeouts.push(timeout);
    });

    // Mark as complete
    const completeTimeout = setTimeout(() => {
      setIsComplete(true);
      addLog({
        timestamp: new Date().toISOString(),
        message: '🎉 All assets successfully evacuated!',
        type: 'success',
      });
    }, totalDelay + 1000);

    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isFullyConnected || !strategy) {
    return null;
  }

  const getElapsedTime = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
                  Started at {startTime.toLocaleTimeString()} • Elapsed: {getElapsedTime()}
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
                <p className="text-sm text-pod-muted font-mono mb-2">Total Value Evacuated</p>
                <p className="text-3xl font-display font-black text-safe">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-pod-muted font-mono mb-2">Gas Spent</p>
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
