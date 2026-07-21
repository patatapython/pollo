import postgres from 'postgres';

/**
 * Conexion unica a Postgres.
 *
 * El proceso es de larga vida (contenedor en el VPS, no funcion efimera), asi
 * que el pool se crea una vez y se reutiliza. En desarrollo se guarda ademas en
 * `globalThis` porque la recarga en caliente de Next reevalua el modulo y, sin
 * esto, cada guardado dejaria un pool huerfano hasta agotar las conexiones del
 * servidor.
 */

const globalForDb = globalThis as unknown as { pollodb?: postgres.Sql };

let cached: postgres.Sql | undefined = globalForDb.pollodb;

export function getSql(): postgres.Sql {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL env var not configured');
  }

  cached = postgres(url, {
    // El limitador y la ruta de acceso hacen dos consultas por peticion. Diez
    // conexiones sostienen mucho mas trafico del que este producto ve, y dejan
    // margen al max_connections por defecto de Postgres (100) para el resto de
    // proyectos del mismo servidor.
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    // Un fallo de conexion debe subir como error de la consulta, no matar el
    // proceso desde un manejador suelto.
    onnotice: () => {},
  });

  if (process.env.NODE_ENV !== 'production') globalForDb.pollodb = cached;

  return cached;
}

/**
 * Instante en el formato que las rutas ya devuelven al navegador.
 *
 * postgres.js convierte `timestamptz` a `Date`, mientras que PostgREST
 * entregaba una cadena ISO. Las interfaces del repositorio declaran `string`, y
 * las respuestas de la API viajan tal cual al cliente: devolver un `Date` aqui
 * cambiaria la forma del JSON de cada ruta sin tocar ninguna ruta. Se pierde la
 * precision de microsegundos que Postgres guarda, que ninguna pantalla usa.
 */
export function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
