'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { List } from '@/lib/store/useWorkspaceStore';
import { useT } from '@/lib/hooks/useT';

interface ListCardProps {
  list: List;
  onDelete: (id: string) => void;
}

export function ListCard({ list, onDelete }: ListCardProps) {
  const t = useT();
  const [showConfirm, setShowConfirm] = useState(false);
  const itemsCount = list.itemsCount || { total: 0, completed: 0 };
  const active = itemsCount.total - itemsCount.completed;
  const previewItems = list.previewItems || [];

  return (
    <div className="relative group">
      <Link href={`/lists/${list.id}`}>
        <div className="bg-retro-cream-100 border-3 border-primary-500 border-l-8 border-l-primary-600 rounded-[25px] p-6 shadow-[10px_10px_0px_rgba(210,125,45,0.3)] hover:shadow-[14px_14px_0px_rgba(210,125,45,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer">
          <h3 className="text-xl font-bold text-retro-brown-800 mb-3 uppercase tracking-wide break-words">{list.name}</h3>

        {previewItems.length > 0 && (
          <div className="mb-4 space-y-2">
            {previewItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-sm">
                <div className="relative mt-0.5">
                  <div className="w-4 h-4 rounded-full border-2 border-primary-500 bg-retro-cream-100 flex-shrink-0 flex items-center justify-center">
                    {item.is_completed && (
                      <svg className="w-3 h-3 text-retro-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`flex-1 min-w-0 break-words leading-tight ${item.is_completed ? 'line-through text-retro-brown-500' : 'text-retro-brown-800 font-medium'}`}>
                  {item.name}
                </span>
              </div>
            ))}
            {itemsCount.total > 4 && (
              <p className="text-xs text-retro-brown-500 italic mt-2">
                {t('listCard.moreItems', { count: itemsCount.total - 4 })}
              </p>
            )}
          </div>
        )}

        <div className="text-sm text-retro-brown-600 mb-4 font-bold uppercase">
          <p>{active} {t('listCard.todoLabel')} • <span className="text-retro-green-700">{itemsCount.completed} {t('listCard.completedLabel')}</span></p>
        </div>

        {/* Progress Bar Retro */}
        <div
          className="w-full bg-retro-cream-300 rounded-full h-4 border-2 border-retro-brown-400 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-gradient-to-r from-retro-green-400 to-retro-green-500 h-full rounded-full transition-all duration-300 border-r-2 border-retro-green-600"
            style={{
              width: itemsCount.total > 0 ? `${(itemsCount.completed / itemsCount.total) * 100}%` : '0%',
            }}
          />
        </div>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          setShowConfirm(true);
        }}
        aria-label={t('listCard.deleteTitle')}
        className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-retro-red-500 border-2 border-retro-red-700 shadow-[4px_4px_0px_rgba(220,38,38,0.3)] hover:shadow-[2px_2px_0px_rgba(220,38,38,0.4)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center group-hover:opacity-100 opacity-70 hover:opacity-100"
        title={t('listCard.deleteTitle')}
      >
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title={t('listCard.deleteTitle')}
        message={t('listCard.deleteMessage', { name: list.name })}
        confirmLabel={t('listCard.deleteConfirm')}
        cancelLabel={t('listCard.deleteCancel')}
        variant="danger"
        onConfirm={() => { setShowConfirm(false); onDelete(list.id); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
