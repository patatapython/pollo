/**
 * Configuración de la aplicación
 * Detecta automáticamente la URL base según el entorno
 */

export function getAppUrl(): string {
  // Si existe NEXT_PUBLIC_APP_URL, usarla (configurada en .env)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // En producción (Vercel/browser)
  if (typeof window !== 'undefined') {
    // Cliente: usar origin del navegador
    return window.location.origin;
  }

  // En servidor sin variable de entorno: usar localhost (desarrollo)
  return 'http://localhost:3000';
}

/**
 * Obtener URL completa para un path
 */
export function getFullUrl(path: string): string {
  const baseUrl = getAppUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}