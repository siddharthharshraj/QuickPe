-- Rollback Migration: Remove QuickPe ID, legacy email, and audit logs
-- Version: 001_rollback
-- Date: 2025-01-12

BEGIN;

-- Remove meta column from transactions
ALTER TABLE transactions DROP COLUMN IF EXISTS meta;

-- Drop audit_logs table and indexes
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_action_type;
DROP INDEX IF EXISTS idx_audit_logs_actor;
DROP TABLE IF EXISTS audit_logs;

-- Remove quickpe_id and legacy_email columns from users
DROP INDEX IF EXISTS idx_users_quickpe_id;
ALTER TABLE users DROP COLUMN IF EXISTS legacy_email;
ALTER TABLE users DROP COLUMN IF EXISTS quickpe_id;

COMMIT;
