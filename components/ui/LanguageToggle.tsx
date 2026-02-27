'use client';

import { useLanguageStore } from '@/lib/store/useLanguageStore';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguageStore();
  const next = language === 'es' ? 'en' : 'es';

  return (
    <button
      onClick={() => setLanguage(next)}
      className={`font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-[10px] border-2 transition-all flex items-center gap-1.5 ${className}`}
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      {language === 'es' ? (
        <><span className="text-base leading-none">🇬🇧</span> EN</>
      ) : (
        <><span className="text-base leading-none">🇪🇸</span> ES</>
      )}
    </button>
  );
}
