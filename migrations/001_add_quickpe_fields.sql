-- Migration: Add QuickPe ID, legacy email, and audit logs
-- Version: 001
-- Date: 2025-01-12

BEGIN;

-- Add quickpe_id and legacy_email columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS quickpe_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_email TEXT;

-- Create index on quickpe_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_quickpe_id ON users(quickpe_id);

-- Create audit_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    payload JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add meta column to transactions for QuickPe transfer tracking
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- Create index on meta for QuickPe transfers
CREATE INDEX IF NOT EXISTS idx_transactions_meta ON transactions USING GIN(meta);

COMMIT;
