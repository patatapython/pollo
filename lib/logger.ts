/**
 * Logger seguro que oculta información sensible en producción
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
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
      console.warn(`⚠️ ${message}`);
    } else {
      console.warn(`⚠️ ${message}`, context || '');
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.isProduction) {
      // Solo mensaje genérico en producción
      console.error(`🔴 ${message}`);
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
