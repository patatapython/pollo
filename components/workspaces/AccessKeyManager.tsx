'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { copyToClipboard } from '@/lib/utils/download';
import { useToast } from '@/lib/hooks/useToast';

interface AccessKeyManagerProps {
  passphrase: string;
  spaceName?: string;
}

export function AccessKeyManager({ passphrase, spaceName = 'Mi Espacio' }: AccessKeyManagerProps) {
  const toast = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPassphrase = async () => {
    const success = await copyToClipboard(passphrase);
    if (success) {
      setCopied(true);
      toast.success('Passphrase copiado');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Error al copiar');
    }
  };

  return (
    <Card variant="default">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Mis Palabras de Acceso</h2>
        <p className="text-neutral-600">
          Estas son tus palabras mágicas. Úsalas para acceder desde otro dispositivo o compartiéndolas con personas de confianza.
        </p>
      </div>

      <div className="bg-neutral-50 rounded-xl p-5 mb-6 border border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold">Tus palabras de acceso</p>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition"
          >
            {isVisible ? '🙈 Ocultar' : '👁️ Mostrar'}
          </button>
        </div>

        {isVisible ? (
          <p className="text-lg font-mono font-bold text-neutral-900 tracking-wider select-all break-all">
            {passphrase}
          </p>
        ) : (
          <p className="text-lg font-mono font-bold text-neutral-400 tracking-wider">
            ••••••••••••••••••••••••••••
          </p>
        )}
      </div>

      <div className="bg-info-50 border border-info-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <svg className="h-5 w-5 text-info-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-info-900 text-sm">Sé cuidadoso</p>
            <p className="text-info-700 text-sm mt-1">
              Solo comparte estas palabras con personas en las que confías. Quien las tenga acceso total a tus listas.
            </p>
          </div>
        </div>
      </div>

      {isVisible && (
        <Button
          onClick={handleCopyPassphrase}
          variant="primary"
          size="md"
          className="w-full"
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copiado
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </>
          )}
        </Button>
      )}
    </Card>
  );
}
