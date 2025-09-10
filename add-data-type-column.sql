-- Supabase migration: Add data_type column to items table
ALTER TABLE public.items ADD COLUMN data_type TEXT;

-- Add some sample data_type values to existing items
-- You can customize these based on your actual item names/categories
UPDATE public.items SET data_type = 'financial' WHERE name ILIKE '%financial%' OR name ILIKE '%revenue%' OR name ILIKE '%cost%' OR name ILIKE '%budget%';
UPDATE public.items SET data_type = 'survey' WHERE name ILIKE '%survey%' OR name ILIKE '%feedback%' OR name ILIKE '%customer%' OR name ILIKE '%satisfaction%';
UPDATE public.items SET data_type = 'operational' WHERE name ILIKE '%operational%' OR name ILIKE '%process%' OR name ILIKE '%efficiency%' OR name ILIKE '%performance%';
UPDATE public.items SET data_type = 'market' WHERE name ILIKE '%market%' OR name ILIKE '%competitor%' OR name ILIKE '%industry%' OR name ILIKE '%trend%';
UPDATE public.items SET data_type = 'regulatory' WHERE name ILIKE '%regulatory%' OR name ILIKE '%compliance%' OR name ILIKE '%legal%' OR name ILIKE '%audit%';

-- Set default data_type for items that don't match any pattern
UPDATE public.items SET data_type = 'other' WHERE data_type IS NULL;
