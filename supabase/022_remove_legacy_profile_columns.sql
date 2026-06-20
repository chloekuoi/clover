-- Remove dashboard-only profile columns after preserving useful legacy data.

DO $$
DECLARE
  v_has_location_data BOOLEAN;
  v_has_push_token_data BOOLEAN;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'one_liner'
  ) THEN
    EXECUTE $sql$
      UPDATE public.profiles
      SET tagline = one_liner
      WHERE tagline IS NULL
        AND NULLIF(BTRIM(one_liner), '') IS NOT NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'expo_push_token'
  ) THEN
    EXECUTE $sql$
      SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE NULLIF(BTRIM(expo_push_token), '') IS NOT NULL
      )
    $sql$
    INTO v_has_push_token_data;

    IF v_has_push_token_data AND to_regclass('public.push_tokens') IS NULL THEN
      RAISE EXCEPTION
        'Refusing to remove profiles.expo_push_token because public.push_tokens does not exist';
    END IF;

    IF v_has_push_token_data THEN
      EXECUTE $sql$
        INSERT INTO public.push_tokens (user_id, token, updated_at)
        SELECT id, BTRIM(expo_push_token), NOW()
        FROM public.profiles
        WHERE NULLIF(BTRIM(expo_push_token), '') IS NOT NULL
        ON CONFLICT (user_id) DO NOTHING
      $sql$;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'location'
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.profiles WHERE location IS NOT NULL)'
    INTO v_has_location_data;

    IF v_has_location_data THEN
      RAISE EXCEPTION
        'Refusing to remove profiles.location because it contains data';
    END IF;
  END IF;

  ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS one_liner,
    DROP COLUMN IF EXISTS expo_push_token,
    DROP COLUMN IF EXISTS location;
END;
$$;
