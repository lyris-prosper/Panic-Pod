import React from 'react';

interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div className="flex gap-2 p-1 bg-pod-surface/50 rounded-lg border border-pod-border">
      {options.map((option) => {
        const isActive = value === option.value;
        const isDanger = option.value === 'escape';
        const isSafe = option.value === 'haven';

        const activeClass = isActive
          ? isDanger
            ? 'bg-danger/20 border-danger text-danger shadow-[0_0_15px_rgba(239,68,68,0.3)]'
            : isSafe
            ? 'bg-safe/20 border-safe text-safe shadow-[0_0_15px_rgba(34,197,94,0.3)]'
            : 'bg-pod-surface border-pod-border text-pod-text'
          : 'bg-transparent border-transparent text-pod-muted hover:text-pod-text';

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 px-4 py-3 rounded-md
              font-display font-bold text-sm uppercase tracking-wider
              border-2 transition-all duration-300
              flex items-center justify-center gap-2
              ${activeClass}
            `}
          >
            {option.icon && <span className="text-lg">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
