-- Remove redundant unique constraints only after proving the canonical
-- uniqueness enforcement remains in place.

DO $$
DECLARE
  v_canonical_oid OID;
  v_duplicate_oid OID;
  v_constraint_name TEXT;
  v_indexes_match BOOLEAN;
  v_first_expression TEXT;
  v_second_expression TEXT;
BEGIN
  v_canonical_oid := to_regclass('public.matches_user_1_id_user_2_id_key');
  v_duplicate_oid := to_regclass('public.matches_user_pair_unique');

  IF v_canonical_oid IS NOT NULL AND v_duplicate_oid IS NOT NULL THEN
    SELECT
      canonical.indisunique
      AND duplicate.indisunique
      AND canonical.indkey = duplicate.indkey
      AND canonical.indclass = duplicate.indclass
      AND canonical.indcollation = duplicate.indcollation
      AND canonical.indoption = duplicate.indoption
      AND pg_get_expr(canonical.indexprs, canonical.indrelid)
        IS NOT DISTINCT FROM pg_get_expr(duplicate.indexprs, duplicate.indrelid)
      AND pg_get_expr(canonical.indpred, canonical.indrelid)
        IS NOT DISTINCT FROM pg_get_expr(duplicate.indpred, duplicate.indrelid)
    INTO v_indexes_match
    FROM pg_index AS canonical
    JOIN pg_index AS duplicate ON duplicate.indexrelid = v_duplicate_oid
    WHERE canonical.indexrelid = v_canonical_oid;

    IF v_indexes_match IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION
        'Refusing to remove matches_user_pair_unique because its definition differs from matches_user_1_id_user_2_id_key';
    END IF;

    SELECT constraint_record.conname
    INTO v_constraint_name
    FROM pg_constraint AS constraint_record
    WHERE constraint_record.conindid = v_duplicate_oid;

    IF v_constraint_name IS NULL THEN
      DROP INDEX public.matches_user_pair_unique;
    ELSE
      EXECUTE format(
        'ALTER TABLE public.matches DROP CONSTRAINT %I',
        v_constraint_name
      );
    END IF;
  END IF;

  v_canonical_oid := to_regclass('public.idx_friendships_pair_unique');
  v_duplicate_oid := to_regclass('public.friendships_user_id_friend_id_key');
  v_constraint_name := NULL;

  IF v_canonical_oid IS NOT NULL AND v_duplicate_oid IS NOT NULL THEN
    SELECT
      pg_get_indexdef(canonical.indexrelid, 1, TRUE),
      pg_get_indexdef(canonical.indexrelid, 2, TRUE)
    INTO v_first_expression, v_second_expression
    FROM pg_index AS canonical
    WHERE canonical.indexrelid = v_canonical_oid
      AND canonical.indisunique
      AND canonical.indnkeyatts = 2
      AND canonical.indpred IS NULL;

    IF LOWER(REGEXP_REPLACE(v_first_expression, '\s+', '', 'g'))
        IS DISTINCT FROM 'least(requester_id,recipient_id)'
      OR LOWER(REGEXP_REPLACE(v_second_expression, '\s+', '', 'g'))
        IS DISTINCT FROM 'greatest(requester_id,recipient_id)'
    THEN
      RAISE EXCEPTION
        'Refusing to remove friendships_user_id_friend_id_key because idx_friendships_pair_unique does not enforce unordered-pair uniqueness';
    END IF;

    SELECT constraint_record.conname
    INTO v_constraint_name
    FROM pg_constraint AS constraint_record
    WHERE constraint_record.conindid = v_duplicate_oid
      AND constraint_record.contype = 'u'
      AND pg_get_constraintdef(constraint_record.oid) = 'UNIQUE (requester_id, recipient_id)';

    IF v_constraint_name IS NULL THEN
      RAISE EXCEPTION
        'Refusing to remove friendships_user_id_friend_id_key because it is not the expected ordered-pair unique constraint';
    END IF;

    EXECUTE format(
      'ALTER TABLE public.friendships DROP CONSTRAINT %I',
      v_constraint_name
    );
  END IF;
END;
$$;
