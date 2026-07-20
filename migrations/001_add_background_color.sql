-- Additive migration: adds a background_color column to babies.
-- Safe to run on an existing database — does NOT touch existing rows'
-- data, just adds a new nullable column (existing babies get NULL,
-- app falls back to the default color in that case).

alter table babies add column if not exists background_color text;
