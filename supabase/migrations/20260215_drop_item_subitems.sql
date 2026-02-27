-- Migration: Drop item_subitems table
-- Date: 2026-02-15
-- Description: Removes the item_subitems table and related RLS policies
-- Reason: Subitems feature removed - not necessary for basic shopping list

-- Drop the table (CASCADE removes dependent objects like indexes, policies, triggers)
DROP TABLE IF EXISTS item_subitems CASCADE;
