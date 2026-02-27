'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-5 w-5 border-3',
    lg: 'h-6 w-6 border-3',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin border-primary-500 border-t-retro-cream-100 rounded-full ${sizeClasses[size]} ${className}`}
    />
  );
}
