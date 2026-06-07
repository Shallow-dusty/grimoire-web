-- ============================================================
-- v2026-05-17: Secure all SECURITY DEFINER RPCs
-- ============================================================
-- Goals:
-- 1) claim_seat / leave_seat: enforce auth.uid() = caller (prev. accepted any
--    p_user_id text, allowing impersonation of other players' seats).
-- 2) v2.0 immersive RPCs (log_interaction, check_nomination_eligibility,
--    record_nomination, update_nomination_result, get_game_interactions):
--    add SET search_path = public + room membership / storyteller checks.
-- 3) Restore is_storyteller_of_room helper usage for room_members policies to
--    avoid RLS recursion that 20260207_optimize_*.sql re-introduced.
-- 4) game_rooms_delete_storyteller: add service_role bypass for consistency.

-- ============================================================
-- 1. claim_seat — require auth.uid()::text = p_user_id
-- ============================================================

CREATE OR REPLACE FUNCTION claim_seat(
  p_room_code text,
  p_seat_id int,
  p_user_id text,
  p_player_name text,
  p_client_token text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_data jsonb;
  v_seats jsonb;
  v_target_seat jsonb;
  v_existing_seat jsonb;
  v_seat_index int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF auth.uid()::text <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'User mismatch');
  END IF;

  SELECT data INTO v_room_data
    FROM game_rooms
    WHERE room_code = p_room_code
    FOR UPDATE;

  IF v_room_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  v_seats := v_room_data->'seats';
  IF v_seats IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No seats in room');
  END IF;

  FOR v_seat_index IN 0..jsonb_array_length(v_seats) - 1 LOOP
    v_existing_seat := v_seats->v_seat_index;
    IF v_existing_seat->>'userId' = p_user_id AND v_seat_index <> p_seat_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'You already have seat ' || (v_seat_index + 1));
    END IF;
  END LOOP;

  v_target_seat := v_seats->p_seat_id;

  IF v_target_seat IS NOT NULL
     AND v_target_seat->>'userId' IS NOT NULL
     AND v_target_seat->>'userId' <> ''
     AND v_target_seat->>'userId' <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat already taken', 'currentPlayer', v_target_seat->>'userName');
  END IF;

  v_seats := jsonb_set(
    v_seats,
    array[p_seat_id::text],
    (v_target_seat || jsonb_build_object(
      'id', p_seat_id,
      'userId', p_user_id,
      'userName', p_player_name,
      'isVirtual', false,
      'clientToken', p_client_token
    ))
  );

  UPDATE game_rooms
    SET data = jsonb_set(v_room_data, '{seats}', v_seats),
        updated_at = now()
    WHERE room_code = p_room_code;

  RETURN jsonb_build_object('success', true, 'seat', v_seats->p_seat_id);
END;
$$;

-- ============================================================
-- 2. leave_seat — require auth.uid() owns the seat (not just client_token)
-- ============================================================

CREATE OR REPLACE FUNCTION leave_seat(
  p_room_code text,
  p_seat_id int,
  p_client_token text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_data jsonb;
  v_seats jsonb;
  v_target_seat jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT data INTO v_room_data
    FROM game_rooms
    WHERE room_code = p_room_code
    FOR UPDATE;

  IF v_room_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  v_seats := v_room_data->'seats';
  v_target_seat := v_seats->p_seat_id;

  IF v_target_seat->>'userId' <> auth.uid()::text THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your seat');
  END IF;

  IF v_target_seat->>'clientToken' <> p_client_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token mismatch');
  END IF;

  v_seats := jsonb_set(
    v_seats,
    array[p_seat_id::text],
    (v_target_seat || jsonb_build_object(
      'id', p_seat_id,
      'userId', null,
      'userName', '',
      'isVirtual', false
    )) - 'clientToken'
  );

  UPDATE game_rooms
    SET data = jsonb_set(v_room_data, '{seats}', v_seats),
        updated_at = now()
    WHERE room_code = p_room_code;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 3. v2.0 immersive RPCs — add search_path + auth + room membership checks
-- ============================================================

-- log_interaction: caller must be storyteller of p_room_id
CREATE OR REPLACE FUNCTION log_interaction(
  p_room_id bigint,
  p_game_day integer,
  p_phase text,
  p_actor_seat integer DEFAULT NULL,
  p_actor_role text DEFAULT NULL,
  p_actor_team text DEFAULT NULL,
  p_target_seat integer DEFAULT NULL,
  p_target_role text DEFAULT NULL,
  p_action_type text DEFAULT 'NIGHT_ACTION',
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_result text DEFAULT 'SUCCESS',
  p_result_details text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM game_rooms gr
    WHERE gr.id = p_room_id
      AND gr.storyteller_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only storyteller can log interactions';
  END IF;

  INSERT INTO interaction_logs (
    room_id, game_day, phase,
    actor_seat, actor_role, actor_team,
    target_seat, target_role,
    action_type, payload, result, result_details
  ) VALUES (
    p_room_id, p_game_day, p_phase,
    p_actor_seat, p_actor_role, p_actor_team,
    p_target_seat, p_target_role,
    p_action_type, p_payload, p_result, p_result_details
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- check_nomination_eligibility: caller must be a room member
CREATE OR REPLACE FUNCTION check_nomination_eligibility(
  p_room_id bigint,
  p_game_day integer,
  p_nominator_seat integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_nomination RECORD;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = p_room_id
      AND rm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a room member';
  END IF;

  SELECT * INTO v_existing_nomination
    FROM daily_nominations
    WHERE room_id = p_room_id
      AND game_day = p_game_day
      AND nominator_seat = p_nominator_seat;

  IF v_existing_nomination IS NOT NULL THEN
    v_result := jsonb_build_object(
      'canNominate', false,
      'reason', 'ALREADY_NOMINATED',
      'previousNominee', v_existing_nomination.nominee_seat
    );
  ELSE
    v_result := jsonb_build_object(
      'canNominate', true,
      'reason', NULL,
      'previousNominee', NULL
    );
  END IF;

  RETURN v_result;
END;
$$;

-- record_nomination: caller must own p_nominator_seat (or be storyteller)
CREATE OR REPLACE FUNCTION record_nomination(
  p_room_id bigint,
  p_game_day integer,
  p_nominator_seat integer,
  p_nominee_seat integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nomination_id uuid;
  v_eligibility jsonb;
  v_is_storyteller boolean;
  v_owns_seat boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM game_rooms gr
    WHERE gr.id = p_room_id AND gr.storyteller_id = auth.uid()
  ) INTO v_is_storyteller;

  SELECT EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = p_room_id
      AND rm.user_id = auth.uid()
      AND rm.seat_id = p_nominator_seat
  ) INTO v_owns_seat;

  IF NOT v_is_storyteller AND NOT v_owns_seat THEN
    RAISE EXCEPTION 'Cannot nominate from a seat you do not own';
  END IF;

  v_eligibility := check_nomination_eligibility(p_room_id, p_game_day, p_nominator_seat);
  IF NOT (v_eligibility->>'canNominate')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', v_eligibility->>'reason',
      'nominationId', NULL
    );
  END IF;

  INSERT INTO daily_nominations (
    room_id, game_day, nominator_seat, nominee_seat
  ) VALUES (
    p_room_id, p_game_day, p_nominator_seat, p_nominee_seat
  )
  RETURNING id INTO v_nomination_id;

  PERFORM log_interaction(
    p_room_id := p_room_id,
    p_game_day := p_game_day,
    p_phase := 'DAY',
    p_actor_seat := p_nominator_seat,
    p_target_seat := p_nominee_seat,
    p_action_type := 'NOMINATION',
    p_result := 'SUCCESS'
  );

  RETURN jsonb_build_object(
    'success', true,
    'error', NULL,
    'nominationId', v_nomination_id
  );
END;
$$;

-- update_nomination_result: storyteller only
CREATE OR REPLACE FUNCTION update_nomination_result(
  p_room_id bigint,
  p_game_day integer,
  p_nominee_seat integer,
  p_was_seconded boolean,
  p_vote_count integer,
  p_was_executed boolean
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM game_rooms gr
    WHERE gr.id = p_room_id AND gr.storyteller_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only storyteller can update nomination result';
  END IF;

  UPDATE daily_nominations
    SET was_seconded = p_was_seconded,
        vote_count = p_vote_count,
        was_executed = p_was_executed
    WHERE room_id = p_room_id
      AND game_day = p_game_day
      AND nominee_seat = p_nominee_seat;

  RETURN FOUND;
END;
$$;

-- get_game_interactions: caller must be a room member
CREATE OR REPLACE FUNCTION get_game_interactions(
  p_room_id bigint,
  p_game_day integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = p_room_id
      AND rm.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM game_rooms gr
    WHERE gr.id = p_room_id
      AND gr.storyteller_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a room member';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'gameDay', game_day,
      'phase', phase,
      'actorSeat', actor_seat,
      'actorRole', actor_role,
      'actorTeam', actor_team,
      'targetSeat', target_seat,
      'targetRole', target_role,
      'actionType', action_type,
      'payload', payload,
      'result', result,
      'resultDetails', result_details,
      'createdAt', created_at
    ) ORDER BY game_day,
      CASE phase
        WHEN 'DAWN' THEN 1
        WHEN 'DAY' THEN 2
        WHEN 'DUSK' THEN 3
        WHEN 'NIGHT' THEN 4
      END,
      created_at
  )
  INTO v_result
  FROM interaction_logs
  WHERE room_id = p_room_id
    AND (p_game_day IS NULL OR game_day = p_game_day);

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============================================================
-- 4. Restore is_storyteller_of_room helper for room_members policies
--    (to avoid RLS recursion between room_members ↔ game_rooms)
-- ============================================================

DROP POLICY IF EXISTS "room_members_select" ON room_members;
DROP POLICY IF EXISTS "room_members_insert" ON room_members;
DROP POLICY IF EXISTS "room_members_update" ON room_members;
DROP POLICY IF EXISTS "room_members_delete" ON room_members;

CREATE POLICY "room_members_select"
  ON room_members FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    public.is_storyteller_of_room(room_members.room_id)
  );

CREATE POLICY "room_members_insert"
  ON room_members FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    (
      (select auth.uid()) = user_id AND (
        (
          role IN ('player', 'observer') AND
          seat_id IS NULL AND
          seen_role_id IS NULL
        ) OR (
          role = 'storyteller' AND
          public.is_storyteller_of_room(room_members.room_id)
        )
      )
    )
  );

CREATE POLICY "room_members_update"
  ON room_members FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    public.is_storyteller_of_room(room_members.room_id)
  )
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    public.is_storyteller_of_room(room_members.room_id) OR
    (
      (select auth.uid()) = user_id AND
      role IN ('player', 'observer') AND
      EXISTS (
        SELECT 1
        FROM room_members rm
        WHERE rm.id = room_members.id
          AND rm.role IS NOT DISTINCT FROM room_members.role
          AND rm.seat_id IS NOT DISTINCT FROM room_members.seat_id
          AND rm.seen_role_id IS NOT DISTINCT FROM room_members.seen_role_id
      )
    )
  );

CREATE POLICY "room_members_delete"
  ON room_members FOR DELETE
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    public.is_storyteller_of_room(room_members.room_id)
  );

-- ============================================================
-- 5. game_rooms DELETE policy — add service_role bypass for consistency
-- ============================================================

DROP POLICY IF EXISTS "game_rooms_delete_storyteller" ON game_rooms;
CREATE POLICY "game_rooms_delete_storyteller"
  ON game_rooms FOR DELETE
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = storyteller_id
  );
