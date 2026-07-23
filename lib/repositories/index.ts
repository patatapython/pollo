import { getDbDriver, type DbDriver } from '@/lib/config/env';
import { Repositories } from './types';
import { supabaseListRepository } from './supabase/lists';
import { supabaseItemRepository } from './supabase/items';
import { supabaseWorkspaceRepository } from './supabase/workspaces';
import { supabaseRateLimitRepository } from './supabase/rate-limits';
import { supabaseHealthRepository } from './supabase/health';
import { postgresListRepository } from './postgres/lists';
import { postgresItemRepository } from './postgres/items';
import { postgresWorkspaceRepository } from './postgres/workspaces';
import { postgresRateLimitRepository } from './postgres/rate-limits';
import { postgresHealthRepository } from './postgres/health';

/**
 * Punto unico donde se elige la implementacion. Las rutas piden repositorios,
 * no un cliente de base de datos: cambiar de proveedor es cambiar `DB_DRIVER`.
 *
 * Los repositorios no guardan estado ni conexion —piden el cliente dentro de
 * cada metodo—, asi que basta con una instancia compartida de cada uno.
 */
const IMPLEMENTATIONS: Record<DbDriver, Repositories> = {
  supabase: {
    workspaces: supabaseWorkspaceRepository,
    lists: supabaseListRepository,
    items: supabaseItemRepository,
    rateLimits: supabaseRateLimitRepository,
    health: supabaseHealthRepository,
  },
  postgres: {
    workspaces: postgresWorkspaceRepository,
    lists: postgresListRepository,
    items: postgresItemRepository,
    rateLimits: postgresRateLimitRepository,
    health: postgresHealthRepository,
  },
};

/**
 * Se resuelve en cada llamada en vez de al cargar el modulo. Congelarlo en una
 * constante de modulo ataria la eleccion al primer import, que en Next puede
 * ocurrir durante la compilacion y no en el arranque del servidor.
 */
export function getRepositories(): Repositories {
  return IMPLEMENTATIONS[getDbDriver()];
}

export * from './types';
