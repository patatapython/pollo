import { createBrowserClient } from '@supabase/ssr';
import { useListStore, type Item } from '@/lib/store/useListStore';

// Helper to get Supabase client for browser
function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function subscribeToListItems(listId: string) {
  // Create client inside the function, not at module scope
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`items:${listId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'items',
        filter: `list_id=eq.${listId}`,
      },
      (payload) => {
        const store = useListStore.getState();
        const newItem = payload.new as Item;
        // Dedup: skip if item already exists (from optimistic update)
        if (!store.items.some((i) => i.id === newItem.id)) {
          store.addItemOptimistic(newItem);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'items',
        filter: `list_id=eq.${listId}`,
      },
      (payload) => {
        const store = useListStore.getState();
        store.updateItemOptimistic(payload.new as Item);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'items',
        filter: `list_id=eq.${listId}`,
      },
      (payload) => {
        const store = useListStore.getState();
        if (payload.old?.id) {
          store.deleteItemOptimistic(payload.old.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
