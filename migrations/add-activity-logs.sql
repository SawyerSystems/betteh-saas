-- Create activity_logs table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    
    -- Who performed the action
    actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'parent', 'system')),
    actor_id INTEGER,
    actor_name TEXT NOT NULL,
    
    -- What was the action
    action_type TEXT NOT NULL,
    action_category TEXT NOT NULL,
    action_description TEXT NOT NULL,
    
    -- What was affected
    target_type TEXT NOT NULL,
    target_id INTEGER,
    target_identifier TEXT,
    
    -- Change details
    field_changed TEXT,
    previous_value TEXT,
    new_value TEXT,
    
    -- Additional context
    notes TEXT,
    metadata JSONB,
    
    -- Technical details
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Soft delete and undo functionality
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by INTEGER,
    
    -- Undo/reversal tracking
    is_reversed BOOLEAN DEFAULT FALSE NOT NULL,
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversed_by INTEGER,
    reverse_action_id INTEGER,
    original_action_id INTEGER,
    
    -- Grouping for bulk operations
    batch_id TEXT,
    batch_description TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target ON activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action_category, action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_batch ON activity_logs(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_active ON activity_logs(created_at DESC) WHERE is_deleted = FALSE;

-- Add foreign key constraints (if the referenced tables exist)
DO $$
BEGIN
    -- Only add constraints if the referenced tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_deleted_by 
            FOREIGN KEY (deleted_by) REFERENCES admins(id) ON DELETE SET NULL;
        ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_reversed_by 
            FOREIGN KEY (reversed_by) REFERENCES admins(id) ON DELETE SET NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_reverse_action 
            FOREIGN KEY (reverse_action_id) REFERENCES activity_logs(id) ON DELETE SET NULL;
        ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_original_action 
            FOREIGN KEY (original_action_id) REFERENCES activity_logs(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if constraints already exist or tables don't exist
    NULL;
END $$;

-- Add comments for documentation
COMMENT ON TABLE activity_logs IS 'Comprehensive audit log for all system activities and changes';
COMMENT ON COLUMN activity_logs.actor_type IS 'Type of actor: admin, parent, or system';
COMMENT ON COLUMN activity_logs.action_type IS 'Specific action performed (created, updated, deleted, etc.)';
COMMENT ON COLUMN activity_logs.action_category IS 'Category of action (booking, payment, waiver, etc.)';
COMMENT ON COLUMN activity_logs.target_type IS 'Type of entity being acted upon';
COMMENT ON COLUMN activity_logs.target_identifier IS 'Human-readable identifier for the target';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional context data in JSON format';
COMMENT ON COLUMN activity_logs.batch_id IS 'UUID for grouping related bulk operations';
COMMENT ON COLUMN activity_logs.is_reversed IS 'True if this action has been undone/reversed';
COMMENT ON COLUMN activity_logs.reverse_action_id IS 'ID of the activity log entry that reversed this action';
