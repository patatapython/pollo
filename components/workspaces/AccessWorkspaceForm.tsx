'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/lib/hooks/useToast';
import { useT } from '@/lib/hooks/useT';
import { Spinner } from '@/components/ui/Spinner';

export function AccessWorkspaceForm() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAccessWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/workspaces/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 429) {
          throw new Error(t('accessWorkspace.rateLimitError'));
        }

        throw new Error(data.error || t('accessWorkspace.invalidError'));
      }

      toast.success(t('accessWorkspace.successToast'));
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('accessWorkspace.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="default" className="min-w-full">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-retro-brown-800 mb-2 uppercase tracking-wide">{t('accessWorkspace.title')}</h2>
        <p className="text-retro-brown-600 text-sm sm:text-base">
          {t('accessWorkspace.desc')}
        </p>
      </div>

      <form onSubmit={handleAccessWorkspace} className="space-y-4">
        <Input
          type="text"
          placeholder={t('accessWorkspace.placeholder')}
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          disabled={isLoading}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="go"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
        />

        <Button
          type="submit"
          disabled={isLoading || !passphrase.trim()}
          size="lg"
          className="w-full"
          variant="primary"
        >
          {isLoading ? (
            <>
              <Spinner size="md" />
              {t('accessWorkspace.verifying')}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('accessWorkspace.access')}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
