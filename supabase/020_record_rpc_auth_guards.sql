-- Record the live RPC authentication guards in version-controlled SQL.

CREATE OR REPLACE FUNCTION public.assert_authenticated_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_chat_read(
  p_match_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  PERFORM public.assert_authenticated_user(p_user_id);

  UPDATE public.matches
  SET
    user1_last_read_at = CASE
      WHEN user1_id = p_user_id THEN NOW()
      ELSE user1_last_read_at
    END,
    user2_last_read_at = CASE
      WHEN user2_id = p_user_id THEN NOW()
      ELSE user2_last_read_at
    END
  WHERE id = p_match_id
    AND status = 'active'
    AND (user1_id = p_user_id OR user2_id = p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.fetch_match_previews(p_user_id UUID)
RETURNS TABLE (
  match_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_photo_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  PERFORM public.assert_authenticated_user(p_user_id);

  RETURN QUERY
  WITH matches_for_user AS (
    SELECT
      m.*,
      CASE
        WHEN m.user1_id = p_user_id THEN m.user2_id
        ELSE m.user1_id
      END AS other_user_id,
      CASE
        WHEN m.user1_id = p_user_id THEN m.user1_last_read_at
        ELSE m.user2_last_read_at
      END AS last_read_at
    FROM public.matches AS m
    WHERE (m.user1_id = p_user_id OR m.user2_id = p_user_id)
      AND m.status = 'active'
  ),
  last_messages AS (
    SELECT
      mf.id AS match_id,
      lm.content,
      lm.created_at
    FROM matches_for_user AS mf
    LEFT JOIN LATERAL (
      SELECT msg.content, msg.created_at
      FROM public.messages AS msg
      WHERE msg.match_id = mf.id
      ORDER BY msg.created_at DESC
      LIMIT 1
    ) AS lm ON TRUE
  ),
  unread_counts AS (
    SELECT
      mf.id AS match_id,
      COUNT(*)::INTEGER AS unread_count
    FROM matches_for_user AS mf
    JOIN public.messages AS msg ON msg.match_id = mf.id
    WHERE msg.sender_id <> p_user_id
      AND msg.created_at > mf.last_read_at
    GROUP BY mf.id
  ),
  declined_counts AS (
    SELECT
      mf.id AS match_id,
      COUNT(*)::INTEGER AS declined_count
    FROM matches_for_user AS mf
    JOIN public.sessions AS s ON s.match_id = mf.id
    WHERE s.status = 'declined'
      AND s.initiated_by = p_user_id
      AND s.updated_at > mf.last_read_at
    GROUP BY mf.id
  )
  SELECT
    mf.id AS match_id,
    mf.other_user_id,
    p.name AS other_user_name,
    p.photo_url AS other_user_photo_url,
    lm.content AS last_message,
    COALESCE(lm.created_at, mf.matched_at) AS last_message_at,
    COALESCE(uc.unread_count, 0) + COALESCE(dc.declined_count, 0) AS unread_count
  FROM matches_for_user AS mf
  JOIN public.profiles AS p ON p.id = mf.other_user_id
  LEFT JOIN last_messages AS lm ON lm.match_id = mf.id
  LEFT JOIN unread_counts AS uc ON uc.match_id = mf.id
  LEFT JOIN declined_counts AS dc ON dc.match_id = mf.id
  ORDER BY COALESCE(lm.created_at, mf.matched_at) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  PERFORM public.assert_authenticated_user(p_user_id);

  SELECT COALESCE(SUM(preview.unread_count), 0)::INTEGER
  INTO v_count
  FROM public.fetch_match_previews(p_user_id) AS preview;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_friend_request(
  p_friendship_id UUID,
  p_user_id UUID,
  p_response TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_requester_id UUID;
  v_recipient_id UUID;
  v_status TEXT;
BEGIN
  PERFORM public.assert_authenticated_user(p_user_id);

  IF p_response NOT IN ('accept', 'decline') THEN
    RAISE EXCEPTION 'Invalid response';
  END IF;

  SELECT f.requester_id, f.recipient_id, f.status
  INTO v_requester_id, v_recipient_id, v_status
  FROM public.friendships AS f
  WHERE f.id = p_friendship_id;

  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Friendship not found';
  END IF;

  IF p_user_id <> v_recipient_id THEN
    RAISE EXCEPTION 'Only recipient can respond to friend request';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Friend request is not pending';
  END IF;

  IF p_response = 'accept' THEN
    UPDATE public.friendships
    SET status = 'accepted', updated_at = NOW()
    WHERE id = p_friendship_id;

    PERFORM public.create_match(v_requester_id, v_recipient_id);
  ELSE
    UPDATE public.friendships
    SET status = 'declined', updated_at = NOW()
    WHERE id = p_friendship_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_authenticated_user(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fetch_match_previews(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_unread_count(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_chat_read(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_friend_request(UUID, UUID, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.assert_authenticated_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_match_previews(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_chat_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_friend_request(UUID, UUID, TEXT) TO authenticated;
