'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/hooks/useToast';
import { useT } from '@/lib/hooks/useT';

export function AccessPassphraseManager() {
  const toast = useToast();
  const t = useT();
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPassphrase = sessionStorage.getItem('pollo_passphrase');
      if (storedPassphrase) {
        setPassphrase(storedPassphrase);
      }
    }
  }, []);

  const handleCopyPassphrase = async () => {
    if (!passphrase) return;

    try {
      await navigator.clipboard.writeText(passphrase);
      setCopied(true);
      toast.success(t('passphraseManager.wordsCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t('passphraseManager.errorCopy'));
    }
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!passphrase) {
    return (
      <Card variant="elevated">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-retro-yellow-100 border-2 border-retro-yellow-500">
                <svg className="h-6 w-6 text-retro-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-retro-brown-800 uppercase tracking-wide">
              {t('passphraseManager.title')}
            </h2>
          </div>
          <p className="text-retro-brown-600 font-bold">{t('passphraseManager.notAvailable')}</p>
        </div>

        <div className="bg-retro-yellow-50 border-3 border-retro-yellow-500 rounded-[20px] p-5 mb-6">
          <p className="text-retro-yellow-900 font-bold text-sm">
            {t('passphraseManager.notFoundAlert')}
          </p>
          <p className="text-retro-yellow-800 text-sm mt-3">
            {t('passphraseManager.notFoundDesc')}
          </p>
        </div>
      </Card>
    );
  }

  const displayPassphrase = isVisible ? passphrase : '•'.repeat(passphrase.length);

  return (
    <Card variant="elevated">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-retro-green-100 border-2 border-retro-green-500">
              <svg className="h-6 w-6 text-retro-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.5 1A1.5 1.5 0 001 2.5v15A1.5 1.5 0 002.5 19h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0017.5 1h-15zM2 2.5a.5.5 0 01.5-.5h15a.5.5 0 01.5.5v15a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5v-15z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-retro-brown-800 uppercase tracking-wide">
            {t('passphraseManager.title')}
          </h2>
        </div>
        <p className="text-retro-brown-600 font-bold">{t('passphraseManager.subtitle')}</p>
      </div>

      {/* Passphrase display */}
      <div className="bg-retro-cream-200 rounded-[20px] p-6 mb-6 border-3 border-primary-500">
        <p className="text-xs text-retro-brown-600 mb-3 uppercase tracking-wide font-bold">{t('passphraseManager.label')}</p>
        <p className={`text-lg sm:text-xl font-bold tracking-wider select-all break-all transition-all duration-300 ${isVisible ? 'text-retro-brown-900' : 'text-retro-brown-600 letter-spacing-widest'}`}>
          {displayPassphrase}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleToggleVisibility}
          variant="secondary"
          className="flex-1"
          size="lg"
        >
          {isVisible ? (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('passphraseManager.hide')}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t('passphraseManager.show')}
            </>
          )}
        </Button>

        <Button
          onClick={handleCopyPassphrase}
          variant="primary"
          className="flex-1"
          size="lg"
        >
          {copied ? (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('passphraseManager.copied')}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('passphraseManager.copy')}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
