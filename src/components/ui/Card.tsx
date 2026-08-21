import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export default function Card({
  children,
  className = '',
  onClick,
  interactive = false,
  padding = 'md',
}: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      className={`
        bg-white rounded-2xl border border-border
        ${paddings[padding]}
        ${interactive || onClick ? 'card-interactive cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
