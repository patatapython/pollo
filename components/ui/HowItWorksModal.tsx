'use client';

import { useEffect } from 'react';
import { useT } from '@/lib/hooks/useT';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function IconKey() {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-primary-100 border-2 border-primary-400 flex items-center justify-center">
      <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    </div>
  );
}

function IconShare() {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-retro-green-100 border-2 border-retro-green-400 flex items-center justify-center">
      <svg className="h-5 w-5 text-retro-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  );
}

function IconSave() {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-retro-yellow-100 border-2 border-retro-yellow-500 flex items-center justify-center">
      <svg className="h-5 w-5 text-retro-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </div>
  );
}

function IconPhone() {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-info-100 border-2 border-info-400 flex items-center justify-center">
      <svg className="h-5 w-5 text-info-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const t = useT();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div role="dialog" aria-modal="true" aria-labelledby="how-it-works-title" className="relative w-full max-w-lg bg-retro-cream-50 border-4 border-retro-brown-700 rounded-[25px] shadow-[8px_8px_0px_rgba(0,0,0,0.25)] overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="sticky top-0 bg-primary-500 border-b-4 border-primary-700 px-6 py-4 flex items-center justify-between rounded-t-[20px]">
          <h2 id="how-it-works-title" className="text-lg font-bold text-retro-cream-50 uppercase tracking-wide">{t('howItWorks.title')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-primary-600 border-2 border-primary-700 flex items-center justify-center hover:bg-primary-700 transition-colors"
          >
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* PILAR 1 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <IconKey />
              <div>
                <h3 className="font-bold text-retro-brown-800 uppercase tracking-wide">{t('howItWorks.s1Title')}</h3>
                <p className="text-xs text-retro-brown-500 font-bold">{t('howItWorks.s1Subtitle')}</p>
              </div>
            </div>
            <div className="bg-retro-cream-100 border-2 border-primary-300 rounded-[15px] p-4 space-y-2 text-sm text-retro-brown-700">
              <p>{t('howItWorks.s1p1')}</p>
              <p>{t('howItWorks.s1p2')}</p>
              <p className="text-retro-red-700 font-bold">{t('howItWorks.s1p3')}</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-retro-cream-200 border-2 border-primary-300 rounded-[12px] p-2 text-center">
                <p className="text-xs font-bold text-retro-brown-600 uppercase">{t('howItWorks.s1enterLabel')}</p>
                <p className="text-xs text-retro-brown-500 mt-0.5">{t('howItWorks.s1enterDesc')}</p>
              </div>
              <svg className="h-5 w-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="flex-1 bg-retro-green-50 border-2 border-retro-green-400 rounded-[12px] p-2 text-center">
                <p className="text-xs font-bold text-retro-green-800 uppercase">{t('howItWorks.s1accessLabel')}</p>
                <p className="text-xs text-retro-green-700 mt-0.5">{t('howItWorks.s1accessDesc')}</p>
              </div>
            </div>
          </section>

          <div className="border-t-2 border-retro-brown-200" />

          {/* PILAR 2 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <IconShare />
              <div>
                <h3 className="font-bold text-retro-brown-800 uppercase tracking-wide">{t('howItWorks.s2Title')}</h3>
                <p className="text-xs text-retro-brown-500 font-bold">{t('howItWorks.s2Subtitle')}</p>
              </div>
            </div>
            <div className="bg-retro-cream-100 border-2 border-primary-300 rounded-[15px] p-4 space-y-2 text-sm text-retro-brown-700">
              <p>{t('howItWorks.s2p1')}</p>
              <p className="text-retro-brown-500">{t('howItWorks.s2p2')}</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-retro-cream-200 border-2 border-primary-300 rounded-[12px] p-2 text-center">
                <p className="text-xs font-bold text-retro-brown-600 uppercase">{t('howItWorks.s2youLabel')}</p>
                <p className="text-xs text-retro-brown-500 mt-0.5">{t('howItWorks.s2youDesc')}</p>
              </div>
              <svg className="h-5 w-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="flex-1 bg-retro-green-50 border-2 border-retro-green-400 rounded-[12px] p-2 text-center">
                <p className="text-xs font-bold text-retro-green-800 uppercase">{t('howItWorks.s2themLabel')}</p>
                <p className="text-xs text-retro-green-700 mt-0.5">{t('howItWorks.s2themDesc')}</p>
              </div>
            </div>
          </section>

          <div className="border-t-2 border-retro-brown-200" />

          {/* PILAR 3 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <IconSave />
              <div>
                <h3 className="font-bold text-retro-brown-800 uppercase tracking-wide">{t('howItWorks.s3Title')}</h3>
                <p className="text-xs text-retro-brown-500 font-bold">{t('howItWorks.s3Subtitle')}</p>
              </div>
            </div>
            <div className="bg-retro-cream-100 border-2 border-primary-300 rounded-[15px] p-4 text-sm text-retro-brown-700 space-y-1">
              <p>{t('howItWorks.s3p1')}</p>
              <p>{t('howItWorks.s3p2')}</p>
            </div>
          </section>

          <div className="border-t-2 border-retro-brown-200" />

          {/* PILAR 4 */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <IconPhone />
              <div>
                <h3 className="font-bold text-retro-brown-800 uppercase tracking-wide">{t('howItWorks.s4Title')}</h3>
                <p className="text-xs text-retro-brown-500 font-bold">{t('howItWorks.s4Subtitle')}</p>
              </div>
            </div>
            <div className="bg-retro-cream-100 border-2 border-primary-300 rounded-[15px] p-4 text-sm text-retro-brown-700 space-y-3">
              <p>{t('howItWorks.s4p1')}</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-retro-brown-800 text-xs uppercase mt-0.5">iPhone/iPad</span>
                  <p className="text-retro-brown-600">{t('howItWorks.s4ios')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-retro-brown-800 text-xs uppercase mt-0.5">Android</span>
                  <p className="text-retro-brown-600">{t('howItWorks.s4android')}</p>
                </div>
              </div>
              <p className="text-retro-brown-500">{t('howItWorks.s4p2')}</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
