import { getAdminClient } from '@/lib/supabase/admin';
import { RateLimitRepository, RepositoryError } from '@/lib/repositories/types';

export const supabaseRateLimitRepository: RateLimitRepository = {
  async countFailedSince(ipAddress, since) {
    const base = getAdminClient()
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('success', false)
      .gt('attempted_at', since.toISOString());

    // `.eq(columna, null)` genera `columna = NULL`, que en SQL nunca es cierto:
    // devolveria cero siempre y apagaria el limitador para las peticiones sin
    // direccion, sin ningun sintoma. La comparacion con NULL es `IS NULL`.
    const query = ipAddress === null
      ? base.is('ip_address', null)
      : base.eq('ip_address', ipAddress);

    const { count, error } = await query;

    if (error) throw new RepositoryError('Failed to count failed attempts', error);

    return count ?? 0;
  },

  async record(ipAddress, success, at) {
    const { error } = await getAdminClient()
      .from('rate_limit_attempts')
      .insert({
        ip_address: ipAddress,
        success,
        attempted_at: at.toISOString(),
      });

    if (error) throw new RepositoryError('Failed to record attempt', error);
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
