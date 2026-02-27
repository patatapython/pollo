import { create } from 'zustand';

export interface PreviewItem {
  id: string;
  name: string;
  is_completed: boolean;
  position: number;
}

export interface List {
  id: string;
  name: string;
  workspace_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  itemsCount?: {
    total: number;
    completed: number;
  };
  previewItems?: PreviewItem[];
}

interface WorkspaceStore {
  lists: List[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };

  // Actions
  fetchLists: (options?: { limit?: number; offset?: number }) => Promise<void>;
  createList: (name: string) => Promise<List>;
  updateList: (id: string, name: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  lists: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
  },

  fetchLists: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const { limit = 50, offset = 0 } = options;
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      const response = await fetch(`/api/lists?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      
      // Si es una carga inicial (offset 0), reemplazamos. Si es "cargar más", podríamos concatenar.
      // Por simplicidad y consistencia con paginación tradicional, reemplazamos la vista actual
      // o podríamos implementar lógica de "load more" si se desea.
      // Aquí asumiremos reemplazo por página para navegación simple, 
      // pero si el offset > 0 y queremos "infinite scroll", deberíamos hacer append.
      // Dado que el diseño actual parece ser un grid simple, mantendremos el reemplazo
      // pero guardando la metadata para que la UI pueda decidir.
      
      set({ 
        lists: data.lists || [],
        pagination: data.meta || { total: 0, limit, offset }
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error fetching lists' });
    } finally {
      set({ loading: false });
    }
  },

  createList: async (name: string) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create list');
      const data = await response.json();
      set((state) => ({ lists: [...state.lists, data.list] }));
      return data.list;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error creating list' });
      throw error;
    }
  },

  updateList: async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update list');
      set((state) => ({
        lists: state.lists.map((l) => (l.id === id ? { ...l, name } : l)),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error updating list' });
      throw error;
    }
  },

  deleteList: async (id: string) => {
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete list');
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error deleting list' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
