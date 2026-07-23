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

/**
 * Variables sin las que la aplicacion sirve, pero una capacidad concreta queda
 * apagada. No lanzan a proposito: dejar el sitio entero caido porque falta el
 * secreto de un barrido nocturno cambia una tarea degradada por una caida
 * total, que es peor negocio.
 *
 * Pero tampoco pueden callar. `CRON_SECRET` no estaba declarado en ningun sitio
 * de este fichero, asi que el despliegue al VPS arranco perfecto y la limpieza
 * empezo a devolver 500 una vez al dia, a las 03:00, contra un registro que
 * nadie mira. Se descubrio de rebote semanas despues. El aviso va al arrancar,
 * que es cuando hay una persona delante.
 */
const CAPABILITY_ENV_VARS = {
  CRON_SECRET: {
    capability: 'limpieza programada de rate_limit_attempts (/api/cron/cleanup-rate-limits)'
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

/**
 * Toda variable de entorno que la aplicacion lee, declarada en un solo sitio.
 *
 * No es documentacion: `__tests__/lib/config/env-declared.test.ts` recorre el
 * codigo fuente y exige que este conjunto y las lecturas reales del entorno
 * coincidan en ambas direcciones. Sin esa prueba, este fichero volveria a
 * afirmar que es la lista completa sin serlo, que es justo como se colo
 * `CRON_SECRET`.
 *
 * Ese escaner busca el patron literal de lectura, comentarios incluidos, asi
 * que mencionarlo en prosa aqui hace fallar la prueba. Se deja asi a
 * proposito: sesgado hacia el falso positivo, que falla a gritos y se corrige
 * en un minuto, en vez de hacia el falso negativo, que esconderia justo la
 * variable que nadie declaro.
 */
export const DECLARED_ENV_VARS: ReadonlySet<string> = new Set([
  ...Object.keys(COMMON_ENV_VARS),
  ...Object.values(DRIVER_ENV_VARS).flatMap((vars) => Object.keys(vars)),
  ...Object.keys(CAPABILITY_ENV_VARS),
  // Se lee en getDbDriver() con su propio valor por defecto, no por la tabla.
  'DB_DRIVER',
]);

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

  // Se avisa despues de las obligatorias: si el arranque va a fallar de todas
  // formas, una lista de capacidades apagadas solo tapa el error que importa.
  //
  // `console` y no el logger del proyecto: esto corre tambien desde el
  // middleware, que Next ejecuta en el runtime de edge, y ahi no se puede dar
  // por hecho que las dependencias del logger existan.
  for (const [key, { capability }] of Object.entries(CAPABILITY_ENV_VARS)) {
    if (!process.env[key]) {
      console.error(
        `⚠️  ${key} no esta configurada: ${capability} queda desactivada. ` +
        'La aplicacion sirve igual; esto no es una caida.'
      );
    }
  }
}
