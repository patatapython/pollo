-- Esquema de pollo para PostgreSQL propio (VPS).
--
-- Derivado del DDL real de produccion (supabase/live-schema.sql, 2026-07-21),
-- no del antiguo supabase/schema.sql, que no describia la base viva.
--
-- No se migran datos: los 137 espacios existentes eran 85 copias de la lista de
-- ejemplo mas pruebas de teclado, sin actividad desde el 2026-05-08. Empezar
-- vacio permite dejar fuera lo que una migracion de datos habria obligado a
-- arrastrar. Lo eliminado respecto de produccion, y por que:
--
--   tablas premium_codes e invite_codes  el codigo que las usaba se borro en
--                                        febrero; las tablas se quedaron
--   workspaces.tier, .premium_expires_at  restos del sistema de pago retirado
--   rate_limit_attempts.created_at        duplicaba attempted_at
--   idx_workspaces_lookup                 la restriccion UNIQUE ya mantiene un
--                                         indice sobre esa columna
--   idx_lists_workspace_id                cubierto por el indice compuesto
--                                         (workspace_id, position)
--   idx_items_list_id                     cubierto por (list_id, is_completed)
--   idx_workspaces_tier                   indexaba una columna muerta
--   funcion update_subitems_updated_at    para una tabla subitems inexistente
--   politicas RLS                         la base no se expone a internet; el
--                                         unico acceso es la propia aplicacion
--   funcion cleanup_old_attempts          no existe en la base viva: venia del
--                                         antiguo schema.sql, sin llamantes, y
--                                         con ventana de 24h cuando el cron que
--                                         si limpia usa 7 dias
--
-- CAMBIO DE TIPO QUE EXIGE TOCAR LA APLICACION: ip_address pasa de
-- character varying(45) a inet. Ver la nota al final del fichero.

BEGIN;

CREATE TABLE workspaces (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passphrase_hash   TEXT NOT NULL,
  passphrase_lookup TEXT NOT NULL UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN workspaces.passphrase_lookup IS
  'HMAC-SHA256 de la passphrase. UNIQUE no es decorativo: la ruta de acceso '
  'depende de que cada candidato encaje con una fila como maximo, para que '
  'bcrypt se ejecute una sola vez por peticion. Ver docs/auth-invariants.md.';

CREATE TABLE lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lists_workspace_position ON lists (workspace_id, "position");

CREATE TABLE items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id      UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name         VARCHAR(500) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_list_completed ON items (list_id, is_completed);

CREATE TABLE rate_limit_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address   INET,
  success      BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN rate_limit_attempts.ip_address IS
  'NULL cuando la peticion no trae una IP utilizable. Detras del proxy siempre '
  'la trae; NULL es el caso defensivo, y todas esas peticiones comparten cubo.';

-- Consulta del limitador: intentos fallidos de una IP en los ultimos 15 min.
CREATE INDEX idx_rate_limit_ip_success
  ON rate_limit_attempts (ip_address, success, attempted_at);

-- Barrido periodico de intentos antiguos.
CREATE INDEX idx_rate_limit_attempted_at ON rate_limit_attempts (attempted_at);

CREATE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION set_completed_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER items_completed_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION set_completed_at();

COMMIT;

-- --------------------------------------------------------------------------
-- PENDIENTE ANTES DE DESPLEGAR CONTRA ESTE ESQUEMA
--
-- app/api/workspaces/access/route.ts:24 hace hoy:
--
--     const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
--
-- Contra INET eso falla por tres motivos. Los dos primeros son defectos ya
-- existentes que la columna de texto se limitaba a ocultar; el tercero es una
-- trampa del arreglo mismo:
--
--   1. 'unknown' no es una direccion. Antes de escribirla, la LECTURA ya
--      revienta: countFailedSince hace .eq('ip_address', 'unknown') y Postgres
--      responde 22P02. Esa rama devuelve 500 antes de autenticar a nadie, asi
--      que no es un limitador degradado: es una caida completa del login para
--      toda peticion sin x-forwarded-for. Hay que guardar NULL.
--   2. x-forwarded-for puede traer una lista ("cliente, proxy1, proxy2"). Hoy
--      se guarda entera, asi que dos peticiones del mismo cliente por rutas
--      distintas cuentan como IPs distintas y el limitador se puede esquivar.
--      Hay que quedarse con la primera entrada y validarla.
--   3. Guardar NULL no basta. `.eq(columna, null)` genera `columna = NULL`, que
--      en SQL nunca es cierto, asi que countFailedSince devolveria 0 para
--      siempre en ese camino: intentos ilimitados y ningun 429, en silencio.
--      El repositorio tiene que usar `.is('ip_address', null)` cuando la
--      direccion falta. Sin eso, el comentario de la columna de arriba
--      ("todas esas peticiones comparten cubo") seria falso.
--
-- El cambio va emparejado con este esquema: desplegar uno sin el otro tumba el
-- login, y arreglarlo a medias apaga el limitador sin avisar.
-- --------------------------------------------------------------------------
