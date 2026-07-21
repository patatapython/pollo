import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { RateLimitRepository, RepositoryError } from '@/lib/repositories/types';

export const supabaseRateLimitRepository: RateLimitRepository = {
  async countFailedSince(ipAddress, since) {
    const { count, error } = await getAdminClient()
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .eq('success', false)
      .gt('attempted_at', since.toISOString());

    if (error) throw new RepositoryError('Failed to count failed attempts', error);

    return count ?? 0;
  },

  async record(ipAddress, success, at) {
    // Si esto lanzara, un fallo al anotar el intento tumbaria la peticion que
    // lo origino. Se registra y se sigue: el limitador se degrada, la ruta no.
    const { error } = await getAdminClient()
      .from('rate_limit_attempts')
      .insert({
        ip_address: ipAddress,
        success,
        attempted_at: at.toISOString(),
      });

    if (error) {
      logger.error('Rate limit attempt not recorded', error, {
        repository: 'rateLimits',
        method: 'record',
      });
    }
  },

  async deleteOlderThan(cutoff) {
    const { error, count } = await getAdminClient()
      .from('rate_limit_attempts')
      .delete({ count: 'exact' })
      .lt('attempted_at', cutoff.toISOString());

    if (error) throw new RepositoryError('Failed to delete old attempts', error);

    return count ?? 0;
  },
};
