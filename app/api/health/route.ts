import { NextRequest, NextResponse } from 'next/server';
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
 * La respuesta no lleva detalle alguno: el motivo del fallo se registra en el
 * servidor. Un mensaje de error de conexion puede arrastrar la cadena de
 * conexion entera con su contrasena dentro.
 *
 * SOLO RESPONDE POR LOOPBACK. El healthcheck del contenedor la llama con
 * `curl http://127.0.0.1:3000/api/health`, sin pasar por el proxy. Desde
 * internet no la llama nada legitimo, y expuesta ahi solo añade un endpoint sin
 * autenticar que consume una conexion de un pool limitado a 10: quien quisiera
 * ahogar la aplicacion tendria una forma barata de hacerlo, y ademas apagaria
 * la sonda que existe para detectarlo.
 *
 * La distincion es la cabecera `Host`, y no es una heuristica: la pone curl en
 * la sonda (`127.0.0.1:3000`) y la conserva Traefik en el trafico publico
 * (`www.pollolist.app`). Falsificarla desde fuera no sirve, porque una peticion
 * con `Host: 127.0.0.1` no casa la regla de enrutado del proxy y muere ahi. El
 * puerto 3000 tampoco es alcanzable desde internet: no esta publicado y
 * `DOCKER-USER` solo deja pasar 80 y 443 (docs/vps-network-boundary.md).
 */

// Sin esto Next puede tratar el handler como estatico y servir para siempre el
// primer 200 que genero al construir: una sonda respondida desde una cache no
// es una sonda.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

/** El `Host` tal cual, sin el puerto, que es lo que distingue sonda de publico. */
function isLoopbackRequest(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? '';
  return LOOPBACK_HOSTS.has(host.replace(/:\d+$/, ''));
}

export async function GET(request: NextRequest) {
  // 404 y no 403: desde fuera, esta ruta no deberia siquiera parecer existir.
  if (!isLoopbackRequest(request)) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: NO_STORE }
    );
  }

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
