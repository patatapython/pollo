import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con Service Role Key
 * Usar SOLO en API Routes (server-side)
 * NUNCA exponer en cliente
 */
let adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  // Singleton pattern para reutilizar conexión
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing Supabase credentials. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
}
