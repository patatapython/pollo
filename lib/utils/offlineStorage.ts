/**
 * Gestión de almacenamiento offline usando localStorage
 * Permite que Pollo funcione sin conexión a internet
 */

import { Item } from '@/lib/store/useListStore';

const OFFLINE_ITEMS_PREFIX = 'pollo_offline_items_';
const OFFLINE_PENDING_KEY = 'pollo_offline_pending_operations';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  listId: string;
  itemId?: string;
  data: Record<string, any>;
  timestamp: number;
}

/**
 * Guardar items en localStorage para acceso offline
 */
export function saveItemsOffline(listId: string, items: Item[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${OFFLINE_ITEMS_PREFIX}${listId}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving items to offline storage:', error);
  }
}

/**
 * Cargar items del localStorage
 */
export function getItemsOffline(listId: string): Item[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${OFFLINE_ITEMS_PREFIX}${listId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading items from offline storage:', error);
    return [];
  }
}

/**
 * Limpiar items offline de un list específico
 */
export function clearOfflineItems(listId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${OFFLINE_ITEMS_PREFIX}${listId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing offline items:', error);
  }
}

/**
 * Guardar operación pendiente (para sincronizar después)
 */
export function savePendingOperation(operation: Omit<PendingOperation, 'id'>): void {
  if (typeof window === 'undefined') return;
  try {
    const pending = getPendingOperations();
    const newOperation: PendingOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random()}`,
    };
    pending.push(newOperation);
    localStorage.setItem(OFFLINE_PENDING_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error('Error saving pending operation:', error);
  }
}

/**
 * Obtener operaciones pendientes
 */
export function getPendingOperations(): PendingOperation[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(OFFLINE_PENDING_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pending operations:', error);
    return [];
  }
}

/**
 * Limpiar operaciones pendientes después de sincronizar
 */
export function clearPendingOperations(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_PENDING_KEY);
  } catch (error) {
    console.error('Error clearing pending operations:', error);
  }
}

/**
 * Remover operación pendiente específica
 */
export function removePendingOperation(operationId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const pending = getPendingOperations();
    const filtered = pending.filter(op => op.id !== operationId);
    if (filtered.length === 0) {
      clearPendingOperations();
    } else {
      localStorage.setItem(OFFLINE_PENDING_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Error removing pending operation:', error);
  }
}

/**
 * Detectar si estamos online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Escuchar cambios de conexión
 */
export function onOnline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', callback);
  return () => {
    window.removeEventListener('online', callback);
  };
}

export function onOffline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('offline', callback);
  };
}

/**
 * Sincronizar operaciones pendientes con el servidor
 */
export async function syncPendingOperations(): Promise<void> {
  const pending = getPendingOperations();
  if (pending.length === 0) return;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Sincronizando ${pending.length} operaciones pendientes...`);
  }

  for (const op of pending) {
    try {
      if (op.type === 'create') {
        // POST /api/lists/[id]/items
        const response = await fetch(`/api/lists/${op.listId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.data),
          credentials: 'include',
        });
        if (response.ok) {
          removePendingOperation(op.id);
        }
      } else if (op.type === 'update') {
        // PATCH /api/lists/[id]/items/[itemId]
        const response = await fetch(`/api/lists/${op.listId}/items/${op.itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.data),
          credentials: 'include',
        });
        if (response.ok) {
          removePendingOperation(op.id);
        }
      } else if (op.type === 'delete') {
        // DELETE /api/lists/[id]/items/[itemId]
        const response = await fetch(`/api/lists/${op.listId}/items/${op.itemId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          removePendingOperation(op.id);
        }
      }
    } catch {
      // Mantener la operación pendiente para reintentar después
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('Sincronización completada');
  }
}
