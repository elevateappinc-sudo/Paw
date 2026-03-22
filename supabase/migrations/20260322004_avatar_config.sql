-- F-AVATAR: Add avatar_config column to pets
-- Sprint: paw-2026-W12
-- Agent: developer

ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.pets.avatar_config IS 'DiceBear avatar config: { "style": "adventurer|fun-emoji|lorelei|bottts|adventurer-neutral", "seed": "<seed_string>" }';
