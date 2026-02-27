'use client';

import { Item } from '@/lib/store/useListStore';
import { ItemCard } from './ItemCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useT } from '@/lib/hooks/useT';

interface ItemListProps {
  items: Item[];
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  isLoading?: boolean;
  listId: string;
}

export function ItemList({ items, onToggle, onDelete, isLoading, listId }: ItemListProps) {
  const t = useT();
  const active = items.filter((i) => !i.is_completed);
  const completed = items.filter((i) => i.is_completed);

  if (isLoading && items.length === 0) {
    return <SkeletonLoader variant="grid" count={4} />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('itemList.noItems')}</p>
        <p className="text-sm text-gray-400">{t('itemList.addFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activos */}
      {active.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            {t('itemList.toDo', { count: active.length })}
          </h3>
          <div className="space-y-2">
            {active.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={onToggle}
                onDelete={onDelete}
                isLoading={isLoading}
                listId={listId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completados */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            {t('itemList.completed', { count: completed.length })}
          </h3>
          <div className="space-y-2">
            {completed.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={onToggle}
                onDelete={onDelete}
                isLoading={isLoading}
                listId={listId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
