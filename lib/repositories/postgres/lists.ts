import { getSql, toIso } from '@/lib/db/client';
import {
  List,
  ListPreviewItem,
  ListRepository,
  ListWithItems,
  RepositoryError,
} from '@/lib/repositories/types';

const DEFAULT_LIMIT = 50;

type ListRow = Omit<List, 'created_at' | 'updated_at'> & {
  created_at: Date;
  updated_at: Date;
};

type PreviewRow = Omit<ListPreviewItem, 'created_at'> & {
  list_id: string;
  created_at: Date;
};

function toList(row: ListRow): List {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    position: row.position,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export const postgresListRepository: ListRepository = {
  /**
   * Tres consultas, no una por lista: el total, la pagina, y los articulos de
   * todas las listas de esa pagina de golpe. Incrustar los articulos con
   * `json_agg` habria ahorrado un viaje a costa de que las fechas de dentro
   * salieran en el formato de JSON de Postgres y las de fuera en el de
   * JavaScript, con la incoherencia escondida dentro de la respuesta.
   *
   * El total va aparte a proposito. Calculado dentro de la misma consulta que
   * la pagina, un desplazamiento mas alla del final no devuelve ninguna fila y
   * con ella se perderia el total, que es justo lo que la paginacion necesita
   * para saber que hay paginas anteriores.
   */
  async findByWorkspace(workspaceId, options) {
    const limit = options?.limit ?? DEFAULT_LIMIT;
    const offset = options?.offset ?? 0;
    const sql = getSql();

    try {
      const totals = await sql<{ total: number }[]>`
        SELECT COUNT(*)::int AS total FROM lists WHERE workspace_id = ${workspaceId}
      `;

      const rows = await sql<ListRow[]>`
        SELECT id, workspace_id, name, position, created_at, updated_at
        FROM lists
        WHERE workspace_id = ${workspaceId}
        ORDER BY position, created_at
        LIMIT ${limit} OFFSET ${offset}
      `;

      const ids = rows.map((row) => row.id);
      // El orden de los articulos incrustados es deliberado. PostgREST no
      // garantizaba ninguno, asi que la vista previa enseñaba lo que saliera;
      // aqui sale siempre lo mismo.
      const previews = ids.length
        ? await sql<PreviewRow[]>`
            SELECT id, list_id, name, is_completed, position, created_at
            FROM items
            WHERE list_id = ANY(${ids})
            ORDER BY position, created_at
          `
        : [];

      const byList = new Map<string, ListPreviewItem[]>();
      for (const preview of previews) {
        const bucket = byList.get(preview.list_id);
        const item: ListPreviewItem = {
          id: preview.id,
          name: preview.name,
          is_completed: preview.is_completed,
          position: preview.position,
          created_at: toIso(preview.created_at),
        };
        if (bucket) bucket.push(item);
        else byList.set(preview.list_id, [item]);
      }

      const lists: ListWithItems[] = rows.map((row) => ({
        ...toList(row),
        items: byList.get(row.id) ?? [],
      }));

      return { lists, total: totals[0].total };
    } catch (error) {
      throw new RepositoryError('Failed to fetch lists', error);
    }
  },

  async findById(id, workspaceId) {
    const sql = getSql();

    try {
      const rows =
        workspaceId === undefined
          ? await sql<ListRow[]>`
              SELECT id, workspace_id, name, position, created_at, updated_at
              FROM lists WHERE id = ${id}
            `
          : await sql<ListRow[]>`
              SELECT id, workspace_id, name, position, created_at, updated_at
              FROM lists WHERE id = ${id} AND workspace_id = ${workspaceId}
            `;

      return rows.length > 0 ? toList(rows[0]) : null;
    } catch (error) {
      throw new RepositoryError('Failed to fetch list', error);
    }
  },

  async create(workspaceId, name, position = 0) {
    try {
      const rows = await getSql()<ListRow[]>`
        INSERT INTO lists (workspace_id, name, position)
        VALUES (${workspaceId}, ${name}, ${position})
        RETURNING id, workspace_id, name, position, created_at, updated_at
      `;
      return toList(rows[0]);
    } catch (error) {
      throw new RepositoryError('Failed to create list', error);
    }
  },

  async update(id, workspaceId, name) {
    try {
      const rows = await getSql()<ListRow[]>`
        UPDATE lists SET name = ${name}
        WHERE id = ${id} AND workspace_id = ${workspaceId}
        RETURNING id, workspace_id, name, position, created_at, updated_at
      `;
      return rows.length > 0 ? toList(rows[0]) : null;
    } catch (error) {
      throw new RepositoryError('Failed to update list', error);
    }
  },

  async delete(id, workspaceId) {
    try {
      const rows = await getSql()<{ id: string }[]>`
        DELETE FROM lists
        WHERE id = ${id} AND workspace_id = ${workspaceId}
        RETURNING id
      `;
      return rows.length > 0;
    } catch (error) {
      throw new RepositoryError('Failed to delete list', error);
    }
  },
};
