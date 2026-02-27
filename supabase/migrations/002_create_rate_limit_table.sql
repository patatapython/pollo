-- ============================================
-- MIGRACIÓN: Crear tabla rate_limit_attempts
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  VARCHAR(45) NOT NULL,  -- soporta IPv4 e IPv6
  success     BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indices para rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_success ON rate_limit_attempts(ip_address, success, attempted_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempted_at ON rate_limit_attempts(attempted_at);

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
