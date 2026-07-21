/**
 * Validación de variables de entorno requeridas
 * Falla rápido si falta alguna variable crítica
 */

const COMMON_ENV_VARS = {
  JWT_SECRET: { required: true, minLength: 32 },
  SERVER_SECRET: { required: true, minLength: 32 },
  NODE_ENV: { required: true }
} as const;

/** Cada proveedor de datos necesita lo suyo, y solo lo suyo. */
const DRIVER_ENV_VARS = {
  supabase: {
    NEXT_PUBLIC_SUPABASE_URL: { required: true },
    SUPABASE_SERVICE_ROLE_KEY: { required: true },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true }
  },
  postgres: {
    DATABASE_URL: { required: true }
  }
} as const;

export const DB_DRIVERS = ['supabase', 'postgres'] as const;
export type DbDriver = (typeof DB_DRIVERS)[number];

/**
 * Que base de datos sirve a la aplicacion.
 *
 * Se declara a proposito en vez de deducirse de si `DATABASE_URL` existe.
 * Deducirlo convierte una variable olvidada en el entorno en un cambio de base
 * de datos silencioso: el despliegue arranca contra otro sitio y nadie lo ha
 * pedido. Cambiar de proveedor tiene que ser una frase escrita por alguien.
 */
export function getDbDriver(): DbDriver {
  const value = process.env.DB_DRIVER ?? 'supabase';

  if (!(DB_DRIVERS as readonly string[]).includes(value)) {
    throw new EnvValidationError(
      `🔴 DB_DRIVER="${value}" no existe. Valores validos: ${DB_DRIVERS.join(', ')}`
    );
  }

  return value as DbDriver;
}

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

export function validateEnvVars(): void {
  const errors: string[] = [];
  const required = { ...COMMON_ENV_VARS, ...DRIVER_ENV_VARS[getDbDriver()] };

  for (const [key, config] of Object.entries(required)) {
    const value = process.env[key];

    if (config.required && !value) {
      errors.push(`❌ ${key} is required`);
      continue;
    }

    if (value && 'minLength' in config && config.minLength && value.length < config.minLength) {
      errors.push(`❌ ${key} must be at least ${config.minLength} characters`);
    }
  }

  if (errors.length > 0) {
    throw new EnvValidationError(
      '🔴 Environment Variables Validation Failed:\n\n' + 
      errors.join('\n') + 
      '\n\n💡 Check your .env.local file'
    );
  }

}
