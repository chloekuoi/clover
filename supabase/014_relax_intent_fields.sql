-- 014_relax_intent_fields.sql
-- The Focus tab was simplified to three inputs (task, location, availability).
-- The form no longer sends work_style or location_type, so relax their NOT NULL
-- constraints. Existing rows are left untouched; new intents simply omit them.

ALTER TABLE work_intents ALTER COLUMN work_style DROP NOT NULL;
ALTER TABLE work_intents ALTER COLUMN location_type DROP NOT NULL;
