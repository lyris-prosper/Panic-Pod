import React from 'react';
import { Asset } from '@/types';
import { Card } from '@/components/ui/Card';

interface AssetCardProps {
  asset: Asset;
}

const chainColors = {
  btc: 'text-warning',
  eth: 'text-blue-400',
  sol: 'text-purple-400',
};

const chainIcons = {
  btc: '₿',
  eth: 'Ξ',
  sol: '◎',
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <Card hover className="relative overflow-hidden group">
      {/* Chain indicator */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 text-9xl font-display pointer-events-none">
        {chainIcons[asset.chain]}
      </div>

      <div className="relative z-10">
        {/* Chain name */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-2xl ${chainColors[asset.chain]}`}>
            {chainIcons[asset.chain]}
          </span>
          <h3 className="text-xl font-display font-bold uppercase tracking-wider text-pod-text">
            {asset.symbol}
          </h3>
          <span className="text-xs font-mono text-pod-muted uppercase px-2 py-1 bg-pod-surface rounded">
            {asset.chain}
          </span>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-sm text-pod-muted font-mono mb-1">Balance</p>
          <p className={`text-3xl font-bold font-mono ${chainColors[asset.chain]}`}>
            {asset.balance.toFixed(asset.chain === 'btc' ? 8 : 4)}
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
            <p className="text-xs text-pod-muted font-mono mb-1">Value</p>
            <p className="text-xl font-bold font-mono text-safe">
              ${asset.usdValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 border-2 border-safe/0 group-hover:border-safe/50 rounded-lg transition-all duration-300 pointer-events-none" />
    </Card>
  );
};
