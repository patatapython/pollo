/**
 * Validación de variables de entorno requeridas
 * Falla rápido si falta alguna variable crítica
 */

const REQUIRED_ENV_VARS = {
  JWT_SECRET: { required: true, minLength: 32 },
  SERVER_SECRET: { required: true, minLength: 32 },
  NEXT_PUBLIC_SUPABASE_URL: { required: true },
  SUPABASE_SERVICE_ROLE_KEY: { required: true },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true },
  NODE_ENV: { required: true }
} as const;

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

export function validateEnvVars(): void {
  const errors: string[] = [];

  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
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
