import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnvVars, getDbDriver } from '@/lib/config/env';

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

    /**
     * The capability tier, which is the whole reason CRON_SECRET stopped being
     * invisible. It must warn and must NOT throw: refusing to serve the site
     * because a nightly sweep has no secret trades a degraded background job
     * for a total outage.
     *
     * These were written during the final loopback, after noticing the
     * behaviour had no tests at all *and* had never executed anywhere -- the
     * secret was configured before the warning shipped, so the branch had
     * never once run.
     */
    describe('capability variables', () => {
        function validConfig() {
            process.env.JWT_SECRET = 'a-super-long-secret-key-that-is-at-least-32-chars';
            process.env.SERVER_SECRET = 'another-super-long-secret-key-that-is-at-least-32-chars';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
            process.env.SUPABASE_SERVICE_ROLE_KEY = 'ey...';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'ey...';
            // NODE_ENV no se asigna aqui: vitest ya lo deja puesto y el
            // beforeEach clona el entorno, asi que escribirlo solo añadiria un
            // cuarto TS2540 a los tres preexistentes de este fichero.
        }

        it('warns, and does not throw, when CRON_SECRET is absent', () => {
            validConfig();
            delete process.env.CRON_SECRET;
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => validateEnvVars()).not.toThrow();

            const said = spy.mock.calls.flat().join(' ');
            expect(said).toContain('CRON_SECRET');
            // The message has to name what stops working, or it is just noise
            // in a log nobody reads -- which is how this got missed.
            expect(said).toContain('cleanup-rate-limits');
            spy.mockRestore();
        });

        it('stays quiet once CRON_SECRET is configured', () => {
            validConfig();
            process.env.CRON_SECRET = 'a-cron-secret';
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            validateEnvVars();

            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });

        /**
         * Order matters. A missing required variable already aborts the boot,
         * and printing a list of disabled capabilities on the way out buries
         * the error that actually explains the failure.
         */
        it('says nothing about capabilities when a required variable is missing', () => {
            validConfig();
            delete process.env.JWT_SECRET;
            delete process.env.CRON_SECRET;
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => validateEnvVars()).toThrow();

            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });
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

    /**
     * Which database serves the app is declared, never inferred from whether a
     * connection string happens to be present. A stale DATABASE_URL left in an
     * environment must not be able to redirect production traffic on its own.
     */
    describe('database driver selection', () => {
        beforeEach(() => {
            process.env.JWT_SECRET = 'a-super-long-secret-key-that-is-at-least-32-chars';
            process.env.SERVER_SECRET = 'another-super-long-secret-key-that-is-at-least-32-chars';
        });

        it('defaults to supabase when nothing is declared', () => {
            delete process.env.DB_DRIVER;
            expect(getDbDriver()).toBe('supabase');
        });

        it('refuses a driver it does not implement', () => {
            process.env.DB_DRIVER = 'mysql';
            expect(() => getDbDriver()).toThrow(/DB_DRIVER="mysql" no existe/);
        });

        it('does not switch just because DATABASE_URL is present', () => {
            delete process.env.DB_DRIVER;
            process.env.DATABASE_URL = 'postgres://user:pass@host:5432/pollo';

            expect(getDbDriver()).toBe('supabase');
        });

        it('requires the connection string once postgres is declared', () => {
            process.env.DB_DRIVER = 'postgres';
            delete process.env.DATABASE_URL;

            expect(() => validateEnvVars()).toThrow(/DATABASE_URL is required/);
        });

        it('stops demanding Supabase credentials once postgres is declared', () => {
            process.env.DB_DRIVER = 'postgres';
            process.env.DATABASE_URL = 'postgres://user:pass@host:5432/pollo';
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            expect(() => validateEnvVars()).not.toThrow();
        });
    });
});
