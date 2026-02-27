'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AccessPassphraseManager } from '@/components/workspaces/AccessPassphraseManager';
import { useT } from '@/lib/hooks/useT';

function SettingsContent() {
  const router = useRouter();
  const t = useT();

  return (
    <div className="min-h-screen bg-retro-cream-50">
      {/* Header Retro */}
      <header className="bg-primary-500 border-b-4 border-primary-700 shadow-[0px_8px_0px_rgba(210,125,45,0.4)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-retro-cream-50 tracking-wide uppercase">
              {t('settings.title')}
            </h1>
            <p className="text-sm text-retro-cream-200 font-bold uppercase mt-1">
              {t('settings.subtitle')}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="border-white text-retro-cream-50 hover:bg-primary-600 hover:border-retro-cream-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">{t('settings.back')}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AccessPassphraseManager />
      </main>
    </div>
  );
}

export default function SettingsPage() {
  const t = useT();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-retro-cream-50 flex items-center justify-center">
        <p className="text-retro-brown-500 animate-pulse">{t('settings.loading')}</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
