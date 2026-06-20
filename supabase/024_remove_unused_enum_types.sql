-- Remove enum types left behind by retired dashboard-created schemas.
-- The default RESTRICT behavior aborts if any live object still depends on them.

DROP TYPE IF EXISTS public.friendship_status;
DROP TYPE IF EXISTS public.location_pref;
DROP TYPE IF EXISTS public.time_pref;
