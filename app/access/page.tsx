'use client';

import { useState } from 'react';
import { CreateWorkspaceForm } from '@/components/workspaces/CreateWorkspaceForm';
import { AccessWorkspaceForm } from '@/components/workspaces/AccessWorkspaceForm';
import { useT } from '@/lib/hooks/useT';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export default function AccessPage() {
  const [guideOpen, setGuideOpen] = useState(false);
  const t = useT();

  return (
    <div className="min-h-screen bg-gradient-to-br from-retro-cream-200 via-retro-cream-100 to-retro-yellow-50 flex items-center justify-center p-4 relative">
      {/* Decoraciones retro */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-20 left-20 w-4 h-4 bg-primary-500 rounded-full" />
        <div className="absolute top-40 right-32 w-6 h-6 bg-primary-400 rounded-full" />
        <div className="absolute bottom-32 left-40 w-5 h-5 bg-retro-yellow-500 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary-600 rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-retro-yellow-400 rounded-full" />
        <div className="absolute top-2/3 left-1/4 w-5 h-5 bg-primary-300 rounded-full" />
        <div className="absolute top-1/2 right-20 w-3 h-3 bg-retro-yellow-600 rounded-full" />
        <div className="absolute bottom-20 left-1/3 w-4 h-4 bg-primary-400 rounded-full" />
      </div>

      {/* Language toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle className="border-primary-400 text-primary-600 hover:border-primary-600 hover:bg-primary-50" />
      </div>

      <div className="w-full max-w-5xl relative z-10">

        {/* HERO */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex flex-col items-center mb-3">
            <img src="/logo_solo.png" alt="Pollo" className="h-40 sm:h-52 md:h-64 w-auto object-contain" />
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary-500 tracking-wider text-shadow-retro uppercase -mt-2">
              POLLO
            </h1>
          </div>
          <div className="h-1 w-24 bg-primary-500 mx-auto rounded-full mb-4" />
          <p className="text-lg sm:text-xl md:text-2xl text-retro-brown-800 font-bold px-2">
            {t('access.tagline')}
          </p>
          <p className="text-sm sm:text-base text-retro-brown-600 px-2 mt-2 max-w-md mx-auto">
            {t('access.subtitle')}
          </p>
        </div>

        {/* FORMULARIOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <CreateWorkspaceForm />
          <AccessWorkspaceForm />
        </div>

        {/* ILUSTRACIÓN + frases de uso */}
        <div className="flex flex-col items-center mt-8 sm:mt-10">
          <img
            src="/pollo1.png"
            alt={t('access.illustrationAlt')}
            className="w-full max-w-2xl h-auto"
          />
          <div className="mt-4 space-y-1 text-center px-2">
            <p className="text-sm text-retro-brown-600">{t('access.useCase1')}</p>
            <p className="text-sm text-retro-brown-600">{t('access.useCase2')}</p>
            <p className="text-sm text-retro-brown-600">{t('access.useCase3')}</p>
          </div>
        </div>

        {/* GUIA COLAPSABLE */}
        <div className="mt-8 sm:mt-10">
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full flex items-center justify-between bg-retro-cream-100 border-2 border-primary-300 rounded-[20px] px-5 py-4 hover:border-primary-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-400 flex items-center justify-center flex-shrink-0">
                <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-retro-brown-700 uppercase tracking-wide text-sm">{t('access.howItWorks')}</span>
            </div>
            <svg
              className={`h-5 w-5 text-primary-500 transition-transform duration-200 ${guideOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {guideOpen && (
            <div className="mt-2 bg-retro-cream-50 border-2 border-primary-300 rounded-[20px] p-6 space-y-5">

              {/* Paso 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 border-2 border-primary-700 flex items-center justify-center text-retro-cream-50 font-bold text-sm">1</div>
                <div>
                  <p className="font-bold text-retro-brown-800 uppercase tracking-wide text-sm">{t('access.step1Title')}</p>
                  <p className="text-sm text-retro-brown-600 mt-0.5">{t('access.step1Desc')}</p>
                </div>
              </div>

              <div className="border-t border-retro-brown-200" />

              {/* Paso 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 border-2 border-primary-700 flex items-center justify-center text-retro-cream-50 font-bold text-sm">2</div>
                <div>
                  <p className="font-bold text-retro-brown-800 uppercase tracking-wide text-sm">{t('access.step2Title')}</p>
                  <p className="text-sm text-retro-brown-600 mt-0.5">{t('access.step2Desc')}</p>
                </div>
              </div>

              <div className="border-t border-retro-brown-200" />

              {/* Paso 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-retro-green-500 border-2 border-retro-green-700 flex items-center justify-center text-retro-cream-50 font-bold text-sm">3</div>
                <div>
                  <p className="font-bold text-retro-brown-800 uppercase tracking-wide text-sm">{t('access.step3Title')}</p>
                  <p className="text-sm text-retro-brown-600 mt-0.5">{t('access.step3Desc')}</p>
                </div>
              </div>

              <div className="border-t border-retro-brown-200" />

              {/* Advertencia backup */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-[10px] bg-retro-yellow-100 border-2 border-retro-yellow-500 flex items-center justify-center">
                  <svg className="h-4 w-4 text-retro-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-retro-brown-800 uppercase tracking-wide text-sm">{t('access.warningTitle')}</p>
                  <p className="text-sm text-retro-brown-600 mt-0.5">{t('access.warningDesc')}</p>
                </div>
              </div>

              <div className="border-t border-retro-brown-200" />

              {/* Instalar como app */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-[10px] bg-info-100 border-2 border-info-400 flex items-center justify-center">
                  <svg className="h-4 w-4 text-info-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-retro-brown-800 uppercase tracking-wide text-sm">{t('howItWorks.s4Title')}</p>
                  <p className="text-sm text-retro-brown-600 mt-0.5">{t('howItWorks.s4p1')}</p>
                  <p className="text-sm text-retro-brown-600 mt-1"><span className="font-bold">iPhone/iPad:</span> {t('howItWorks.s4ios')}</p>
                  <p className="text-sm text-retro-brown-600 mt-0.5"><span className="font-bold">Android:</span> {t('howItWorks.s4android')}</p>
                </div>
              </div>

            </div>
          )}
        </div>

        <p className="text-center text-xs text-retro-brown-500 font-bold mt-6 px-2 uppercase tracking-wide">
          <a href="/legal" className="underline hover:text-primary-600 transition-colors">
            {t('access.privacy')}
          </a>
        </p>

      </div>
    </div>
  );
}
