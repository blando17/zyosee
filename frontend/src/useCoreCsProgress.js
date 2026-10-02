import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "./api";
import { DONE, NONE, REVISE } from "./corecs/schema";

/*
 * One person's Done and Revise lists for one subject.
 *
 * WHY THE UI NEVER WAITS FOR THE SERVER
 *
 * Marking a question Done is the most frequent action in this whole section —
 * somebody revising will press it a hundred times in half an hour, often with
 * the keyboard, moving to the next question immediately. If each press waited
 * on a round trip, the keyboard flow would stutter every single time, and on a
 * slow connection it would feel broken.
 *
 * So every mark applies to local state at once and the request goes out
 * behind it. The server is the record; the screen is a prediction of it that
 * is almost always right.
 *
 * WHAT HAPPENS WHEN THE PREDICTION IS WRONG
 *
 * A failed write rolls that one question back to the state it had before, and
 * raises an error the page can show. Not a full reload: re-fetching everything
 * would also undo any *other* marks made in the meantime, so a single failed
 * request would lose work the person did after it.
 *
 * WHY RESPONSES ARE NOT TRUSTED BLINDLY
 *
 * Each reply carries the whole authoritative list, and taking it would be the
 * obvious thing to do. It is wrong here: replies can arrive out of order, so a
 * slow reply to mark #1 can land after the fast reply to mark #5 and silently
 * undo it. Only the newest request in flight is allowed to overwrite state,
 * which `seq` below tracks.
 */

export default function useCoreCsProgress(subject = "os") {
  const [done, setDone] = useState(() => new Set());
  const [revise, setRevise] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Monotonic request counter. A reply whose number is not the latest one sent
  // is stale by definition and may not replace the authoritative lists.
  const seq = useRef(0);
  const latest = useRef(0);

  useEffect(() => {
    let live = true;
    setLoading(true);

    authApi
      .get(`/corecs/${subject}`)
      .then(({ data }) => {
        if (!live) return;
        setDone(new Set(data.done || []));
        setRevise(new Set(data.revise || []));
      })
      .catch(() => {
        // Progress that cannot be read is not a reason to hide the questions.
        // The section stays fully usable; only the marks are missing, and the
        // banner says so.
        if (live) setError("Could not load your progress. Marks may not save.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [subject]);

  /*
   * Moves one question to one state.
   *
   * The three states are exclusive here exactly as they are on the server:
   * every path removes the id from both sets before adding it to at most one,
   * so there is no sequence of clicks that leaves a question both Done and
   * queued for revision.
   */
  const mark = useCallback(
    (id, state) => {
      const before = {
        done: done.has(id),
        revise: revise.has(id),
      };

      setDone((prev) => {
        const next = new Set(prev);
        next.delete(id);
        if (state === DONE) next.add(id);
        return next;
      });
      setRevise((prev) => {
        const next = new Set(prev);
        next.delete(id);
        if (state === REVISE) next.add(id);
        return next;
      });

      seq.current += 1;
      const mine = seq.current;
      latest.current = mine;

      authApi
        .post(`/corecs/${subject}/mark`, { id, state })
        .then(() => {
          if (mine === latest.current) setError("");
        })
        .catch(() => {
          // Roll back this one question only. See the note above on why this
          // is not a re-fetch.
          setDone((prev) => {
            const next = new Set(prev);
            if (before.done) next.add(id);
            else next.delete(id);
            return next;
          });
          setRevise((prev) => {
            const next = new Set(prev);
            if (before.revise) next.add(id);
            else next.delete(id);
            return next;
          });
          setError("That did not save. Check your connection.");
        });
    },
    [subject, done, revise]
  );

  /*
   * Empties a whole list.
   *
   * Destructive, and the caller confirms first. Unlike `mark` this one does
   * wait for the server before clearing the screen — it is rare, deliberate,
   * and showing an empty queue that quietly refilled on the next page load
   * would be worse than a moment's delay.
   */
  const reset = useCallback(
    async (lists) => {
      try {
        const { data } = await authApi.post(`/corecs/${subject}/reset`, { lists });
        latest.current = seq.current;
        setDone(new Set(data.done || []));
        setRevise(new Set(data.revise || []));
        setError("");
        return true;
      } catch (err) {
        setError("Could not clear that.");
        return false;
      }
    },
    [subject]
  );

  const stateOf = useCallback(
    (id) => (done.has(id) ? DONE : revise.has(id) ? REVISE : NONE),
    [done, revise]
  );

  return useMemo(
    () => ({ done, revise, stateOf, mark, reset, loading, error }),
    [done, revise, stateOf, mark, reset, loading, error]
  );
}
