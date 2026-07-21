/**
 * Contrato de acceso a datos.
 *
 * Las rutas hablan con estas interfaces y nunca con un cliente de base de
 * datos concreto. Cambiar de proveedor pasa a ser escribir una implementacion
 * nueva en vez de tocar 37 sitios repartidos por el codigo.
 *
 * Regla de errores, y es la importante: **un fallo de infraestructura lanza,
 * "no existe" no lanza**. Un fallo de consulta lanza RepositoryError; la
 * ausencia de fila se devuelve como `null` o como lista vacia. Confundir
 * ambas cosas es exactamente el defecto que hacia que una caida de base de
 * datos se le contase al usuario como contrasena incorrecta.
 */

export class RepositoryError extends Error {
  constructor(
    message: string,
    /** Error original del proveedor, para el registro. Nunca al usuario. */
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export interface Workspace {
  id: string;
  passphrase_hash: string;
  passphrase_lookup: string;
}

export interface List {
  id: string;
  workspace_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  list_id: string;
  name: string;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRepository {
  /** Crea un espacio y devuelve su identificador. */
  create(passphraseHash: string, passphraseLookup: string): Promise<string>;
  /** Espacios cuyo lookup esta entre los dados. Lista vacia si ninguno. */
  findByLookups(lookups: string[]): Promise<Workspace[]>;
}

/**
 * Articulo tal como viaja dentro de la vista previa de una lista: solo los
 * campos que el listado necesita para contar y para enseñar los primeros.
 */
export interface ListPreviewItem {
  id: string;
  name: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

/** Lista con sus articulos incrustados, en una sola consulta. */
export interface ListWithItems extends List {
  items: ListPreviewItem[];
}

export interface ListRepository {
  /**
   * Listas de un espacio con sus articulos incrustados, y el total para
   * paginar. Los articulos vienen en la misma consulta a proposito: el
   * listado necesita contarlos y una consulta por lista serian N viajes.
   */
  findByWorkspace(
    workspaceId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ lists: ListWithItems[]; total: number }>;
  /**
   * La lista, o `null` si no existe. Con `workspaceId` la busqueda se acota al
   * espacio y una lista ajena tambien devuelve `null`; sin el, la lista se
   * devuelve tal cual y es el llamante quien decide que significa que
   * `workspace_id` no coincida.
   */
  findById(id: string, workspaceId?: string): Promise<List | null>;
  create(workspaceId: string, name: string, position?: number): Promise<List>;
  /** La lista actualizada, o `null` si no existia. */
  update(id: string, workspaceId: string, name: string): Promise<List | null>;
  /** `true` si borro algo, `false` si no habia nada que borrar. */
  delete(id: string, workspaceId: string): Promise<boolean>;
}

export interface ItemRepository {
  findByList(listId: string, status?: 'all' | 'active' | 'purchased'): Promise<Item[]>;
  /** El articulo, o `null` si no existe o no pertenece a la lista. */
  findById(id: string, listId: string): Promise<Item | null>;
  create(listId: string, data: { name: string; position?: number }): Promise<Item>;
  createMany(listId: string, names: string[]): Promise<void>;
  update(
    id: string,
    listId: string,
    data: { name?: string; is_completed?: boolean }
  ): Promise<Item | null>;
  delete(id: string, listId: string): Promise<boolean>;
}

export interface RateLimitRepository {
  /** Intentos fallidos de esa direccion desde el instante dado. */
  countFailedSince(ipAddress: string, since: Date): Promise<number>;
  /**
   * Registra un intento. Lanza como el resto: que un fallo al anotar no deba
   * tumbar la peticion es una decision de la ruta, no del repositorio. Si se
   * tragase aqui, ningun llamante podria volver a elegir.
   */
  record(ipAddress: string, success: boolean, at: Date): Promise<void>;
  /** Borra intentos anteriores al instante dado. Devuelve cuantos. */
  deleteOlderThan(cutoff: Date): Promise<number>;
}

export interface Repositories {
  workspaces: WorkspaceRepository;
  lists: ListRepository;
  items: ItemRepository;
  rateLimits: RateLimitRepository;
}
