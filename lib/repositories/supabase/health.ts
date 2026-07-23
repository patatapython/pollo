import { getAdminClient } from '@/lib/supabase/admin';
import { HealthRepository, RepositoryError } from '@/lib/repositories/types';

export const supabaseHealthRepository: HealthRepository = {
  /**
   * PostgREST no admite `SELECT 1`, asi que la comprobacion mas barata es una
   * peticion de solo cabecera contra una tabla que siempre existe. `head: true`
   * no trae filas; lo que se ejercita es la red, la autenticacion de la clave
   * de servicio y que la base responda.
   *
   * Una tabla vacia responde igual que una llena: el criterio es que no haya
   * error, nunca que haya filas. Ligarlo a que existan datos convertiria una
   * base recien creada en un contenedor declarado enfermo para siempre.
   *
   * SIN `count`. La primera version pedia `count: 'exact'`, que en PostgREST
   * dispara un COUNT(*) sobre toda la tabla — medido: devuelve
   * `content-range: 0-0/138` en vez de `0-0/*`. Eso es trabajo proporcional al
   * numero de filas cada quince segundos, para siempre, y el numero ni siquiera
   * se lee: aqui solo se mira `error`. Una sonda no puede encarecerse con el
   * tamaño de la base a la que vigila.
   */
  async ping() {
    const { error } = await getAdminClient()
      .from('workspaces')
      .select('id')
      .limit(1);

    if (error) throw new RepositoryError('Database ping failed', error);
  },
};
