'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useListStore } from '@/lib/store/useListStore';
import { AddItemForm } from '@/components/items/AddItemForm';
import { ItemList } from '@/components/items/ItemList';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/hooks/useToast';
import { useT } from '@/lib/hooks/useT';
import { subscribeToListItems } from '@/lib/supabase/realtime';

interface ListData {
  id: string;
  name: string;
}

export default function ListPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;
  const toast = useToast();
  const t = useT();

  const { items, loading, error, fetchItems, clearError, initializeOfflineSync } = useListStore();
  const [listData, setListData] = useState<ListData | null>(null);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    const cleanup = initializeOfflineSync();
    return cleanup;
  }, [initializeOfflineSync]);

  useEffect(() => {
    const fetchListData = async () => {
      try {
        const response = await fetch(`/api/lists/${listId}`);
        if (!response.ok) throw new Error('Failed to fetch list');
        const data = await response.json();
        setListData(data.list);
      } catch (err) {
        console.error('Error fetching list:', err);
      } finally {
        setListLoading(false);
      }
    };

    fetchListData();
    fetchItems(listId);

    const unsubscribe = subscribeToListItems(listId);

    return () => {
      unsubscribe();
    };
  }, [listId, fetchItems]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, toast, clearError]);

  const handleAddItem = async (name: string) => {
    try {
      await useListStore.getState().addItem(listId, name);
      toast.success(t('list.itemAdded'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('list.errorAdd'));
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await useListStore.getState().toggleCompleted(listId, itemId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('list.errorUpdate'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await useListStore.getState().deleteItem(listId, itemId);
      toast.success(t('list.itemDeleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('list.errorDelete'));
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (listLoading || !listData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="bg-gradient-to-r from-primary-600 to-accent-500 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="h-7 sm:h-8 bg-white opacity-20 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = items.filter((i) => !i.is_completed).length;
  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;

  return (
    <div className="min-h-screen bg-retro-cream-50 flex flex-col">
      {/* Header Retro Sólido */}
      <header className="bg-primary-500 border-b-4 border-primary-700 shadow-[0px_8px_0px_rgba(210,125,45,0.4)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex items-center gap-2 sm:gap-4 min-w-0">
          <Button variant="ghost" onClick={handleBack} className="text-white border-white hover:bg-white/20 flex-shrink-0">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{t('list.back')}</span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-retro-cream-50 tracking-wide text-shadow-retro-sm truncate uppercase">
              {listData.name}
            </h1>
            <span className="inline-block text-xs sm:text-sm text-retro-cream-200 font-bold mt-1">
              {t('list.todoCount', { count: pendingCount })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-8 pb-24">
        <div className="mb-6 sm:mb-8">
          <AddItemForm onSubmit={handleAddItem} isLoading={loading} />
        </div>

        <ItemList
          items={items}
          onToggle={handleToggleItem}
          onDelete={handleDeleteItem}
          isLoading={loading}
          listId={listId}
        />

        {items.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12">
            <svg className="h-8 sm:h-12 w-8 sm:w-12 text-retro-brown-300 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-retro-brown-700 text-base sm:text-lg font-bold uppercase">{t('list.emptyTitle')}</p>
            <p className="text-retro-brown-500 text-xs sm:text-sm mt-1 px-2">
              {t('list.emptyDesc')}
            </p>
          </div>
        )}
      </main>

      {/* Footer Contador Retro */}
      <footer className="sticky bottom-0 left-0 right-0 bg-primary-500 border-t-4 border-primary-700 shadow-[0px_-8px_0px_rgba(210,125,45,0.4)] py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="font-bold text-retro-cream-50 text-base sm:text-lg uppercase tracking-wide">
            {t('list.pending', { count: pendingCount })}
          </div>
          <div className="text-xs sm:text-sm text-retro-cream-200 font-bold bg-primary-600 px-3 sm:px-4 py-2 rounded-full border-2 border-retro-cream-100">
            {t('list.completed', { count: completedCount, total: totalCount })}
          </div>
        </div>
      </footer>
    </div>
  );
}
