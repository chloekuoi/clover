-- Phase 9: Delete Account RPC
-- Cascade-deletes all data owned by the calling user, then removes the auth.users row.
-- Deletion is fully transactional: any error rolls back the entire operation.
--
-- HOW TO RUN MANUALLY (Supabase SQL Editor):
--   1. Open the Supabase Dashboard → SQL Editor.
--   2. Paste and run this entire file once to register the function.
--   3. To test-call it as a specific user you must impersonate via service-role or
--      call it from the client SDK:
--        const { error } = await supabase.rpc('delete_account');
--   NOTE: The function uses auth.uid() internally — it always acts on the
--         currently-authenticated user. There are no parameters.

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Group session RSVPs for this user
  DELETE FROM public.group_session_rsvps
  WHERE user_id = v_uid;

  -- 2. Group messages sent by this user in groups they did not create
  DELETE FROM public.group_messages
  WHERE sender_id = v_uid;

  -- 3. Delete groups this user created (cascades to all group data including other members' records)
  DELETE FROM public.group_chats
  WHERE created_by = v_uid;

  -- 4. Remove user from groups they joined but did not create
  DELETE FROM public.group_members
  WHERE user_id = v_uid;

  -- 5. Profile photos
  DELETE FROM public.profile_photos
  WHERE user_id = v_uid;

  -- 6. Work intents
  DELETE FROM public.work_intents
  WHERE user_id = v_uid;

  -- 7. Swipes (as swiper or swiped)
  DELETE FROM public.swipes
  WHERE swiper_id = v_uid
     OR swiped_id = v_uid;

  -- 8. Messages sent by the user
  --    (Partner messages in the same match are cascade-deleted when matches are removed in step 10)
  DELETE FROM public.messages
  WHERE sender_id = v_uid;

  -- 9. Session participant rows for this user
  DELETE FROM public.session_participants
  WHERE user_id = v_uid;
  -- Note: session_events cascade from sessions (ON DELETE CASCADE)

  -- 10. Orphaned sessions initiated by this user that now have no participants
  --     (sessions whose other participant rows were just removed above)
  DELETE FROM public.sessions
  WHERE initiated_by = v_uid
    AND NOT EXISTS (
      SELECT 1
      FROM public.session_participants sp
      WHERE sp.session_id = sessions.id
    );

  -- 11. Matches where the user is user1 or user2
  --     (cascades remaining messages / sessions via ON DELETE CASCADE)
  DELETE FROM public.matches
  WHERE user1_id = v_uid
     OR user2_id = v_uid;

  -- 12. Friendships where the user is requester or recipient
  DELETE FROM public.friendships
  WHERE requester_id = v_uid
     OR recipient_id = v_uid;

  -- 13. Uploaded photos in the 'avatars' storage bucket are removed by the
  --     client via the Storage API BEFORE this function is called. Supabase
  --     blocks direct DELETE on storage.objects from SQL, so it is not done here.

  -- 14. Profile row (ON DELETE CASCADE from auth.users also does this, but
  --     deleting explicitly keeps the ordering clean)
  DELETE FROM public.profiles
  WHERE id = v_uid;

  -- 15. Auth user — this must be last; once deleted auth.uid() is gone
  DELETE FROM auth.users
  WHERE id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_account() FROM anon;
