import { getSql } from '@/lib/db/client';
import { HealthRepository, RepositoryError } from '@/lib/repositories/types';

export const postgresHealthRepository: HealthRepository = {
  /**
   * `SELECT 1` y no una consulta contra una tabla real: la sonda corre cada
   * pocos segundos durante toda la vida del contenedor, y no debe depender de
   * que ninguna tabla exista ni tener coste que crezca con los datos.
   *
   * Aun asi cruza el pool de conexiones entero, que es lo que de verdad se
   * quiere vigilar: un pool agotado falla aqui igual que fallaria en una ruta.
   */
  async ping() {
    try {
      await getSql()`SELECT 1`;
    } catch (error) {
      throw new RepositoryError('Database ping failed', error);
    }
  },
};
