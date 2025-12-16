import React, { useEffect, useRef } from 'react';
import { ExecutionLog as ExecutionLogType } from '@/types';
import { Card } from '@/components/ui/Card';

interface ExecutionLogProps {
  logs: ExecutionLogType[];
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (type: ExecutionLogType['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-safe';
      case 'error':
        return 'text-danger';
      case 'warning':
        return 'text-warning';
    }
  };

  const getLogIcon = (type: ExecutionLogType['type']) => {
    switch (type) {
      case 'info':
        return '►';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
    }
  };

  return (
    <Card className="h-96 overflow-hidden flex flex-col">
      <h3 className="text-lg font-display font-bold text-pod-text mb-4 uppercase tracking-wider">
        Execution Log
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index} className="flex gap-3">
            <span className="text-pod-muted shrink-0">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className={getLogColor(log.type)}>{getLogIcon(log.type)}</span>
            <span className="text-pod-text">{log.message}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </Card>
  );
};
