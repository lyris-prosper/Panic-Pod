import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-display font-semibold mb-2 text-pod-text">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3
          bg-pod-surface/50 border-2 border-pod-border
          rounded text-pod-text font-mono
          focus:outline-none focus:border-safe focus:ring-2 focus:ring-safe/20
          transition-all duration-300
          placeholder:text-pod-muted
          resize-none
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-danger font-mono">{error}</p>
      )}
    </div>
  );
};
