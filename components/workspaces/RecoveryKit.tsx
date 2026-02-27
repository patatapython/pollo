'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { downloadBackupFile, downloadRecoveryImage, copyToClipboard } from '@/lib/utils/download';
import { useToast } from '@/lib/hooks/useToast';

interface RecoveryKitProps {
  passphrase: string;
  spaceName?: string;
  onContinue: () => void;
}

export function RecoveryKit({ passphrase, spaceName = 'Mi Espacio', onContinue }: RecoveryKitProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadKit = async () => {
    try {
      setIsDownloading(true);
      await downloadBackupFile(passphrase);
      toast.success('Kit de recuperación descargado');
    } catch {
      toast.error('Error al descargar el kit');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadImage = () => {
    try {
      setIsDownloading(true);
      downloadRecoveryImage(passphrase);
      toast.success('Imagen descargada');
    } catch {
      toast.error('Error al descargar la imagen');
    } finally {
      setIsDownloading(false);
    }
  };

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
    <Card variant="elevated">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Espacio Creado</h2>
        </div>
        <p className="text-neutral-600">Tu espacio privado está listo. Guarda estas palabras en un lugar seguro.</p>
      </div>

      {/* Advertencia */}
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-warning-900 text-sm">Guarda estas 5 palabras</p>
            <p className="text-warning-700 text-sm mt-1">
              Son tu única forma de acceder. No se pueden recuperar si las pierdes.
            </p>
          </div>
        </div>
      </div>

      {/* Passphrase */}
      <div className="bg-neutral-50 rounded-xl p-5 mb-6 border border-neutral-200">
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide font-semibold">Tus palabras de acceso</p>
        <p className="text-lg font-mono font-bold text-neutral-900 tracking-wider select-all break-all">
          {passphrase}
        </p>
      </div>

      {/* Botones de descarga */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          onClick={handleDownloadKit}
          disabled={isDownloading}
          variant="secondary"
          size="md"
          className="w-full"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Guardar mis palabras
        </Button>

        <Button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          variant="secondary"
          size="md"
          className="w-full"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Guardar Imagen
        </Button>
      </div>

      {/* Botón copiar */}
      <Button
        onClick={handleCopyPassphrase}
        variant="secondary"
        size="md"
        className="w-full mb-4"
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
            Copiar Palabras
          </>
        )}
      </Button>

      {/* Botón continuar */}
      <Button
        onClick={onContinue}
        className="w-full"
        size="lg"
        variant="primary"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        Continuar a Mi Espacio
      </Button>
    </Card>
  );
}
