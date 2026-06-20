-- A-03: Friendship writes are handled by SECURITY DEFINER RPCs.
-- Remove dashboard-created policies that permit direct client mutations.
DROP POLICY IF EXISTS "Users can manage friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can see own friendships" ON public.friendships;
