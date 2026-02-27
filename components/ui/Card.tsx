import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const variantStyles = {
    default: 'bg-retro-cream-100 border-3 border-primary-500 shadow-[8px_8px_0px_rgba(210,125,45,0.3)] hover:shadow-[12px_12px_0px_rgba(210,125,45,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px]',
    elevated: 'bg-retro-cream-50 border-3 border-primary-600 shadow-[12px_12px_0px_rgba(210,125,45,0.4)]',
    bordered: 'bg-retro-cream-200 border-3 border-retro-brown-500 shadow-[6px_6px_0px_rgba(130,107,79,0.25)]',
  };

  return (
    <div
      className={`rounded-[25px] p-6 transition-all duration-200 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
