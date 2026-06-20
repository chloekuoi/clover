-- A-05: Prevent callers from assigning an invite claim to another user.
-- The invites table is dashboard-created, so tolerate environments where it
-- has not been created.
DO $$
BEGIN
  IF to_regclass('public.invites') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'invites'
        AND policyname = 'Anyone can claim invite'
    )
  THEN
    ALTER POLICY "Anyone can claim invite" ON public.invites
      USING (claimed_by_user_id IS NULL)
      WITH CHECK (claimed_by_user_id = auth.uid());
  END IF;
END
$$;
