import { getSql } from '@/lib/db/client';
import { RateLimitRepository, RepositoryError } from '@/lib/repositories/types';

export const postgresRateLimitRepository: RateLimitRepository = {
  /**
   * Ojo con la rama de `null`, que es donde se rompe lo obvio: en SQL
   * `ip_address = NULL` no es falso, es desconocido, asi que nunca cuenta una
   * fila. Escrito con igualdad, este metodo devolveria cero para siempre a toda
   * peticion sin direccion utilizable — intentos ilimitados y ningun 429, sin
   * un solo sintoma. La comparacion con NULL es `IS NULL`, y por eso son dos
   * consultas y no una con parametro.
   */
  async countFailedSince(ipAddress, since) {
    const sql = getSql();

    try {
      const rows =
        ipAddress === null
          ? await sql<{ count: number }[]>`
              SELECT COUNT(*)::int AS count
              FROM rate_limit_attempts
              WHERE success = false
                AND ip_address IS NULL
                AND attempted_at > ${since}
            `
          : await sql<{ count: number }[]>`
              SELECT COUNT(*)::int AS count
              FROM rate_limit_attempts
              WHERE success = false
                AND ip_address = ${ipAddress}
                AND attempted_at > ${since}
            `;

      return rows[0].count;
    } catch (error) {
      throw new RepositoryError('Failed to count failed attempts', error);
    }
  },

  async record(ipAddress, success, at) {
    try {
      await getSql()`
        INSERT INTO rate_limit_attempts (ip_address, success, attempted_at)
        VALUES (${ipAddress}, ${success}, ${at})
      `;
    } catch (error) {
      throw new RepositoryError('Failed to record attempt', error);
    }
  },

  async deleteOlderThan(cutoff) {
    try {
      const rows = await getSql()<{ id: string }[]>`
        DELETE FROM rate_limit_attempts
        WHERE attempted_at < ${cutoff}
        RETURNING id
      `;
      return rows.length;
    } catch (error) {
      throw new RepositoryError('Failed to delete old attempts', error);
    }
  },
};
