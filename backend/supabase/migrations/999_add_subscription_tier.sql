-- Add subscription_tier column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT NULL;
