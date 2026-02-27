import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/lists/route';
import { NextRequest } from 'next/server';

// 1. Mocks de dependencias
vi.mock('@/lib/auth/session', () => ({
  verifySession: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() }
}));

import { verifySession } from '@/lib/auth/session';
import { getAdminClient } from '@/lib/supabase/admin';

describe('/api/lists Integration', () => {
    let mockSupabase: any;
    let mockBuilder: any; // Instancia simulada de PostgrestBuilder

    beforeEach(() => {
        vi.clearAllMocks();

        // Simulamos un objeto "Thenable" que permite encadenar métodos (select, eq, order)
        // y al final ser esperado con await (llamando a 'then').
        mockBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            // La función 'then' es lo que hace que sea awaitable.
            // Por defecto devuelve array vacío.
            then: vi.fn((resolve) => resolve({ data: [], error: null }))
        };

        mockSupabase = {
            from: vi.fn().mockReturnValue(mockBuilder),
        };

        (getAdminClient as any).mockReturnValue(mockSupabase);
    });

    describe('GET', () => {
        it('should return 401 if not authenticated', async () => {
            (verifySession as any).mockResolvedValue(null);
            const req = new NextRequest('http://localhost/api/lists');
            const res = await GET(req);
            expect(res.status).toBe(401);
        });

        it('should return lists with processed item counts', async () => {
            (verifySession as any).mockResolvedValue({ workspaceId: 'ws-123' });

            // Datos simulados de la DB
            const mockData = [
                {
                    id: 'l1',
                    name: 'Lista 1',
                    items: [
                        { id: 'i1', is_completed: true, position: 0, created_at: '2023-01-01' },
                        { id: 'i2', is_completed: false, position: 1, created_at: '2023-01-02' }
                    ]
                }
            ];

            // Configuramos el mock para devolver estos datos
            mockBuilder.then = vi.fn((resolve) => resolve({ data: mockData, error: null }));

            const req = new NextRequest('http://localhost/api/lists');
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.lists).toHaveLength(1);
            expect(json.lists[0].itemsCount).toEqual({ total: 2, completed: 1 });
            expect(mockSupabase.from).toHaveBeenCalledWith('lists');
        });

        it('should handle DB errors gracefully', async () => {
            (verifySession as any).mockResolvedValue({ workspaceId: 'ws-123' });
            
            // Simular error de DB
            mockBuilder.then = vi.fn((resolve) => resolve({ data: null, error: { message: 'DB Error' } }));

            const req = new NextRequest('http://localhost/api/lists');
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(500);
            expect(json.error).toBe('Failed to fetch lists');
        });
        it('should support pagination', async () => {
            (verifySession as any).mockResolvedValue({ workspaceId: 'ws-123' });

            const mockData = [{ id: 'l1', name: 'Lista 1' }];
            // Configuramos count (segundo argumento de resolve)
            mockBuilder.then = vi.fn((resolve) => resolve({ data: mockData, error: null, count: 10 }));

            const req = new NextRequest('http://localhost/api/lists?limit=5&offset=10');
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.meta).toEqual({
                total: 10,
                limit: 5,
                offset: 10
            });
            expect(mockBuilder.range).toHaveBeenCalledWith(10, 14); // offset, offset + limit - 1
        });
    });

    describe('POST', () => {
        it('should create a new list', async () => {
            (verifySession as any).mockResolvedValue({ workspaceId: 'ws-123' });

            const newList = { id: 'new-list', name: 'New List', position: 0 };
            
            // Configurar respuesta para insert().select().single()
            mockBuilder.then = vi.fn((resolve) => resolve({ data: newList, error: null }));

            const req = new NextRequest('http://localhost/api/lists', {
                method: 'POST',
                body: JSON.stringify({ name: 'New List' })
            });
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(201);
            expect(json.list.name).toBe('New List');
            expect(mockBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New List',
                workspace_id: 'ws-123'
            }));
        });
    });
});
