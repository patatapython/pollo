'use client';

import { useState } from 'react';
import { ListCard } from './ListCard';
import { List } from '@/lib/store/useWorkspaceStore';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/lib/hooks/useT';

interface ListsGridProps {
  lists: List[];
  onDelete: (id: string) => void;
  onCreateList: (name: string) => Promise<void>;
  isLoading?: boolean;
  isCreating?: boolean;
}

export function ListsGrid({ lists, onDelete, onCreateList, isLoading, isCreating }: ListsGridProps) {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await onCreateList(name.trim());
      setName('');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('listsGrid.errorCreate'));
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setName('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel();
  };

  if (isLoading) {
    return <SkeletonLoader variant="card" count={3} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {lists.map((list) => (
        <ListCard key={list.id} list={list} onDelete={onDelete} />
      ))}

      {/* Tarjeta de crear lista — siempre última */}
      <div className="relative">
        {isOpen ? (
          <div className="bg-retro-cream-100 border-3 border-primary-500 border-l-8 border-l-primary-600 rounded-[25px] p-6 shadow-[10px_10px_0px_rgba(210,125,45,0.3)]">
            <p className="text-sm font-bold text-retro-brown-700 uppercase tracking-wide mb-3">{t('listsGrid.newList')}</p>
            {error && (
              <p className="text-xs text-retro-red-700 font-bold mb-2">{error}</p>
            )}
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder={t('listsGrid.listNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isCreating}
                autoFocus
                className="w-full px-3 py-2 text-sm font-medium border-2 border-primary-400 rounded-[12px] bg-retro-cream-50 text-retro-brown-800 focus:outline-none focus:border-primary-600 mb-3 placeholder:text-retro-brown-400"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating || !name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-retro-cream-50 font-bold py-2 rounded-[12px] border-2 border-primary-700 shadow-[3px_3px_0px_rgba(210,125,45,0.3)] transition-all text-sm uppercase tracking-wide"
                >
                  {isCreating ? <Spinner size="sm" /> : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCreating}
                  className="w-11 h-11 flex items-center justify-center rounded-[12px] border-2 border-retro-brown-300 bg-retro-cream-50 hover:border-retro-brown-500 transition-colors"
                >
                  <svg className="h-4 w-4 text-retro-brown-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full h-full min-h-[120px] bg-retro-cream-100 border-3 border-dashed border-primary-400 rounded-[25px] p-6 hover:border-primary-600 hover:bg-retro-cream-200 hover:shadow-[10px_10px_0px_rgba(210,125,45,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full border-3 border-primary-400 group-hover:border-primary-600 flex items-center justify-center transition-colors">
              <svg className="h-5 w-5 text-primary-500 group-hover:text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-bold text-primary-500 group-hover:text-primary-700 uppercase tracking-wide transition-colors">
              {t('listsGrid.newList')}
            </span>
          </button>
        )}
      </div>

    </div>
  );
}
