-- Remove abandoned dashboard-created prototypes that are not used by the app.
-- Refuse to remove any table that has gained data since the production audit.

DO $$
DECLARE
  v_has_rows BOOLEAN;
BEGIN
  IF to_regclass('public.intents') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.intents)' INTO v_has_rows;
    IF v_has_rows THEN
      RAISE EXCEPTION 'Refusing to drop public.intents because it contains data';
    END IF;
  END IF;

  IF to_regclass('public.invites') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.invites)' INTO v_has_rows;
    IF v_has_rows THEN
      RAISE EXCEPTION 'Refusing to drop public.invites because it contains data';
    END IF;
  END IF;

  IF to_regclass('public.cowork_sessions') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.cowork_sessions)' INTO v_has_rows;
    IF v_has_rows THEN
      RAISE EXCEPTION 'Refusing to drop public.cowork_sessions because it contains data';
    END IF;
  END IF;

  DROP TABLE IF EXISTS public.intents;
  DROP TABLE IF EXISTS public.invites;
  DROP TABLE IF EXISTS public.cowork_sessions;
END;
$$;
