-- A-04: Align the live friendship status column with the application contract.
DO $$
DECLARE
  v_unexpected_statuses TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT status::TEXT ORDER BY status::TEXT)
  INTO v_unexpected_statuses
  FROM public.friendships
  WHERE status::TEXT NOT IN ('pending', 'accepted', 'declined', 'active');

  IF v_unexpected_statuses IS NOT NULL THEN
    RAISE EXCEPTION
      'Unexpected friendship statuses must be resolved before migration: %',
      v_unexpected_statuses;
  END IF;

  ALTER TABLE public.friendships
    ALTER COLUMN status DROP DEFAULT;

  ALTER TABLE public.friendships
    ALTER COLUMN status TYPE TEXT
    USING (
      CASE status::TEXT
        WHEN 'active' THEN 'accepted'
        ELSE status::TEXT
      END
    );

  ALTER TABLE public.friendships
    ALTER COLUMN status SET DEFAULT 'pending';

  ALTER TABLE public.friendships
    DROP CONSTRAINT IF EXISTS friendships_status_check;

  ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_status_check
    CHECK (status IN ('pending', 'accepted', 'declined'));
END
$$;
