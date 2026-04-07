import type { GeneratedRound, Team } from "@/types";

export interface MatchedPair {
  teamAId: number;
  teamBId: number;
  forcedRepeat: boolean;
}

/**
 * Returns true if the two teams have already faced each other in any locked round.
 */
function haveMet(
  teamAId: number,
  teamBId: number,
  lockedRounds: GeneratedRound[]
): boolean {
  return lockedRounds.some((round) =>
    round.pairings.some(
      (p) =>
        (p.petitionerTeamId === teamAId && p.respondentTeamId === teamBId) ||
        (p.petitionerTeamId === teamBId && p.respondentTeamId === teamAId)
    )
  );
}

/**
 * Returns true if the two teams are from the same school.
 * Case-insensitive, trims whitespace.
 */
export function sameSchool(a: Team, b: Team): boolean {
  return (
    a.schoolName.trim().toLowerCase() === b.schoolName.trim().toLowerCase()
  );
}

/**
 * Counts how many valid partners a team has in the given pool,
 * subject to the given constraint.
 */
function countValidPartners(
  team: Team,
  pool: Team[],
  allowPair: (a: Team, b: Team) => boolean
): number {
  return pool.filter(
    (t) => t.teamId !== team.teamId && allowPair(team, t)
  ).length;
}

/**
 * Core backtracking matching algorithm.
 *
 * Uses the Minimum Remaining Values (MRV) heuristic: always picks the team
 * with the fewest valid partners to branch on first. This dramatically prunes
 * the search tree for typical tournament sizes (8–64 teams).
 *
 * @param pool       Remaining unpaired teams.
 * @param allowPair  Returns true if two teams may be paired together.
 * @returns          Array of matched pairs, or null if no complete matching exists.
 */
function backtrack(
  pool: Team[],
  allowPair: (a: Team, b: Team) => boolean
): Array<[Team, Team]> | null {
  if (pool.length === 0) return [];

  // MRV: pick the team with the fewest valid partners
  let pivot = pool[0];
  let minOptions = Infinity;
  for (const team of pool) {
    const count = countValidPartners(team, pool, allowPair);
    if (count < minOptions) {
      minOptions = count;
      pivot = team;
    }
  }

  const rest = pool.filter((t) => t.teamId !== pivot.teamId);
  const candidates = rest.filter((t) => allowPair(pivot, t));

  // Sort candidates so the most-constrained come first (forward checking)
  candidates.sort(
    (a, b) =>
      countValidPartners(a, rest.filter((t) => t.teamId !== b.teamId), allowPair) -
      countValidPartners(b, rest.filter((t) => t.teamId !== a.teamId), allowPair)
  );

  for (const candidate of candidates) {
    const remaining = rest.filter((t) => t.teamId !== candidate.teamId);
    const subResult = backtrack(remaining, allowPair);
    if (subResult !== null) {
      return [[pivot, candidate], ...subResult];
    }
  }

  return null;
}

/**
 * Finds a complete matching for the given team pool.
 *
 * Pass 1: no same-school pairings AND no repeat matchups.
 * Pass 2: no same-school pairings, but repeat matchups are allowed (flagged).
 *
 * If pass 2 also fails, the remaining teams have unresolvable school conflicts
 * and are returned in the `unmatched` array.
 *
 * @param teams        Teams to pair, already in desired priority order.
 * @param lockedRounds Previously locked rounds (for repeat detection).
 * @returns            Matched pairs and any truly unmatched teams.
 */
export function findMatching(
  teams: Team[],
  lockedRounds: GeneratedRound[]
): { pairs: MatchedPair[]; unmatched: Team[] } {
  if (teams.length === 0) return { pairs: [], unmatched: [] };

  // Pass 1: strict — no same school, no repeats
  const pass1 = backtrack(
    teams,
    (a, b) =>
      !sameSchool(a, b) && !haveMet(a.teamId, b.teamId, lockedRounds)
  );

  if (pass1) {
    return {
      pairs: pass1.map(([a, b]) => ({
        teamAId: a.teamId,
        teamBId: b.teamId,
        forcedRepeat: false,
      })),
      unmatched: [],
    };
  }

  // Pass 2: relaxed — no same school, but allow forced repeats
  const pass2 = backtrack(teams, (a, b) => !sameSchool(a, b));

  if (pass2) {
    return {
      pairs: pass2.map(([a, b]) => ({
        teamAId: a.teamId,
        teamBId: b.teamId,
        forcedRepeat: haveMet(a.teamId, b.teamId, lockedRounds),
      })),
      unmatched: [],
    };
  }

  // Complete failure: school constraints make a full matching impossible.
  // Pair what we can (pass 2 with a subset) and return the rest as unmatched.
  const pairs: MatchedPair[] = [];
  const remaining = [...teams];

  while (remaining.length >= 2) {
    const result = backtrack(remaining, (a, b) => !sameSchool(a, b));
    if (result) {
      result.forEach(([a, b]) =>
        pairs.push({
          teamAId: a.teamId,
          teamBId: b.teamId,
          forcedRepeat: haveMet(a.teamId, b.teamId, lockedRounds),
        })
      );
      break;
    }
    // Remove the most-constrained team and try again
    const mostConstrained = remaining.reduce((worst, team) => {
      const wc = countValidPartners(worst, remaining, (a, b) => !sameSchool(a, b));
      const tc = countValidPartners(team, remaining, (a, b) => !sameSchool(a, b));
      return tc < wc ? team : worst;
    });
    remaining.splice(remaining.indexOf(mostConstrained), 1);
    pairs.push({
      teamAId: mostConstrained.teamId,
      teamBId: -1,
      forcedRepeat: false,
    });
  }

  const pairedIds = new Set(pairs.flatMap((p) => [p.teamAId, p.teamBId]));
  const unmatched = teams.filter(
    (t) => !pairedIds.has(t.teamId) || pairs.some((p) => p.teamBId === -1 && p.teamAId === t.teamId)
  );

  return { pairs: pairs.filter((p) => p.teamBId !== -1), unmatched };
}
