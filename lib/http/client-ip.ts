import { isIP } from 'node:net';

/**
 * Direccion del cliente a partir de `x-forwarded-for`, o `null` si no hay una
 * utilizable.
 *
 * Dos motivos para no usar la cabecera tal cual, y los dos son defectos que la
 * columna de texto llevaba tiempo tapando:
 *
 *  1. La cabecera puede traer una cadena de proxies ("cliente, proxy1, proxy2").
 *     Guardarla entera hace que el mismo cliente, llegando por rutas distintas,
 *     cuente como direcciones distintas: el limitador de intentos se esquiva
 *     simplemente variando el camino. La primera entrada es el cliente.
 *  2. Sin cabecera se guardaba la palabra 'unknown', que no es una direccion.
 *     Contra una columna INET eso no solo falla al escribir: falla antes, al
 *     LEER los intentos, y esa consulta esta antes de autenticar.
 *
 * `null` significa "sin direccion utilizable". Todas esas peticiones comparten
 * un unico cubo del limitador, igual que compartian el de 'unknown'.
 */
export function parseClientIp(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null;

  const first = forwardedFor.split(',')[0].trim();
  if (!first) return null;

  // Algunos proxies escriben "1.2.3.4:5678" o "[::1]:5678".
  const bracketed = first.match(/^\[(.+)\](?::\d+)?$/);
  const candidate = bracketed ? bracketed[1] : first.replace(/:\d+$/, '');

  if (isIP(candidate)) return candidate;
  // Un IPv6 sin corchetes contiene ':' y el recorte anterior lo habria roto.
  return isIP(first) ? first : null;
}
