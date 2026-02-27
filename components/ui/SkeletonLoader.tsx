'use client';

interface SkeletonLoaderProps {
  variant?: 'card' | 'line' | 'grid';
  count?: number;
}

export function SkeletonLoader({ variant = 'line', count = 3 }: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-neutral-200 rounded-lg h-40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-neutral-200 rounded-lg h-12 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // 'line'
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-neutral-200 rounded h-4 animate-pulse"
        />
      ))}
    </div>
  );
}
