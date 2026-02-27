-- Schema para Pollo: Listas Compartidas Anónimas
-- Este archivo refleja el estado final después de todas las migraciones.

-- ============================================
-- Tablas
-- ============================================

-- Tabla: workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passphrase_hash   TEXT NOT NULL,
  passphrase_lookup TEXT NOT NULL UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Tabla: lists
CREATE TABLE IF NOT EXISTS lists (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  position          INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Tabla: items
CREATE TABLE IF NOT EXISTS items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id      UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name         VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  position     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Tabla: rate_limit_attempts
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address   INET NOT NULL,
  success      BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workspaces_lookup ON workspaces(passphrase_lookup);
CREATE INDEX IF NOT EXISTS idx_lists_workspace_id ON lists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_list_completed ON items(list_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_time ON rate_limit_attempts(ip_address, attempted_at);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- No policies: all access goes through the service role key.
-- The anon key cannot read or write any data directly.

-- ============================================
-- Funciones
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-set completed_at
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cleanup rate limit attempts older than 24h
CREATE OR REPLACE FUNCTION cleanup_old_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_attempts WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

DROP TRIGGER IF EXISTS workspaces_updated_at ON workspaces;
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS lists_updated_at ON lists;
CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS items_completed_at ON items;
CREATE TRIGGER items_completed_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();

-- ============================================
-- Realtime
-- ============================================

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE items;
