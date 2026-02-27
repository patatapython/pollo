'use client';

import { useEffect } from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="relative w-full max-w-sm bg-retro-cream-50 border-4 border-retro-brown-700 rounded-[25px] shadow-[8px_8px_0px_rgba(0,0,0,0.25)] p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Título */}
        <h2 id="confirm-modal-title" className="text-lg font-bold text-retro-brown-800 uppercase tracking-wide">
          {title}
        </h2>

        {/* Mensaje */}
        <p className="text-sm text-retro-brown-600 leading-relaxed">
          {message}
        </p>

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
