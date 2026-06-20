-- Friendships are refreshed on screen focus and have no Realtime subscriber.
-- Keep session and messaging tables published because the app subscribes to them.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'friendships'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.friendships';
  END IF;
END;
$$;
