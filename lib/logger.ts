/**
 * Logger seguro que oculta información sensible en producción
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

/** Más largo que esto ya no es un diagnóstico, es una carga útil. */
const MAX_VALUE_LENGTH = 200;

function truncate(value: string): string {
  return value.length > MAX_VALUE_LENGTH ? `${value.slice(0, MAX_VALUE_LENGTH)}…` : value;
}

/**
 * Reduce un error a los campos que identifican el fallo sin arrastrar datos.
 *
 * `code`, `name` y `message` los escribe el driver de base de datos o el
 * runtime: nombran el fallo ("23505", "duplicate key value violates unique
 * constraint"). `details` y `hint` de PostgREST quedan fuera a propósito: son
 * justo los campos que devuelven los valores de la fila infractora.
 */
/**
 * Tipos de error cuyo `message` devuelve la entrada citada. `JSON.parse` sobre
 * un cuerpo que no es JSON produce `Unexpected token 'a', "absorcion "... is
 * not valid JSON`: diez caracteres del cuerpo de la petición, que en la ruta de
 * acceso son la primera palabra de una passphrase. El nombre solo ya identifica
 * el fallo.
 */
const ECHOES_INPUT = new Set(['SyntaxError']);

export function redactError(error: unknown): unknown {
  if (error === null || error === undefined) return undefined;

  if (typeof error === 'object') {
    const source = error as Record<string, unknown>;
    const redacted: Record<string, string> = {};
    const fields =
      typeof source.name === 'string' && ECHOES_INPUT.has(source.name)
        ? (['name', 'code'] as const)
        : (['name', 'code', 'message'] as const);
    for (const field of fields) {
      const value = source[field];
      if (typeof value === 'string' && value.length > 0) redacted[field] = truncate(value);
      else if (typeof value === 'number') redacted[field] = String(value);
    }
    // Un error envuelto guarda la causa real en `cause`. Sin bajar un nivel,
    // un RepositoryError se registra como "Failed to fetch list" y se pierde
    // el codigo de Postgres, que es lo unico que dice que paso de verdad.
    if (source.cause !== undefined && source.cause !== null) {
      const cause = redactError(source.cause);
      if (cause) return { ...redacted, cause } as unknown as Record<string, string>;
    }

    return Object.keys(redacted).length > 0 ? redacted : { type: 'unknown error' };
  }

  return typeof error === 'string' ? truncate(error) : { type: typeof error };
}

/**
 * Conserva los valores primitivos del contexto —todos los sitios que llaman
 * pasan metadatos de ruta como `{ endpoint, method }`, que son todo el valor
 * diagnóstico— y sustituye lo estructurado por su tipo, porque es dentro de un
 * objeto donde se esconde una carga útil.
 */
export function redactContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  const redacted: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string') redacted[key] = truncate(value);
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      redacted[key] = value;
    } else {
      redacted[key] = `[${value === undefined ? 'undefined' : typeof value}]`;
    }
  }
  return redacted;
}

export class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  info(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.log(`ℹ️ ${message}`, context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isProduction) {
      console.warn(`⚠️ ${message}`, redactContext(context) || '');
    } else {
      console.warn(`⚠️ ${message}`, context || '');
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.isProduction) {
      // Un incidente es indiagnosticable sin la causa: se conserva lo que
      // identifica el fallo y se descarta cualquier carga útil.
      console.error(`🔴 ${message}`, {
        error: redactError(error),
        context: redactContext(context),
      });
    } else {
      // Detalles completos en desarrollo
      console.error(`🔴 ${message}`, { error, context });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.debug(`🐛 ${message}`, context || '');
    }
  }
}

export const logger = new Logger();
