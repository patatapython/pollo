/**
 * Logger seguro que oculta información sensible en producción
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

/** Anything longer than this is a payload, not a diagnostic. */
const MAX_VALUE_LENGTH = 200;

function truncate(value: string): string {
  return value.length > MAX_VALUE_LENGTH ? `${value.slice(0, MAX_VALUE_LENGTH)}…` : value;
}

/**
 * Reduces an error to the fields that identify a failure without carrying data.
 *
 * `code`, `name` and `message` are written by the database driver or the
 * runtime; they name the failure ("23505", "duplicate key value violates unique
 * constraint \"workspaces_passphrase_lookup_key\""). PostgREST's `details` and
 * `hint` are deliberately excluded: those are the fields that echo the offending
 * row values back.
 */
export function redactError(error: unknown): unknown {
  if (error === null || error === undefined) return undefined;

  if (typeof error === 'object') {
    const source = error as Record<string, unknown>;
    const redacted: Record<string, string> = {};
    for (const field of ['name', 'code', 'message'] as const) {
      const value = source[field];
      if (typeof value === 'string' && value.length > 0) redacted[field] = truncate(value);
      else if (typeof value === 'number') redacted[field] = String(value);
    }
    return Object.keys(redacted).length > 0 ? redacted : { type: 'unknown error' };
  }

  return typeof error === 'string' ? truncate(error) : { type: typeof error };
}

/**
 * Keeps primitive context values — every call site passes route metadata such
 * as `{ endpoint, method }`, which is the whole diagnostic value — and replaces
 * anything structured with its type, since an object is where a payload hides.
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
