'use client';

import { Item, useListStore } from '@/lib/store/useListStore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useState } from 'react';
import { useT } from '@/lib/hooks/useT';

interface ItemCardProps {
  item: Item;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  isLoading?: boolean;
  listId: string;
}

export function ItemCard({ item, onToggle, onDelete, isLoading, listId }: ItemCardProps) {
  const t = useT();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateItem = useListStore((s) => s.updateItem);

  const handleSaveEdit = async () => {
    if (!editedName.trim() || editedName === item.name) {
      setIsEditing(false);
      setEditedName(item.name);
      return;
    }

    setIsSaving(true);
    try {
      await updateItem(listId, item.id, { name: editedName.trim() });
      setIsEditing(false);
    } catch {
      setEditedName(item.name);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(item.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="relative group">
      <div
        className={`flex items-center gap-4 p-4 border-3 rounded-[20px] transition-all duration-200 ${
          item.is_completed
            ? 'bg-retro-cream-100 border-primary-500 shadow-none'
            : 'bg-white border-primary-500 shadow-[6px_6px_0px_rgba(210,125,45,0.2)] hover:shadow-[8px_8px_0px_rgba(210,125,45,0.3)]'
        }`}
      >
        {/* Circular Checkbox */}
        <div className="relative">
          <input
            type="checkbox"
            checked={item.is_completed}
            onChange={() => onToggle(item.id)}
            disabled={isLoading || isSaving}
            className="sr-only"
            id={`checkbox-${item.id}`}
          />
          <label
            htmlFor={`checkbox-${item.id}`}
            className={`
              w-7 h-7 rounded-full border-3 cursor-pointer
              transition-all duration-200
              flex items-center justify-center
              ${
                item.is_completed
                  ? 'bg-accent-500 border-accent-600'
                  : 'bg-white border-primary-500 hover:border-primary-600'
              }
              ${(isLoading || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {item.is_completed && (
              <span className="text-white font-bold text-sm">✓</span>
            )}
          </label>
        </div>

        {/* Item Text - Editable */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              autoFocus
              className="w-full px-2 py-1 text-base font-medium border-2 border-primary-500 rounded-lg bg-retro-cream-100 text-retro-brown-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          ) : (
            <span
              onDoubleClick={() => !item.is_completed && setIsEditing(true)}
              className={`block break-words text-base font-medium transition-all cursor-text select-none ${
                item.is_completed
                  ? 'line-through text-retro-brown-600'
                  : 'text-retro-brown-800 hover:bg-retro-cream-100 px-2 py-1 rounded'
              } ${isLoading ? 'opacity-50' : ''}`}
              title={t('itemCard.doubleClickEdit')}
            >
              {item.name}
            </span>
          )}
        </div>
      </div>

      {/* Botón de eliminar en esquina */}
      <button
        onClick={(e) => {
          e.preventDefault();
          setShowConfirm(true);
        }}
        disabled={isLoading || isSaving}
        aria-label={t('itemCard.deleteTitle')}
        className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-retro-red-500 border-2 border-retro-red-700 shadow-[3px_3px_0px_rgba(220,38,38,0.3)] hover:shadow-[2px_2px_0px_rgba(220,38,38,0.4)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200 flex items-center justify-center group-hover:opacity-100 opacity-0 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('itemCard.deleteTitle')}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title={t('itemCard.deleteTitle')}
        message={t('itemCard.deleteMessage', { name: item.name })}
        confirmLabel={t('itemCard.deleteConfirm')}
        cancelLabel={t('itemCard.deleteCancel')}
        variant="danger"
        onConfirm={() => { setShowConfirm(false); onDelete(item.id); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
