-- Migration: Add Channex Integration Columns
-- Description: Adds Channex-specific columns to channel_settings and channel_mappings tables
-- Date: 2026-01-16

-- Add Channex columns to channel_settings table
ALTER TABLE channel_settings
ADD COLUMN IF NOT EXISTS channex_property_id TEXT,
ADD COLUMN IF NOT EXISTS channex_channel_id TEXT,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;

-- Add Channex columns to channel_mappings table
ALTER TABLE channel_mappings
ADD COLUMN IF NOT EXISTS channex_room_type_id TEXT,
ADD COLUMN IF NOT EXISTS channex_rate_plan_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_channel_settings_channex_property 
ON channel_settings(channex_property_id);

CREATE INDEX IF NOT EXISTS idx_channel_mappings_channex_room_type 
ON channel_mappings(channex_room_type_id);

-- Add comments for documentation
COMMENT ON COLUMN channel_settings.channex_property_id IS 'Channex property ID after sync';
COMMENT ON COLUMN channel_settings.channex_channel_id IS 'Channex channel connection ID';
COMMENT ON COLUMN channel_settings.last_sync IS 'Timestamp of last successful sync with Channex';
COMMENT ON COLUMN channel_mappings.channex_room_type_id IS 'Channex room type ID for mapping';
COMMENT ON COLUMN channel_mappings.channex_rate_plan_id IS 'Channex rate plan ID for this mapping';
