'use client';

import { useRouter } from 'next/navigation';
import { useT } from '@/lib/hooks/useT';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export default function LegalPage() {
  const router = useRouter();
  const t = useT();

  const sections = [
    { title: t('legal.privacyTitle'), paragraphs: [t('legal.privacyP1'), t('legal.privacyP2'), t('legal.privacyP3')] },
    { title: t('legal.dataTitle'), paragraphs: [t('legal.dataP1'), t('legal.dataP2'), t('legal.dataP3')] },
    { title: t('legal.trackingTitle'), paragraphs: [t('legal.trackingP1')] },
    { title: t('legal.openSourceTitle'), paragraphs: [t('legal.openSourceP1')] },
    { title: t('legal.licenseTitle'), paragraphs: [t('legal.licenseP1')] },
    { title: t('legal.authorTitle'), paragraphs: [t('legal.authorP1')] },
  ];

  return (
    <div className="min-h-screen bg-retro-cream-50">
      {/* Header */}
      <header className="bg-primary-500 border-b-4 border-primary-700 shadow-[0px_8px_0px_rgba(210,125,45,0.4)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white font-bold uppercase tracking-wide text-sm hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('legal.back')}
          </button>
          <LanguageToggle className="border-white text-white hover:bg-white/20" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-retro-brown-800 uppercase tracking-wide mb-8">
          {t('legal.title')}
        </h1>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-retro-brown-700 uppercase tracking-wide mb-3 pb-2 border-b-2 border-retro-brown-200">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm sm:text-base text-retro-brown-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
