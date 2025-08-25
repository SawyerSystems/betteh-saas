-- Migration to create parent password reset tokens table
CREATE TABLE IF NOT EXISTS public.parent_password_reset_tokens (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_parent_password_reset_tokens_parent_id ON public.parent_password_reset_tokens(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_password_reset_tokens_token ON public.parent_password_reset_tokens(token);
