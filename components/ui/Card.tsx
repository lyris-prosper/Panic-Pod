import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  corners?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  corners = true,
}) => {
  return (
    <div
      className={`
        glass-panel rounded-lg p-6
        ${corners ? 'hud-corner' : ''}
        ${hover ? 'hover:border-safe/50 transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
