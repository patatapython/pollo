'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/lib/hooks/useT';

interface AddItemFormProps {
  onSubmit: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export function AddItemForm({ onSubmit, isLoading }: AddItemFormProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('addItem.emptyError'));
      return;
    }

    try {
      await onSubmit(name);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addItem.addError'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 text-danger-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Input
          type="text"
          placeholder={t('addItem.placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          maxLength={400}
          className="flex-1"
          autoFocus
        />
        <Button
          type="submit"
          disabled={isLoading || !name.trim()}
          variant="primary"
          size="lg"
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Spinner size="md" />
              {t('addItem.adding')}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addItem.add')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
