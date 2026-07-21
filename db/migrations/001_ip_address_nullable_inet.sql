-- OBLIGATORIA antes de desplegar la rama que introduce parseClientIp.
--
-- La aplicacion pasa a guardar NULL cuando la peticion no trae una direccion
-- utilizable, en vez de la palabra 'unknown'. La columna viva hoy es
-- `character varying(45) NOT NULL` (ver supabase/live-schema.sql), asi que un
-- despliegue sin esta migracion falla en cada insercion sin cabecera.
--
-- Aplicar contra Supabase mientras siga siendo el proveedor. En el VPS no hace
-- falta: db/schema.sql ya crea la columna con la forma final.
--
-- El orden importa, y no es el intuitivo: la limpieza escribe NULL, asi que la
-- restriccion NOT NULL tiene que caer ANTES de limpiar. Al reves aborta.

BEGIN;

ALTER TABLE rate_limit_attempts ALTER COLUMN ip_address DROP NOT NULL;

-- 'unknown' y cualquier cadena de proxies quedan fuera de INET. No se
-- convierten: se descartan, porque no identifican a nadie.
UPDATE rate_limit_attempts
   SET ip_address = NULL
 WHERE ip_address IS NOT NULL
   AND ip_address !~ '^[0-9a-fA-F:.]+$';

ALTER TABLE rate_limit_attempts
  ALTER COLUMN ip_address TYPE INET USING ip_address::INET;

-- El indice del limitador cubre la consulta real: direccion, resultado y
-- ventana temporal. El antiguo idx_rate_limit_ip_time no existe en la base
-- viva pese a estar declarado en el schema.sql antiguo.
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_success
  ON rate_limit_attempts (ip_address, success, attempted_at);

COMMIT;
