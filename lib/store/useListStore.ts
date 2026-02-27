import { create } from 'zustand';
import {
  saveItemsOffline,
  getItemsOffline,
  savePendingOperation,
  isOnline,
  onOnline,
  onOffline,
  syncPendingOperations,
  clearOfflineItems,
} from '@/lib/utils/offlineStorage';

export interface Item {
  id: string;
  name: string;
  list_id: string;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface ListStore {
  items: Item[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;

  // Actions
  fetchItems: (listId: string) => Promise<void>;
  addItem: (listId: string, name: string) => Promise<Item>;
  updateItem: (listId: string, itemId: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (listId: string, itemId: string) => Promise<void>;
  toggleCompleted: (listId: string, itemId: string) => Promise<void>;
  clearError: () => void;
  initializeOfflineSync: () => void;

  // For real-time updates
  addItemOptimistic: (item: Item) => void;
  updateItemOptimistic: (item: Item) => void;
  deleteItemOptimistic: (itemId: string) => void;
}

export const useListStore = create<ListStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  isOffline: false,

  fetchItems: async (listId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/lists/${listId}/items`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      const items = data.items || [];

      // Guardar en localStorage para acceso offline
      saveItemsOffline(listId, items);
      set({ items, isOffline: false });
    } catch (error) {
      // Si falla, intentar cargar del localStorage
      const offlineItems = getItemsOffline(listId);
      if (offlineItems.length > 0) {
        set({
          items: offlineItems,
          error: '(Modo offline) - Los cambios se sincronizarán cuando vuelva online',
          isOffline: true,
        });
      } else {
        set({
          error: error instanceof Error ? error.message : 'Error fetching items',
          isOffline: true,
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (listId: string, name: string) => {
    const tempId = `temp_${Date.now()}`;
    const tempItem: Item = {
      id: tempId,
      name,
      list_id: listId,
      is_completed: false,
      completed_at: null,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // Optimistic update
      set((state) => ({ items: [...state.items, tempItem] }));
      saveItemsOffline(listId, get().items);

      // Intentar sincronizar con BD
      if (!isOnline()) {
        // Guardar operación pendiente
        savePendingOperation({
          type: 'create',
          listId,
          data: { name },
          timestamp: Date.now(),
        });
        return tempItem;
      }

      const response = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to add item');
      const data = await response.json();

      // Reemplazar item temporal con el real
      set((state) => ({
        items: state.items.map((i) => (i.id === tempId ? data.item : i)),
      }));
      saveItemsOffline(listId, get().items);
      return data.item;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error adding item' });
      throw error;
    }
  },

  updateItem: async (listId: string, itemId: string, updates: Partial<Item>) => {
    try {
      // Optimistic update
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
      }));
      saveItemsOffline(listId, get().items);

      // Si el item aún no existe en el servidor (ID temporal), no llamar a la API
      if (itemId.startsWith('temp_')) return;

      // Intentar sincronizar con BD
      if (!isOnline()) {
        // Guardar operación pendiente
        savePendingOperation({
          type: 'update',
          listId,
          itemId,
          data: updates,
          timestamp: Date.now(),
        });
        return;
      }

      const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update item');
      const data = await response.json();
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? data.item : i)),
      }));
      saveItemsOffline(listId, get().items);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error updating item' });
      throw error;
    }
  },

  deleteItem: async (listId: string, itemId: string) => {
    try {
      // Optimistic update
      set((state) => ({
        items: state.items.filter((i) => i.id !== itemId),
      }));
      saveItemsOffline(listId, get().items);

      // Si el item aún no existe en el servidor (ID temporal), no llamar a la API
      if (itemId.startsWith('temp_')) return;

      // Intentar sincronizar con BD
      if (!isOnline()) {
        // Guardar operación pendiente
        savePendingOperation({
          type: 'delete',
          listId,
          itemId,
          data: {},
          timestamp: Date.now(),
        });
        return;
      }

      const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete item');
      saveItemsOffline(listId, get().items);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error deleting item' });
      throw error;
    }
  },

  toggleCompleted: async (listId: string, itemId: string) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;
    await get().updateItem(listId, itemId, { is_completed: !item.is_completed });
  },

  clearError: () => set({ error: null }),

  initializeOfflineSync: () => {
    // Detectar cambio a online
    const unsubscribeOnline = onOnline(async () => {
      if (process.env.NODE_ENV !== 'production') console.log('Conexión restaurada, sincronizando...');
      set({ isOffline: false });
      try {
        await syncPendingOperations();
        // Recargar items después de sincronizar
        const state = get();
        // Intentar recargar si es posible (necesitaría listId)
      } catch (error) {
        console.error('Error syncing pending operations:', error);
      }
    });

    // Detectar cambio a offline
    const unsubscribeOffline = onOffline(() => {
      if (process.env.NODE_ENV !== 'production') console.log('Conexión perdida, modo offline');
      set({ isOffline: true, error: '(Modo offline) - Los cambios se sincronizarán cuando vuelva online' });
    });

    // Retornar función de limpieza
    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  },

  addItemOptimistic: (item: Item) => {
    set((state) => {
      // Skip if item already exists (dedup from realtime)
      if (state.items.some((i) => i.id === item.id)) return state;
      return { items: [...state.items, item] };
    });
  },

  updateItemOptimistic: (item: Item) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === item.id ? item : i)),
    }));
  },

  deleteItemOptimistic: (itemId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },
}));
