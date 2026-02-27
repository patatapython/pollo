import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnvVars } from '@/lib/config/env';

describe('validateEnvVars', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv }; // Clonar env para cada test
    });

    afterEach(() => {
        process.env = originalEnv;
    });
    
    // Necesitamos definir el objeto REQUIRED_ENV_VARS dentro del test o importarlo si fuera accesible,
    // pero como es constante interna, probaremos el comportamiento de la función exportada.
    // La función validateEnvVars lee directamente de process.env basándose en SU propia definición interna.
    // Así que configuraremos process.env con valores que sabemos que fallarán o pasarán.

    it('should pass with valid configuration', () => {
        process.env.JWT_SECRET = 'a-super-long-secret-key-that-is-at-least-32-chars';
        process.env.SERVER_SECRET = 'another-super-long-secret-key-that-is-at-least-32-chars';
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'ey...';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'ey...';
        process.env.NODE_ENV = 'test';

        expect(() => validateEnvVars()).not.toThrow();
    });

    it('should throw if a required variable is missing', () => {
        // Falta JWT_SECRET
        process.env.SERVER_SECRET = 'another-super-long-secret-key-that-is-at-least-32-chars';
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'ey...';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'ey...';
        process.env.NODE_ENV = 'test';
        delete process.env.JWT_SECRET;

        expect(() => validateEnvVars()).toThrow(/JWT_SECRET is required/);
    });

    it('should throw if length requirement is not met', () => {
        process.env.JWT_SECRET = 'too-short';
        process.env.SERVER_SECRET = 'another-super-long-secret-key-that-is-at-least-32-chars';
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'ey...';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'ey...';
        process.env.NODE_ENV = 'test';

        expect(() => validateEnvVars()).toThrow(/JWT_SECRET must be at least 32 characters/);
    });
});
