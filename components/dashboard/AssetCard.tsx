import React from 'react';
import { Asset } from '@/types';
import { Card } from '@/components/ui/Card';

interface AssetCardProps {
  asset: Asset;
  expanded?: boolean;
  onToggle?: () => void;
}

const chainColors = {
  btc: 'text-warning',
  eth: 'text-blue-400',
  zeta: 'text-safe',
};

const chainIcons = {
  btc: '₿',
  eth: 'Ξ',
  zeta: 'Z',
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

export const AssetCard: React.FC<AssetCardProps> = ({ asset, expanded = false, onToggle }) => {
  const hasBreakdown = asset.breakdown && asset.breakdown.length > 0;
  const isClickable = hasBreakdown && !!onToggle;
  const baseChain = getBaseChain(asset.chain);

  return (
    <Card
      hover={isClickable}
      className={`relative overflow-hidden group ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={onToggle}
    >
      {/* Chain indicator */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 text-9xl font-display pointer-events-none">
        {chainIcons[baseChain]}
      </div>

      <div className="relative z-10">
        {/* Chain name with expand indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-2xl ${chainColors[baseChain]}`}>
            {chainIcons[baseChain]}
          </span>
          <h3 className="text-xl font-display font-bold uppercase tracking-wider text-pod-text">
            {asset.symbol}
          </h3>
          <span className="text-xs font-mono text-pod-muted uppercase px-2 py-1 bg-pod-surface rounded">
            {asset.chain}
          </span>

          {/* Expand indicator */}
          {hasBreakdown && (
            <div className="ml-auto">
              <svg
                className={`w-5 h-5 text-pod-muted transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-sm text-pod-muted font-mono mb-1">
            {hasBreakdown ? 'Total Balance' : 'Balance'}
          </p>
          <p className={`text-3xl font-bold font-mono ${chainColors[baseChain]}`}>
            {asset.balance.toFixed(baseChain === 'btc' ? 8 : 4)}
          </p>
        </div>

        {/* Price and value */}
        <div className="flex items-end justify-between pt-4 border-t border-pod-border">
          <div>
            <p className="text-xs text-pod-muted font-mono mb-1">Price</p>
            <p className="text-lg font-mono text-pod-text">
              ${asset.price.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-pod-muted font-mono mb-1">Total Value</p>
            <p className="text-xl font-bold font-mono text-safe">
              ${asset.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Breakdown section (expandable) */}
        {hasBreakdown && (
          <div
            className={`overflow-hidden transition-all duration-300 ${
              expanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pt-4 border-t border-pod-border/50">
              <p className="text-xs text-pod-muted font-mono mb-3 uppercase tracking-wider">
                Breakdown by Chain
              </p>
              <div className="space-y-2">
                {asset.breakdown!.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded bg-pod-surface/30 hover:bg-pod-surface/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-mono text-pod-text font-semibold">
                        {item.chainName}
                      </p>
                      <p className="text-xs text-pod-muted font-mono mt-1">
                        {item.balance.toFixed(baseChain === 'btc' ? 8 : 4)} {asset.symbol}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-safe font-bold">
                        ${item.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover effect */}
      <div className={`absolute inset-0 border-2 rounded-lg transition-all duration-300 pointer-events-none ${
        isClickable
          ? 'border-safe/0 group-hover:border-safe/50'
          : 'border-transparent'
      }`} />
    </Card>
  );
};
