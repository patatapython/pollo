import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-retro-brown-800 mb-3 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-retro-brown-400">{icon}</div>}
        <input
          className={`w-full px-4 py-3 border-3 rounded-[20px] bg-retro-cream-100 transition-all duration-200
            focus:outline-none focus:shadow-[8px_8px_0px_rgba(210,125,45,0.3)] focus:translate-x-[-2px] focus:translate-y-[-2px]
            placeholder:text-retro-brown-400 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-danger-500 bg-retro-red-50 shadow-[4px_4px_0px_rgba(220,38,38,0.2)]' : 'border-primary-500 shadow-[4px_4px_0px_rgba(210,125,45,0.2)]'}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-danger-700 mt-2 font-bold uppercase">{error}</p>}
      {helperText && !error && <p className="text-sm text-retro-brown-500 mt-2">{helperText}</p>}
    </div>
  );
}
