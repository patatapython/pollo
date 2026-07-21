import { Repositories } from './types';
import { supabaseListRepository } from './supabase/lists';
import { supabaseItemRepository } from './supabase/items';
import { supabaseWorkspaceRepository } from './supabase/workspaces';
import { supabaseRateLimitRepository } from './supabase/rate-limits';

/**
 * Punto unico donde se elige la implementacion. Las rutas piden repositorios,
 * no un cliente de base de datos: cambiar de proveedor es cambiar este objeto.
 *
 * Los repositorios no guardan estado ni conexion —piden el cliente dentro de
 * cada metodo—, asi que basta con una instancia compartida.
 */
const repositories: Repositories = {
  workspaces: supabaseWorkspaceRepository,
  lists: supabaseListRepository,
  items: supabaseItemRepository,
  rateLimits: supabaseRateLimitRepository,
};

export function getRepositories(): Repositories {
  return repositories;
}

export * from './types';
