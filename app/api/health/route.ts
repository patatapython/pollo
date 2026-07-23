import { NextResponse } from 'next/server';
import { getRepositories } from '@/lib/repositories';
import { logger } from '@/lib/logger';

/**
 * Sonda de vida para el orquestador.
 *
 * `restart=unless-stopped` solo reacciona si el proceso muere. Un servidor vivo
 * pero incapaz de servir —pool de conexiones agotado, base caida— se queda
 * arriba indefinidamente y nadie se entera. Esta ruta es lo que convierte ese
 * fallo silencioso en un reinicio.
 *
 * Por eso *consulta la base* en vez de devolver 200 sin mas. Una sonda que no
 * comprueba su unica dependencia declara sano justo el caso que deberia cazar,
 * y ademas hace creer que el problema esta cubierto.
 *
 * Es publica y sin autenticar, asi que la respuesta no lleva detalle alguno: el
 * motivo del fallo se registra en el servidor. Un mensaje de error de conexion
 * puede arrastrar la cadena de conexion entera con su contrasena dentro.
 */

// Sin esto Next puede tratar el handler como estatico y servir para siempre el
// primer 200 que genero al construir: una sonda respondida desde una cache no
// es una sonda.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    await getRepositories().health.ping();
  } catch (error) {
    logger.error('Health check failed', error, { endpoint: '/api/health' });

    // 503 y no 500: "esta instancia no puede servir" es lo que un orquestador
    // debe leer, y se distingue de "esta peticion ha reventado".
    return NextResponse.json(
      { status: 'unavailable' },
      { status: 503, headers: NO_STORE }
    );
  }

  return NextResponse.json({ status: 'ok' }, { headers: NO_STORE });
}
