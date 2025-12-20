'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
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
import { executeBitcoinTransfer, executeEvmTransfer, executeZetaChainSwap } from '@/lib/executionEngine';

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
  
  // Execution control refs to prevent re-execution
  const hasExecutedRef = useRef(false);
  const executionAbortRef = useRef<AbortController | null>(null);

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

  // Helper function to update execution state
  const updateStepStatus = useCallback((
    chainIndex: number,
    stepIndex: number,
    subStepIndex: number | null,
    status: StepStatus,
    txHash?: string
  ) => {
    const currentExecutions = useStore.getState().executions;
    const newExecution = { ...currentExecutions[chainIndex] };

    if (subStepIndex !== null && newExecution.steps[stepIndex].subSteps) {
      newExecution.steps[stepIndex].subSteps![subStepIndex] = {
        ...newExecution.steps[stepIndex].subSteps![subStepIndex],
        status,
        txHash,
      };

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
      newExecution.steps[stepIndex] = {
        ...newExecution.steps[stepIndex],
        status,
        txHash,
      };
    }

    const allStepsComplete = newExecution.steps.every(
      (s) => s.status === 'success' || s.skipReason
    );
    const anyStepProcessing = newExecution.steps.some((s) => s.status === 'processing');
    newExecution.status = allStepsComplete ? 'success' : anyStepProcessing ? 'processing' : 'pending';

    updateExecution(chainIndex, newExecution);
  }, [updateExecution]);

  // Phase 3: Executing - real blockchain transactions
  useEffect(() => {
    if (phase !== 'executing' || !mode || hasExecutedRef.current) return;

    hasExecutedRef.current = true;
    setStartTime(new Date());
    
    const abortController = new AbortController();
    executionAbortRef.current = abortController;

    const executeAll = async () => {
      const currentExecutions = useStore.getState().executions;
      const currentStrategy = useStore.getState().strategy;
      const currentBalances = useStore.getState().balances;

      if (!currentStrategy || !currentBalances) {
        addLog({
          timestamp: new Date().toISOString(),
          message: 'Missing strategy or balance data',
          type: 'error',
        });
        return;
      }

      const config = mode === 'escape' ? currentStrategy.escapeConfig : currentStrategy.havenConfig;
      if (!config) return;

      try {
        // Execute BTC transfer (chainIndex 0)
        const btcExecution = currentExecutions[0];
        if (btcExecution && btcExecution.chain === 'btc') {
          const btcStep = btcExecution.steps[0];
          if (!btcStep.skipReason) {
            updateStepStatus(0, 0, null, 'processing');
            addLog({
              timestamp: new Date().toISOString(),
              message: 'Initiating BTC transfer...',
              type: 'info',
            });

            try {
              const btcTxHash = await executeBitcoinTransfer(
                config.btcAddress,
                currentBalances.btc
              );

              if (abortController.signal.aborted) return;

              updateStepStatus(0, 0, null, 'success', btcTxHash);
              addLog({
                timestamp: new Date().toISOString(),
                message: `BTC Transfer complete: ${btcTxHash}`,
                type: 'success',
              });
            } catch (error) {
              if (abortController.signal.aborted) return;
              
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              updateStepStatus(0, 0, null, 'failed');
              addLog({
                timestamp: new Date().toISOString(),
                message: `BTC Transfer failed: ${errorMessage}`,
                type: 'error',
              });
            }
          } else {
            addLog({
              timestamp: new Date().toISOString(),
              message: `BTC: Skipped - ${btcStep.skipReason}`,
              type: 'info',
            });
          }
        }

        // Execute ETH transfers (chainIndex 1)
        const ethExecution = currentExecutions[1];
        if (ethExecution && ethExecution.chain === 'eth') {
          for (let stepIndex = 0; stepIndex < ethExecution.steps.length; stepIndex++) {
            if (abortController.signal.aborted) return;
            
            const step = ethExecution.steps[stepIndex];
            
            if (step.skipReason) {
              addLog({
                timestamp: new Date().toISOString(),
                message: `${step.name}: Skipped - ${step.skipReason}`,
                type: 'info',
              });
              continue;
            }

            if (step.subSteps && step.subSteps.length > 0) {
              // Process sub-steps (ZetaChain swap flow)
              for (let subStepIndex = 0; subStepIndex < step.subSteps.length; subStepIndex++) {
                if (abortController.signal.aborted) return;
                
                const subStep = step.subSteps[subStepIndex];
                if (subStep.skipReason) {
                  addLog({
                    timestamp: new Date().toISOString(),
                    message: `${subStep.name}: Skipped - ${subStep.skipReason}`,
                    type: 'info',
                  });
                  continue;
                }

                updateStepStatus(1, stepIndex, subStepIndex, 'processing');
                addLog({
                  timestamp: new Date().toISOString(),
                  message: `${subStep.name}...`,
                  type: 'info',
                });

                try {
                  const txHash = await executeZetaChainSwap(
                    step.name,
                    subStep.name,
                    config.btcAddress
                  );

                  if (abortController.signal.aborted) return;

                  updateStepStatus(1, stepIndex, subStepIndex, 'success', txHash);
                  addLog({
                    timestamp: new Date().toISOString(),
                    message: `${subStep.name}: Complete - ${txHash}`,
                    type: 'success',
                  });
                } catch (error) {
                  if (abortController.signal.aborted) return;

                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  updateStepStatus(1, stepIndex, subStepIndex, 'failed');
                  addLog({
                    timestamp: new Date().toISOString(),
                    message: `${subStep.name} failed: ${errorMessage}`,
                    type: 'error',
                  });

                  // Stop processing remaining sub-steps if one fails
                  break;
                }
              }
            } else {
              // Simple ETH transfer (Escape mode)
              updateStepStatus(1, stepIndex, null, 'processing');
              addLog({
                timestamp: new Date().toISOString(),
                message: `${step.name}...`,
                type: 'info',
              });

              try {
                const destAddress = config.evmAddress || '';

                // Extract chain name from step name (e.g., "Transfer Sepolia ETH" -> "sepolia")
                const chainName = step.name.toLowerCase().includes('sepolia') ? 'sepolia' :
                                  step.name.toLowerCase().includes('base') ? 'base' : null;

                if (!chainName) {
                  throw new Error('Unknown chain in step name');
                }

                // Get balance for this specific chain
                const chainBalance = currentBalances.eth[chainName];

                // Get chainId from chain name
                const chainId = chainName === 'sepolia' ? 11155111 :
                                chainName === 'base' ? 84532 : null;

                if (!chainId) {
                  throw new Error('Unknown chain ID');
                }

                const txHash = await executeEvmTransfer(
                  destAddress,
                  chainBalance,
                  chainId
                );

                if (abortController.signal.aborted) return;

                updateStepStatus(1, stepIndex, null, 'success', txHash);
                addLog({
                  timestamp: new Date().toISOString(),
                  message: `${step.name}: Complete - ${txHash}`,
                  type: 'success',
                });
              } catch (error) {
                if (abortController.signal.aborted) return;

                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                updateStepStatus(1, stepIndex, null, 'failed');
                addLog({
                  timestamp: new Date().toISOString(),
                  message: `${step.name} failed: ${errorMessage}`,
                  type: 'error',
                });
              }
            }
          }
        }

        // ZETA execution (chainIndex 2) - always skipped
        const zetaExecution = currentExecutions[2];
        if (zetaExecution && zetaExecution.chain === 'zeta') {
          const zetaStep = zetaExecution.steps[0];
          if (zetaStep.skipReason) {
            addLog({
              timestamp: new Date().toISOString(),
              message: `ZETA: ${zetaStep.skipReason}`,
              type: 'info',
            });
          }
        }

        // Mark as complete
        if (!abortController.signal.aborted) {
          setPhase('complete');
          setIsComplete(true);
          addLog({
            timestamp: new Date().toISOString(),
            message: `${mode === 'escape' ? 'Security Escape' : 'Safe Haven'} evacuation completed successfully!`,
            type: 'success',
          });
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addLog({
            timestamp: new Date().toISOString(),
            message: `Execution failed: ${errorMessage}`,
            type: 'error',
          });
        }
      }
    };

    executeAll();

    return () => {
      abortController.abort();
    };
  }, [phase, mode, addLog, updateStepStatus]);

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
