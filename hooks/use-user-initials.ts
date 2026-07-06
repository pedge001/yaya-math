import { useState, useEffect } from "react";
import { getSubmissionHistory } from "@/lib/submission-history";

/**
 * Hook that returns the user's most recently submitted initials.
 * Used by the leaderboard to highlight the user's entries with a "YOU" badge.
 */
export function useUserInitials(): string | null {
  const [userInitials, setUserInitials] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitials() {
      const history = await getSubmissionHistory();
      if (history.length > 0) {
        setUserInitials(history[0].initials);
      }
    }
    loadInitials();
  }, []);

  return userInitials;
}
