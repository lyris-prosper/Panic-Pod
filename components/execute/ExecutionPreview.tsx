'use client';

import React from 'react';
import { ExecutionPreviewItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight, Check, X } from 'lucide-react';

interface ExecutionPreviewProps {
  isOpen: boolean;
  previewItems: ExecutionPreviewItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExecutionPreview: React.FC<ExecutionPreviewProps> = ({
  isOpen,
  previewItems,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getActionColor = (action: ExecutionPreviewItem['action']) => {
    switch (action) {
      case 'transfer':
        return 'text-safe';
      case 'swap':
        return 'text-cyan-400';
      case 'skip':
        return 'text-pod-muted';
      default:
        return 'text-pod-text';
    }
  };

  const getActionIcon = (action: ExecutionPreviewItem['action']) => {
    switch (action) {
      case 'transfer':
        return <ArrowRight className="w-4 h-4" />;
      case 'swap':
        return <ArrowRight className="w-4 h-4" />;
      case 'skip':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: ExecutionPreviewItem['action']) => {
    switch (action) {
      case 'transfer':
        return 'Direct Transfer';
      case 'swap':
        return 'Cross-Chain Swap';
      case 'skip':
        return 'Skip';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="
          relative glass-panel rounded-lg w-full max-w-3xl
          max-h-[85vh] overflow-hidden
          animate-in fade-in zoom-in duration-300
          border border-safe/20
        "
      >
        {/* Header */}
        <div className="bg-pod-surface/95 backdrop-blur-md border-b border-pod-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-safe text-glow">
                EVACUATION PREVIEW
              </h2>
              <p className="text-sm text-pod-muted mt-1">
                Review your evacuation plan before execution
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-pod-muted hover:text-danger transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[55vh] custom-scrollbar">
          <div className="space-y-4">
            {previewItems.map((item, index) => (
              <div
                key={index}
                className="glass-panel p-4 rounded-lg border border-pod-border hover:border-safe/30 transition-colors"
              >
                {/* Chain and Asset */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-pod-text">
                        {item.chain}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-pod-surface/50 text-pod-muted">
                        {item.asset}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-pod-text">
                        {item.balance.toFixed(6)} {item.asset}
                      </span>
                      <span className="text-sm text-pod-muted">
                        ${item.usdValue.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Action Badge */}
                  <div className={`flex items-center gap-1.5 ${getActionColor(item.action)}`}>
                    {getActionIcon(item.action)}
                    <span className="text-sm font-medium">
                      {getActionLabel(item.action)}
                    </span>
                  </div>
                </div>

                {/* Action Details */}
                {item.action !== 'skip' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-pod-muted">Destination:</span>
                      <span className="text-pod-text font-mono text-xs break-all">
                        {item.destination}
                      </span>
                    </div>

                    {item.estimatedReceive !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-pod-muted">Estimated receive:</span>
                        <span className="text-safe font-semibold">
                          ~{item.estimatedReceive.toFixed(8)} {item.action === 'swap' ? 'BTC' : item.asset}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Warning */}
                {item.warning && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded bg-warning/10 border border-warning/30">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-warning">
                      {item.warning}
                    </span>
                  </div>
                )}

                {/* Skip Reason */}
                {item.skipReason && (
                  <div className="mt-3 text-sm text-pod-muted italic">
                    {item.skipReason}
                  </div>
                )}
              </div>
            ))}
          </div>

          {previewItems.length === 0 && (
            <div className="text-center py-12 text-pod-muted">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No assets to evacuate</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-pod-border p-6 bg-pod-surface/50">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-pod-muted">
              {previewItems.filter(item => item.action !== 'skip').length} action(s) will be executed
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
                disabled={previewItems.filter(item => item.action !== 'skip').length === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm & Execute
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
