import { getSql, toIso } from '@/lib/db/client';
import { Item, ItemRepository, RepositoryError } from '@/lib/repositories/types';

type ItemRow = Omit<Item, 'created_at' | 'updated_at' | 'completed_at'> & {
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
};

const COLUMNS = 'id, list_id, name, is_completed, completed_at, position, created_at, updated_at';

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    list_id: row.list_id,
    name: row.name,
    is_completed: row.is_completed,
    completed_at: row.completed_at === null ? null : toIso(row.completed_at),
    position: row.position,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export const postgresItemRepository: ItemRepository = {
  async findByList(listId, status = 'all') {
    const sql = getSql();

    try {
      const rows = await sql<ItemRow[]>`
        SELECT ${sql.unsafe(COLUMNS)}
        FROM items
        WHERE list_id = ${listId}
        ${
          status === 'active'
            ? sql`AND is_completed = false`
            : status === 'purchased'
              ? sql`AND is_completed = true`
              : sql``
        }
        ORDER BY is_completed, created_at
      `;
      return rows.map(toItem);
    } catch (error) {
      throw new RepositoryError('Failed to fetch items', error);
    }
  },

  async findById(id, listId) {
    const sql = getSql();

    try {
      const rows = await sql<ItemRow[]>`
        SELECT ${sql.unsafe(COLUMNS)} FROM items
        WHERE id = ${id} AND list_id = ${listId}
      `;
      return rows.length > 0 ? toItem(rows[0]) : null;
    } catch (error) {
      throw new RepositoryError('Failed to fetch item', error);
    }
  },

  async create(listId, data) {
    const sql = getSql();

    try {
      const rows = await sql<ItemRow[]>`
        INSERT INTO items (list_id, name, is_completed, position)
        VALUES (${listId}, ${data.name}, false, ${data.position ?? 0})
        RETURNING ${sql.unsafe(COLUMNS)}
      `;
      return toItem(rows[0]);
    } catch (error) {
      throw new RepositoryError('Failed to create item', error);
    }
  },

  /**
   * La posicion es el indice dentro de la tanda, igual que antes: el orden en
   * que llegan los nombres es el orden en que se guardan.
   */
  async createMany(listId, names) {
    if (names.length === 0) return;

    const sql = getSql();
    const rows = names.map((name, position) => ({ list_id: listId, name, position }));

    try {
      await sql`INSERT INTO items ${sql(rows, 'list_id', 'name', 'position')}`;
    } catch (error) {
      throw new RepositoryError('Failed to create items', error);
    }
  },

  /**
   * `completed_at` no se toca aqui: lo escribe el disparador `set_completed_at`
   * del esquema, que es quien sabe distinguir "se acaba de marcar" de "ya
   * estaba marcado". Igual que `updated_at`.
   */
  async update(id, listId, data) {
    const sql = getSql();
    const fields = Object.keys(data).filter(
      (key) => data[key as keyof typeof data] !== undefined
    );

    try {
      // Sin campos no hay nada que escribir, pero el contrato sigue pidiendo la
      // fila o `null`, asi que se consulta en vez de construir un UPDATE vacio.
      if (fields.length === 0) return this.findById(id, listId);

      const rows = await sql<ItemRow[]>`
        UPDATE items SET ${sql(data, ...(fields as ('name' | 'is_completed')[]))}
        WHERE id = ${id} AND list_id = ${listId}
        RETURNING ${sql.unsafe(COLUMNS)}
      `;
      return rows.length > 0 ? toItem(rows[0]) : null;
    } catch (error) {
      throw new RepositoryError('Failed to update item', error);
    }
  },

  async delete(id, listId) {
    try {
      const rows = await getSql()<{ id: string }[]>`
        DELETE FROM items
        WHERE id = ${id} AND list_id = ${listId}
        RETURNING id
      `;
      return rows.length > 0;
    } catch (error) {
      throw new RepositoryError('Failed to delete item', error);
    }
  },
};
