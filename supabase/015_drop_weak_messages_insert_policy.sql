-- A-02: Remove the permissive message INSERT policy that does not verify
-- membership in the referenced match.
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
