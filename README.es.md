<div align="center">

<img src="public/logo_solo.png" alt="Pollo" width="140" />

# POLLO

### La app de listas que no sabe quién eres.

**Sin cuentas. Sin email. Sin contraseña. Solo cinco palabras.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Self-hosted](https://img.shields.io/badge/Self--hosted-Coolify_en_un_VPS-6B16ED?style=flat-square)](https://coolify.io)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![MIT License](https://img.shields.io/badge/Licencia-MIT-f0c040?style=flat-square)](LICENSE)

<br/>

[Read this in English](README.md) · [Demo en vivo](https://pollolist.app) · [Reportar bug](https://github.com/patatapython/pollo/issues)

</div>

---

## Capturas de pantalla

<div align="center">

<table>
  <tr>
    <td align="center" width="25%">
      <img src="img/cp1.png" width="180" alt="Pantalla de acceso" /><br/>
      <sub><b>Sin cuenta</b><br/>Abre la app, recibe cinco palabras, entra.</sub>
    </td>
    <td align="center" width="25%">
      <img src="img/cp2.png" width="180" alt="Tu espacio está listo" /><br/>
      <sub><b>Tu passphrase</b><br/>Cinco palabras. La única llave a tu espacio.</sub>
    </td>
    <td align="center" width="25%">
      <img src="img/cp3.png" width="180" alt="Dashboard con listas" /><br/>
      <sub><b>Tus listas</b><br/>Todas en un lugar, compartidas en tiempo real.</sub>
    </td>
    <td align="center" width="25%">
      <img src="img/cp4.png" width="180" alt="Lista con items" /><br/>
      <sub><b>Tacha lo que hagas</b><br/>Funciona offline y sincroniza al volver.</sub>
    </td>
  </tr>
</table>

</div>

---

## La idea

La mayoría de apps te hacen crear una cuenta antes de que puedas hacer algo útil. Te piden el email, que lo verifiques, que elijas contraseña, que aceptes la política de privacidad, y para entonces ya has olvidado lo que querías apuntar.

Pollo funciona diferente.

Recibes **cinco palabras aleatorias**. Esa es tu cuenta. Esa es tu contraseña. Eso es lo que compartes. Sin registro. Sin datos sobre ti. Abre la app, escribe tu lista, ciérrala. Vuelve mañana con tus cinco palabras y todo sigue ahí.

```
horse · rain · table · fire · sun
```

Eso es todo. Ese es tu espacio.

### Dos cosas igual de fáciles

**Usarlo tú:**
Introduce tus cinco palabras → estás dentro. Desde cualquier dispositivo, en cualquier momento.

**Compartirlo con alguien:**
Dales tus cinco palabras → entran al mismo espacio exacto. Las mismas listas. En tiempo real. Sin invitaciones, sin cuentas, sin permisos. Solo palabras.

Esto hace que Pollo sea genuinamente útil para parejas, compañeros de piso, familias o equipos pequeños que quieren listas compartidas sin la complejidad de una herramienta de colaboración.

---

## Cómo funciona el sistema de passphrase

Este es el núcleo técnico del proyecto.

### Generación

Las passphrases se generan desde un diccionario curado de **7.776 palabras en español** obtenido de [dadoware-bonito-es](https://github.com/mir123/dadoware-bonito-es) de [@mir123](https://github.com/mir123), una lista de palabras Diceware en español basada en el estándar EFF. Se seleccionan cinco palabras con `crypto.getRandomValues()` y rejection sampling para eliminar el sesgo de módulo:

```typescript
function getSecureRandomIndex(max: number): number {
  const bytesNeeded = Math.ceil(Math.log2(max) / 8);
  const maxValid = Math.pow(256, bytesNeeded);
  const limit = maxValid - (maxValid % max);

  while (true) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(bytesNeeded));
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = (value << 8) | randomBytes[i];
    }
    if (value < limit) return value % max;
  }
}
```

**Entropía:** ~12,9 bits × 5 palabras = **~64,5 bits totales**: 7.776⁵ ≈ 28 billones de combinaciones. La fuerza bruta no es un ataque viable.

### Almacenamiento: dos hashes, un secreto, cero texto plano

La passphrase **nunca se almacena en texto plano**. Se guardan dos valores derivados:

| Campo | Algoritmo | Propósito |
|---|---|---|
| `passphrase_hash` | bcrypt (12 rondas) | Verificación, lento por diseño |
| `passphrase_lookup` | HMAC-SHA256 | Búsqueda O(1) indexada |

bcrypt es no determinista: no puedes hacer `WHERE hash = bcrypt(input)`, sería un escaneo completo. HMAC es determinista: misma entrada + mismo secreto = misma salida. El login es una sola consulta indexada.

```mermaid
flowchart LR
    A["Usuario escribe\n'horse rain\ntable fire sun'"]
    A --> B["HMAC-SHA256\n+ SERVER_SECRET"]
    A --> C["bcrypt.compare\n+ hash guardado"]
    B --> D[("Consulta\nindexada DB")]
    D --> E["Encuentra workspace"]
    C --> F["Verifica identidad"]
    E & F --> G["Acceso concedido"]
```

`SERVER_SECRET` nunca toca la base de datos. Una DB filtrada da al atacante hashes bcrypt (caros de crackear) y digests HMAC (inútiles sin el secreto). **Dos capas, dos secretos, cero filtración útil.**

---

## Funcionalidades

| | |
|---|---|
| **Auth sin cuenta** | Passphrase de cinco palabras, generada criptográficamente |
| **Múltiples listas** | Listas e items ilimitados por workspace |
| **Soporte offline** | Funciona sin internet, sincroniza al reconectar |
| **Kit de recuperación** | Exporta la passphrase como archivo de texto o imagen |
| **Bilingüe** | Interfaz completa en español e inglés con selector de idioma |
| **Mobile-first** | UI responsive y táctil; se instala como PWA desde el navegador |
| **Rate limiting** | Protección por IP contra fuerza bruta |
| **Sin tracking** | Sin analytics, sin cookies más allá de la sesión |

**Todavía no: sincronización en vivo entre dispositivos.** La primera versión dependía de las suscripciones a cambios de la base de datos alojada, y nunca llegó a recibir un evento: la suscripción conectaba, pero la seguridad a nivel de fila no tenía política para clientes anónimos. Se está rehaciendo con `LISTEN/NOTIFY` de PostgreSQL y Server-Sent Events. Mientras tanto, los cambios hechos desde otro dispositivo aparecen al recargar la lista.

---

## Stack tecnológico

[![Next.js](https://img.shields.io/badge/Next.js_16_(App_Router)-000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-FF6B35?style=for-the-badge)](https://zustand-demo.pmnd.rs)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Coolify](https://img.shields.io/badge/Coolify_+_Traefik-6B16ED?style=for-the-badge)](https://coolify.io)

La capa de auth es completamente propia: **JWT** (`jose`) + **bcrypt** (`bcryptjs`) + **HMAC-SHA256** (Web Crypto API). Sin dependencias de librerías de auth.

Producción corre en un VPS propio: la aplicación en un contenedor gestionado por Coolify, TLS con Traefik y Let's Encrypt, y un PostgreSQL propio al que no se puede llegar desde internet. El acceso a datos pasa por una capa de repositorios (`lib/repositories`) construida sobre `postgres.js`.

---

## Seguridad

| Riesgo | Solución |
|---|---|
| Almacenamiento de passphrase | bcrypt factor 12, lento a propósito |
| Búsqueda de passphrase | HMAC-SHA256 con secreto server-side |
| Sesión | JWT HS256, cookie httpOnly, expiración 24h |
| XSS | Cookies httpOnly: JS no puede leer el token |
| CSRF | SameSite=lax |
| Clickjacking | `X-Frame-Options: DENY` |
| Fuerza bruta | Rate limiting por IP |
| Transporte | HSTS max-age 2 años |
| Exposición de la base de datos | Inaccesible desde internet: cortafuegos de denegación por defecto en la cadena propia de Docker, reinstalado en cada arranque ([detalle](docs/vps-network-boundary.md)) |
| Secretos | Validados al arrancar: la app no arranca si falta alguno |

---

## Esquema de base de datos

<details>
<summary>Ver esquema</summary>

```sql
workspaces
  id                UUID PRIMARY KEY
  passphrase_hash   TEXT          -- bcrypt(passphrase, 12 rondas)
  passphrase_lookup TEXT UNIQUE   -- HMAC-SHA256(passphrase, SERVER_SECRET)
  created_at        TIMESTAMPTZ

lists
  id                UUID PRIMARY KEY
  workspace_id      UUID → workspaces
  name              VARCHAR(255)
  position          INT

items
  id                UUID PRIMARY KEY
  list_id           UUID → lists
  name              VARCHAR(500)
  is_completed      BOOLEAN
  completed_at      TIMESTAMPTZ   -- lo pone y lo quita un trigger
  position          INT

rate_limit_attempts
  ip_address        INET
  success           BOOLEAN
  attempted_at      TIMESTAMPTZ   -- se borra a los 7 días con una tarea diaria
```

Índices en cada FK y campo de búsqueda. `passphrase_lookup` tiene índice único, así que el login es siempre una sola consulta indexada. El DDL completo, con el porqué de cada decisión, está en [`db/schema.sql`](db/schema.sql).

</details>

---

## Ejecución local

**Requisitos:** Node.js 20.9+ y Docker.

```bash
git clone https://github.com/patatapython/pollo.git
cd pollo
npm install

# PostgreSQL 16 en Docker, en el puerto 55432
npm run test:db:up
docker exec pollo-pg-dev sh -c 'until pg_isready -h 127.0.0.1 -q; do sleep 1; done'
docker exec -i pollo-pg-dev psql -U postgres -d pollo -v ON_ERROR_STOP=1 < db/schema.sql

cp .env.example .env.local   # y rellena tus secretos
npm run dev
```

<details>
<summary>Variables de entorno (las mismas que <code>.env.example</code>)</summary>

```env
# Obligatorias
DB_DRIVER=postgres
DATABASE_URL=postgres://postgres:dev@127.0.0.1:55432/pollo
JWT_SECRET=minimo-32-caracteres-aleatorios
SERVER_SECRET=minimo-32-caracteres-aleatorios

# Opcional: activa el endpoint de limpieza diaria /api/cron/cleanup-rate-limits
CRON_SECRET=cadena-aleatoria

# Temporales: las sigue leyendo el cliente de realtime antiguo (lib/supabase/realtime.ts)
# y sin ellas la página de la lista no carga. Desaparecen con la reescritura a SSE.
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Generar secretos: `openssl rand -base64 48`

`DB_DRIVER` se escribe a propósito. La aplicación no deduce la base de datos de las variables que haya definidas, así que una variable olvidada nunca puede cambiarla en silencio por otra.

</details>

---

## Decisiones de arquitectura

<details>
<summary>¿Por qué sin cuentas de usuario?</summary>

Cuentas de usuario implican emails, lo que implica una base de datos que vale la pena atacar. Workspaces con passphrase significan: cero PII almacenado, nada útil que filtrar, cero fricción en el primer uso.

El tradeoff es deliberado: pierdes tus cinco palabras, pierdes tu workspace. No hay "olvidé mi contraseña" porque no hay email. Feature, not bug.

</details>

<details>
<summary>¿Por qué HMAC para lookup en vez de bcrypt?</summary>

bcrypt es no determinista: dos hashes del mismo input dan valores distintos. `WHERE hash = bcrypt(input)` es imposible. Necesitarías un escaneo completo de la tabla.

HMAC-SHA256 es determinista. Se computa en el login, se consulta `WHERE lookup = hmac(input, secret)` sobre una columna indexada. Una sola consulta, tiempo constante, escala indefinidamente.

El secreto HMAC nunca toca la base de datos. Acceso completo a la DB + sin secreto del servidor = cero passphrases recuperadas.

</details>

<details>
<summary>¿Por qué una capa de repositorios?</summary>

Pollo empezó en Supabase y se mudó a un PostgreSQL propio en un VPS. Las rutas nunca hablan con un cliente de base de datos: piden a `lib/repositories` workspaces, listas, items y rate limits, y `DB_DRIVER` elige la implementación. Eso convirtió la mudanza en un cambio de configuración respaldado por tests, no en una reescritura, y la implementación antigua se queda como vuelta atrás hasta que se apague la plataforma anterior.

</details>

<details>
<summary>¿Por qué Zustand en vez de Redux?</summary>

El estado es pequeño y viene del servidor. La API minimalista de Zustand (sin boilerplate, sin providers, sin split de actions/reducers) encaja con la filosofía del proyecto: lo mínimo necesario, bien hecho.

</details>

---

## Tests

```bash
npm test             # tests unitarios y de API
npm run test:ui      # Vitest UI en el navegador
npm run test:db:up   # arranca el contenedor de PostgreSQL 16 de pruebas
npm run test:db      # tests de integración contra esa base de datos real
```

Los tests unitarios y de API cubren el crypto de passphrases, el ciclo de sesiones, la validación de las APIs y sus caminos de error, las comprobaciones de arranque y un escaneo que falla si el código lee una variable de entorno que nadie declaró. La suite de integración aplica `db/schema.sql` a una base vacía y ejecuta cada repositorio de PostgreSQL contra ella, porque un doble de test confirmaría encantado un rate limiter que no cuenta nada.

---

## Contribuir

Proyecto de portfolio, pero issues y PRs son bienvenidos. Para problemas de seguridad, usa un issue privado.

---

## Licencia

MIT, ver [LICENSE](LICENSE).

---

<div align="center">

<sub>Construido con la convicción de que el software no necesita saber quién eres para ser útil.</sub>

</div>
