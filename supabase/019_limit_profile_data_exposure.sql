-- A-07: Expose only public profile fields to other authenticated users.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  name,
  username,
  photo_url,
  work_type,
  desired_roles,
  interests,
  tagline,
  currently_working_on,
  work,
  school,
  neighborhood,
  city,
  onboarding_complete,
  created_at,
  updated_at,
  CASE
    WHEN birthday IS NULL THEN NULL
    ELSE EXTRACT(YEAR FROM age(CURRENT_DATE, birthday))::INTEGER
  END AS age
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id,
  name,
  username,
  photo_url,
  work_type,
  desired_roles,
  interests,
  tagline,
  currently_working_on,
  work,
  school,
  neighborhood,
  city,
  onboarding_complete,
  created_at,
  updated_at
) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_profile JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id = auth.uid() THEN
    SELECT to_jsonb(p)
    INTO v_profile
    FROM public.profiles p
    WHERE p.id = p_user_id;
  ELSE
    SELECT to_jsonb(p)
    INTO v_profile
    FROM public.public_profiles p
    WHERE p.id = p_user_id;
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_public_profiles(p_query TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  name TEXT,
  photo_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT p.id, p.username, p.name, p.photo_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND char_length(btrim(p_query)) >= 3
    AND (
      p.username ILIKE '%' || btrim(p_query) || '%'
      OR p.name ILIKE '%' || btrim(p_query) || '%'
      OR p.email ILIKE '%' || btrim(p_query) || '%'
      OR p.phone_number ILIKE '%' || btrim(p_query) || '%'
    )
  ORDER BY p.username
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.search_public_profiles(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(TEXT) TO authenticated;
