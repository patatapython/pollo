import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-bold rounded-[20px] transition-all duration-150 focus:outline-none border-3 min-h-[48px] flex items-center justify-center uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-primary-500 text-retro-cream-50 border-primary-500 shadow-[8px_8px_0px_rgba(210,125,45,0.3)] hover:shadow-[4px_4px_0px_rgba(210,125,45,0.3)] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-[2px_2px_0px_rgba(210,125,45,0.4)] active:translate-x-[6px] active:translate-y-[6px] focus:ring-2 focus:ring-primary-400 disabled:bg-neutral-300 disabled:border-neutral-300 disabled:shadow-none',
    secondary:
      'bg-retro-cream-300 text-retro-brown-800 border-retro-brown-500 shadow-[8px_8px_0px_rgba(130,107,79,0.3)] hover:shadow-[4px_4px_0px_rgba(130,107,79,0.3)] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-[2px_2px_0px_rgba(130,107,79,0.4)] active:translate-x-[6px] active:translate-y-[6px] focus:ring-2 focus:ring-retro-brown-400 disabled:bg-neutral-200 disabled:border-neutral-300 disabled:shadow-none',
    danger:
      'bg-danger-500 text-white border-danger-500 shadow-[8px_8px_0px_rgba(220,38,38,0.3)] hover:shadow-[4px_4px_0px_rgba(220,38,38,0.3)] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-[2px_2px_0px_rgba(220,38,38,0.4)] active:translate-x-[6px] active:translate-y-[6px] focus:ring-2 focus:ring-danger-400 disabled:bg-neutral-300 disabled:border-neutral-300 disabled:shadow-none',
    ghost:
      'bg-transparent border-primary-500 text-primary-600 hover:bg-retro-cream-200 hover:translate-x-[1px] hover:translate-y-[1px] focus:ring-2 focus:ring-primary-300 disabled:border-neutral-300 disabled:text-neutral-400',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-5 py-3 text-base gap-2',
    lg: 'px-6 py-3.5 text-lg gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
