-- Add evidence_items column to decisions table
ALTER TABLE public.decisions ADD COLUMN evidence_items JSONB DEFAULT '[]'::jsonb;
