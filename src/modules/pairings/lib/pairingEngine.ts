import type {
  Team,
  Pairing,
  PairingConflict,
  GeneratedRound,
  Courtroom,
  CourtroomResult,
} from "@/types";
import { assignSides, computeSideHistory } from "./sideBalance";
import { generateSwissPairings } from "./swissPairing";
import { findMatching, sameSchool } from "./matchingEngine";

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates Round 1 pairings via random draw with backtracking.
 *
 * Guarantees:
 *  - No same-school pairings (hard constraint).
 *  - Forced repeats flagged on the pairing if unavoidable (no prior rounds
 *    exist for round 1, so this flag will never be set here).
 *  - Side balance applied via assignSides.
 */
function generateRandomPairings(
  roundNumber: number,
  teams: Team[],
  courtrooms: Courtroom[]
): GeneratedRound {
  const shuffled = shuffle(teams);
  const historyMap = computeSideHistory([]);
  const sortedCourtrooms = [...courtrooms].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const { pairs, unmatched } = findMatching(shuffled, []);

  const pairings: Pairing[] = pairs.map((match, i) => {
    const sides = assignSides(match.teamAId, match.teamBId, historyMap);
    const courtroom = sortedCourtrooms[i];
    return {
      roundNumber,
      courtroomId: courtroom?.id ?? `auto-${i}`,
      courtroomName: courtroom?.name ?? `Courtroom ${i + 1}`,
      petitionerTeamId: sides.petitionerTeamId,
      respondentTeamId: sides.respondentTeamId,
      forcedRepeat: match.forcedRepeat,
    };
  });

  const conflicts: PairingConflict[] = unmatched.map((t) => ({
    teamId: t.teamId,
    reason: unmatched.some(
      (other) => other.teamId !== t.teamId && !sameSchool(t, other)
    )
      ? "no_valid_opponent"
      : "school_conflict",
  }));

  return { roundNumber, pairings, conflicts, isLocked: false };
}

/**
 * Main entry point for the pairing engine.
 * Selects random (Round 1) or Swiss (Rounds 2+, when enabled) strategy.
 */
export function generateRound(options: {
  roundNumber: number;
  teams: Team[];
  courtrooms: Courtroom[];
  lockedRounds: GeneratedRound[];
  results: CourtroomResult[];
  useSwissPairing: boolean;
}): GeneratedRound {
  const { roundNumber, teams, courtrooms, lockedRounds, results, useSwissPairing } =
    options;

  if (teams.length < 2) {
    return { roundNumber, pairings: [], conflicts: [], isLocked: false };
  }

  if (roundNumber === 1 || !useSwissPairing) {
    return generateRandomPairings(roundNumber, teams, courtrooms);
  }

  return generateSwissPairings(
    roundNumber,
    teams,
    courtrooms,
    lockedRounds,
    results
  );
}

/**
 * Applies a manual swap to resolve a conflict: replaces one team in a pairing
 * with an unassigned team, re-running the side assignment.
 */
export function applyManualSwap(
  round: GeneratedRound,
  targetPairingIndex: number,
  replaceSide: "petitioner" | "respondent",
  newTeamId: number,
  historyMap: ReturnType<typeof computeSideHistory>
): GeneratedRound {
  const pairings = round.pairings.map((p, i): Pairing => {
    if (i !== targetPairingIndex) return p;
    const teamAId =
      replaceSide === "petitioner" ? newTeamId : p.petitionerTeamId;
    const teamBId =
      replaceSide === "respondent" ? newTeamId : p.respondentTeamId;
    const sides = assignSides(teamAId, teamBId, historyMap);
    return { ...p, ...sides };
  });

  return { ...round, pairings };
}

/**
 * Resolves a conflict by pairing a previously unmatched team with a chosen
 * opponent from the unassigned pool, appending the new pairing to the round.
 */
export function resolveConflict(
  round: GeneratedRound,
  conflictTeamId: number,
  opponentTeamId: number,
  courtroom: Courtroom,
  historyMap: ReturnType<typeof computeSideHistory>
): GeneratedRound {
  const sides = assignSides(conflictTeamId, opponentTeamId, historyMap);
  const newPairing: Pairing = {
    roundNumber: round.roundNumber,
    courtroomId: courtroom.id,
    courtroomName: courtroom.name,
    petitionerTeamId: sides.petitionerTeamId,
    respondentTeamId: sides.respondentTeamId,
  };

  const remainingConflicts = round.conflicts.filter(
    (c) => c.teamId !== conflictTeamId && c.teamId !== opponentTeamId
  );

  return {
    ...round,
    pairings: [...round.pairings, newPairing],
    conflicts: remainingConflicts,
  };
}

export { computeSideHistory };
