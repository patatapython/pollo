'use client';

import { useCallback } from 'react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { translations } from '@/lib/i18n/translations';

export function useT() {
  const language = useLanguageStore((s) => s.language);

  return useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dict = translations[language];
      const fallback = translations['es'];
      let str = dict[key] ?? fallback[key] ?? key;

      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{{${k}}}`, String(v));
        });
      }

      return str;
    },
    [language]
  );
}
