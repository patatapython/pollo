import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getRepositories, ListWithItems, RepositoryError } from "@/lib/repositories";
const CreateListSchema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(255, "List name must be 255 characters or less")
    .trim(),
});

/**
 * GET /api/lists
 * Obtener todas las listas del workspace
 *
 * Response: { lists: List[] }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Obtener listas e items en una sola consulta con paginación
    let rawLists: ListWithItems[];
    let count: number;
    try {
      const result = await getRepositories().lists.findByWorkspace(
        session.workspaceId,
        { limit, offset },
      );
      rawLists = result.lists;
      count = result.total;
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error("Error fetching lists", error.cause ?? error, { endpoint: "/api/lists", method: "GET" });
        return NextResponse.json(
          { error: "Failed to fetch lists" },
          { status: 500 },
        );
      }
      throw error;
    }

    // Procesar datos en memoria (mucho más rápido que N llamadas a la BD)
    const listsWithCounts = rawLists.map((list) => {
      // Ordenar items (position asc, created_at asc)
      const typedItems = list.items || [];
      const sortedItems = typedItems.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      const total = sortedItems.length;
      const completed = sortedItems.filter((i) => i.is_completed).length;
      const first4Items = sortedItems.slice(0, 4);

      // Eliminamos 'items' del objeto final para no enviar todos los datos si no es necesario
      // o lo mantenemos si el frontend lo usa. El endpoint original devolvía 'previewItems'.
      const { items, ...listData } = list;

      return {
        ...listData,
        itemsCount: {
          total,
          completed,
        },
        previewItems: first4Items,
      };
    });

    return NextResponse.json({
      lists: listsWithCounts,
      meta: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error("Error getting lists", error, { endpoint: "/api/lists", method: "GET" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/lists
 * Crear nueva lista
 *
 * Request: { name: string }
 * Response: { list: List }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateListSchema.parse(body);

    // Crear lista
    let list;
    try {
      list = await getRepositories().lists.create(
        session.workspaceId,
        validatedData.name,
        0,
      );
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error("Error creating list", error.cause ?? error, { endpoint: "/api/lists", method: "POST" });
        return NextResponse.json(
          { error: "Failed to create list" },
          { status: 500 },
        );
      }
      throw error;
    }

    return NextResponse.json(
      {
        list: {
          ...list,
          itemsCount: {
            total: 0,
            completed: 0,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 },
      );
    }
    logger.error("Error creating list", error, { endpoint: "/api/lists", method: "POST" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
