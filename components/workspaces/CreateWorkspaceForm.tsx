'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/lib/hooks/useToast';
import { useT } from '@/lib/hooks/useT';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { Spinner } from '@/components/ui/Spinner';
import { downloadBackupFile, copyToClipboard } from '@/lib/utils/download';

export function CreateWorkspaceForm() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const [isLoading, setIsLoading] = useState(false);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleCreateWorkspace = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('createWorkspace.errorCreate'));
      }

      const data = await response.json();
      setPassphrase(data.passphrase);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pollo_passphrase', data.passphrase);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('createWorkspace.errorUnknown'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassphrase = async () => {
    if (!passphrase) return;
    const success = await copyToClipboard(passphrase);
    if (success) {
      setCopied(true);
      toast.success(t('createWorkspace.wordsCopied'));
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t('createWorkspace.errorCopy'));
    }
  };

  const handleCopyShare = async () => {
    if (!passphrase) return;
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pollolist.app';
    const msg = t('createWorkspace.shareMsg', { passphrase, url: appUrl });
    const success = await copyToClipboard(msg);
    if (success) {
      setCopiedShare(true);
      toast.success(t('createWorkspace.msgCopied'));
      setTimeout(() => setCopiedShare(false), 3000);
    } else {
      toast.error(t('createWorkspace.errorCopy'));
    }
  };

  const handleDownloadBackup = async () => {
    if (!passphrase) return;
    setIsDownloading(true);
    try {
      await downloadBackupFile(passphrase);
      toast.success(t('createWorkspace.backupDownloaded'));
      setTimeout(() => router.push('/dashboard'), 800);
    } catch {
      toast.error(t('createWorkspace.backupError'));
    } finally {
      setIsDownloading(false);
    }
  };

  // ── TICKET VIEW ──────────────────────────────────────────────
  if (passphrase) {
    const words = passphrase.split(' ');

    if (showExitConfirm) {
      return (
        <Card variant="elevated" className="min-w-full">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center h-10 w-10 rounded-[12px] bg-retro-yellow-100 border-2 border-retro-yellow-500 flex-shrink-0">
              <svg className="h-5 w-5 text-retro-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-retro-brown-800 uppercase tracking-wide leading-tight">{t('createWorkspace.warningTitle')}</h2>
              <p className="text-sm text-retro-brown-600 font-bold">{t('createWorkspace.warningDesc')}</p>
            </div>
          </div>

          <div className="bg-retro-cream-200 border-2 border-primary-400 rounded-[15px] p-4 mb-5">
            <p className="text-xs text-retro-brown-500 uppercase tracking-widest font-bold mb-2 text-center">{t('createWorkspace.yourWords')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {words.map((word, i) => (
                <span key={i} className="px-3 py-1 bg-primary-500 text-retro-cream-50 font-bold rounded-[10px] border-2 border-primary-700 text-sm uppercase tracking-wide select-all">
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleDownloadBackup} disabled={isDownloading} variant="primary" size="lg" className="w-full">
              {isDownloading ? <Spinner size="sm" /> : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {t('createWorkspace.saveBefore')}
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="ghost" size="lg" className="w-full text-retro-brown-600 border-retro-brown-400">
              {t('createWorkspace.enterWithout')}
            </Button>
            <button onClick={() => setShowExitConfirm(false)} className="text-xs text-retro-brown-400 hover:text-retro-brown-600 font-bold underline underline-offset-2 text-center transition-colors">
              {t('createWorkspace.backBtn')}
            </button>
          </div>
        </Card>
      );
    }

    return (
      <Card variant="elevated" className="min-w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-retro-green-100 border-2 border-retro-green-500 flex-shrink-0">
            <svg className="h-5 w-5 text-retro-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-retro-brown-800 uppercase tracking-wide leading-tight">{t('createWorkspace.ready')}</h2>
            <p className="text-sm text-retro-brown-600 font-bold">{t('createWorkspace.readyDesc')}</p>
          </div>
        </div>

        {/* TICKET — las palabras */}
        <div className="bg-retro-cream-50 border-3 border-dashed border-primary-500 rounded-[20px] p-5 mb-5 relative overflow-hidden">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-retro-cream-200 border-2 border-retro-cream-300" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-retro-cream-200 border-2 border-retro-cream-300" />

          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-[6px] bg-primary-200 border-2 border-primary-400 flex items-center justify-center">
              <svg className="h-3 w-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-xs text-retro-brown-500 uppercase tracking-widest font-bold">{t('createWorkspace.ticket5words')}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {words.map((word, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-primary-500 text-retro-cream-50 font-bold rounded-[12px] border-2 border-primary-700 shadow-[3px_3px_0px_rgba(210,125,45,0.3)] text-sm uppercase tracking-wide select-all"
              >
                {word}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-[6px] bg-retro-brown-100 border-2 border-retro-brown-300 flex items-center justify-center">
              <svg className="h-3 w-3 text-retro-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs text-retro-brown-500 font-bold">{t('createWorkspace.photo')}</p>
          </div>
        </div>

        {/* Dos conceptos */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-retro-cream-100 border-2 border-primary-300 rounded-[15px] p-3 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-9 h-9 rounded-[10px] bg-primary-100 border-2 border-primary-400 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold text-retro-brown-800 uppercase tracking-wide">{t('createWorkspace.yourAccess')}</p>
            <p className="text-xs text-retro-brown-600 mt-1">{t('createWorkspace.yourAccessDesc')}</p>
          </div>
          <div className="bg-retro-cream-100 border-2 border-primary-300 rounded-[15px] p-3 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-9 h-9 rounded-[10px] bg-retro-green-100 border-2 border-retro-green-400 flex items-center justify-center">
                <svg className="h-5 w-5 text-retro-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold text-retro-brown-800 uppercase tracking-wide">{t('createWorkspace.shareTitle')}</p>
            <p className="text-xs text-retro-brown-600 mt-1">{t('createWorkspace.shareDesc')}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownloadBackup} disabled={isDownloading} variant="primary" size="lg" className="w-full">
            {isDownloading ? <Spinner size="sm" /> : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {t('createWorkspace.saveWords')}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleCopyPassphrase} variant="secondary" size="md" className="w-full">
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('createWorkspace.copied')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t('common.copy')}
                </>
              )}
            </Button>

            <Button onClick={handleCopyShare} variant="secondary" size="md" className="w-full">
              {copiedShare ? (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('createWorkspace.done')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {t('common.share')}
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={() => setShowExitConfirm(true)}
            variant="secondary"
            size="lg"
            className="w-full mt-1"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {t('createWorkspace.enterSaved')}
          </Button>
        </div>
      </Card>
    );
  }

  // ── FORM INICIAL ─────────────────────────────────────────────
  return (
    <Card variant="default" className="min-w-full">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-retro-brown-800 mb-2 uppercase tracking-wide">{t('createWorkspace.title')}</h2>
        <p className="text-retro-brown-600 text-sm sm:text-base">
          {t('createWorkspace.desc')}
        </p>
      </div>

      <Button
        onClick={handleCreateWorkspace}
        disabled={isLoading}
        size="lg"
        className="w-full"
        variant="primary"
      >
        {isLoading ? (
          <>
            <Spinner size="md" />
            {t('createWorkspace.creating')}
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('createWorkspace.create')}
          </>
        )}
      </Button>
    </Card>
  );
}
