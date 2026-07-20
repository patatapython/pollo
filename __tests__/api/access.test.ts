import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/workspaces/access/route';
import { NextRequest } from 'next/server';

// 1. Mocks de dependencias
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn(),
}));

vi.mock('@/lib/auth/passphrase', () => ({
  computeLookup: vi.fn(),
  verify: vi.fn(),
}));

import { getAdminClient } from '@/lib/supabase/admin';

type MockBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

describe('/api/workspaces/access Integration', () => {
  let mockSupabase: { from: ReturnType<typeof vi.fn> };
  let mockBuilder: MockBuilder;

  beforeEach(() => {
    vi.clearAllMocks();

    // Simulamos un objeto "Thenable" que permite encadenar métodos (select, eq, gt)
    // y al final ser esperado con await (llamando a 'then').
    mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      // Por defecto, la consulta de rate-limit no encuentra intentos fallidos.
      then: vi.fn((resolve) => resolve({ count: 0, error: null })),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockBuilder),
    };

    vi.mocked(getAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof getAdminClient>
    );
  });

  describe('POST', () => {
    it('should return 400 for invalid passphrase (too short)', async () => {
      const req = new NextRequest('http://localhost/api/workspaces/access', {
        method: 'POST',
        body: JSON.stringify({ passphrase: '123' }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('should return 400 when passphrase field is missing', async () => {
      const req = new NextRequest('http://localhost/api/workspaces/access', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('should return 500 on unexpected rate-limit query error', async () => {
      mockBuilder.then = vi.fn((resolve) =>
        resolve({ count: null, error: { message: 'boom' } })
      );

      const req = new NextRequest('http://localhost/api/workspaces/access', {
        method: 'POST',
        body: JSON.stringify({
          passphrase: 'mesa verde compra viernes lago',
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });
});
