-- ============================================================================
-- COMPREHENSIVE ERROR LOGGING FOR SUPABASE
-- ============================================================================
-- Copy-paste this entire script into your Supabase SQL Editor
-- Run it to create audit logging tables and enable error tracking
-- ============================================================================

-- 1. CREATE AUDIT LOG TABLE FOR TRACKING ALL OPERATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  error_message TEXT,
  error_code VARCHAR(50),
  error_stack TEXT,
  payload JSONB,
  response JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CREATE ERROR LOG TABLE FOR DETAILED ERROR TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  function_name VARCHAR(255),
  line_number INTEGER,
  context_data JSONB,
  severity VARCHAR(20) NOT NULL DEFAULT 'ERROR',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 3. CREATE API CALL LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  user_email VARCHAR(255),
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE SUPABASE OPERATION LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS supabase_operation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_name VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  operation_type VARCHAR(20),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  error_code VARCHAR(50),
  rows_affected INTEGER,
  execution_time_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  user_email VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CREATE LOGIN ATTEMPT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_attempt_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  session_id VARCHAR(255) NOT NULL,
  step VARCHAR(50) NOT NULL,
  captured_email VARCHAR(255),
  captured_code VARCHAR(10),
  remember_device BOOLEAN,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_function_name ON error_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_is_resolved ON error_logs(is_resolved);

CREATE INDEX IF NOT EXISTS idx_api_call_logs_created_at ON api_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_endpoint ON api_call_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_user_email ON api_call_logs(user_email);

CREATE INDEX IF NOT EXISTS idx_supabase_operation_logs_created_at ON supabase_operation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supabase_operation_logs_table_name ON supabase_operation_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_supabase_operation_logs_success ON supabase_operation_logs(success);

CREATE INDEX IF NOT EXISTS idx_login_attempt_logs_created_at ON login_attempt_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempt_logs_session_id ON login_attempt_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_login_attempt_logs_email ON login_attempt_logs(email);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempt_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for logging (backend can log operations)
DROP POLICY IF EXISTS "Allow anon insert audit_logs" ON audit_logs;
CREATE POLICY "Allow anon insert audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select audit_logs" ON audit_logs;
CREATE POLICY "Allow anon select audit_logs" ON audit_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert error_logs" ON error_logs;
CREATE POLICY "Allow anon insert error_logs" ON error_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select error_logs" ON error_logs;
CREATE POLICY "Allow anon select error_logs" ON error_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert api_call_logs" ON api_call_logs;
CREATE POLICY "Allow anon insert api_call_logs" ON api_call_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select api_call_logs" ON api_call_logs;
CREATE POLICY "Allow anon select api_call_logs" ON api_call_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert supabase_operation_logs" ON supabase_operation_logs;
CREATE POLICY "Allow anon insert supabase_operation_logs" ON supabase_operation_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select supabase_operation_logs" ON supabase_operation_logs;
CREATE POLICY "Allow anon select supabase_operation_logs" ON supabase_operation_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert login_attempt_logs" ON login_attempt_logs;
CREATE POLICY "Allow anon insert login_attempt_logs" ON login_attempt_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select login_attempt_logs" ON login_attempt_logs;
CREATE POLICY "Allow anon select login_attempt_logs" ON login_attempt_logs
  FOR SELECT USING (true);

-- 8. CREATE HELPER FUNCTIONS FOR LOGGING (OPTIONAL BUT USEFUL)
-- ============================================================================
CREATE OR REPLACE FUNCTION log_error(
  p_error_type VARCHAR,
  p_error_message TEXT,
  p_error_stack TEXT,
  p_function_name VARCHAR,
  p_context_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO error_logs (
    error_type,
    error_message,
    error_stack,
    function_name,
    context_data,
    severity
  ) VALUES (
    p_error_type,
    p_error_message,
    p_error_stack,
    p_function_name,
    p_context_data,
    'ERROR'
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_supabase_operation(
  p_operation_name VARCHAR,
  p_table_name VARCHAR,
  p_operation_type VARCHAR,
  p_success BOOLEAN,
  p_error_message TEXT,
  p_rows_affected INTEGER,
  p_input_data JSONB,
  p_session_id VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO supabase_operation_logs (
    operation_name,
    table_name,
    operation_type,
    success,
    error_message,
    rows_affected,
    input_data,
    session_id
  ) VALUES (
    p_operation_name,
    p_table_name,
    p_operation_type,
    p_success,
    p_error_message,
    p_rows_affected,
    p_input_data,
    p_session_id
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 9. SAMPLE QUERIES FOR MONITORING ERRORS
-- ============================================================================
-- Query 1: Get recent errors
-- SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 20;

-- Query 2: Get failed Supabase operations
-- SELECT * FROM supabase_operation_logs WHERE success = false ORDER BY created_at DESC LIMIT 20;

-- Query 3: Get failed login attempts
-- SELECT * FROM login_attempt_logs WHERE success = false ORDER BY created_at DESC LIMIT 20;

-- Query 4: Get API call failures
-- SELECT * FROM api_call_logs WHERE response_status >= 400 ORDER BY created_at DESC LIMIT 20;

-- Query 5: Get errors by function
-- SELECT function_name, COUNT(*) as error_count, MAX(created_at) as latest_error 
-- FROM error_logs 
-- GROUP BY function_name 
-- ORDER BY error_count DESC;

-- Query 6: Get unresolved errors
-- SELECT * FROM error_logs WHERE is_resolved = false ORDER BY created_at DESC;

-- Query 7: Get today's error summary
-- SELECT 
--   DATE(created_at) as error_date,
--   error_type,
--   COUNT(*) as count,
--   COUNT(DISTINCT function_name) as affected_functions
-- FROM error_logs 
-- WHERE created_at >= NOW() - INTERVAL '1 day'
-- GROUP BY DATE(created_at), error_type
-- ORDER BY error_date DESC, count DESC;

-- ============================================================================
-- END OF LOGGING SCHEMA
-- ============================================================================
-- Test the logging tables by running:
-- INSERT INTO error_logs (error_type, error_message, error_stack, function_name)
-- VALUES ('TEST', 'Test error message', 'Test stack', 'test_function');
-- SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 1;
