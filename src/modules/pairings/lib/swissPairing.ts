import type {
  Team,
  Pairing,
  PairingConflict,
  GeneratedRound,
  Courtroom,
  CourtroomResult,
} from "@/types";
import { assignSides, computeSideHistory } from "./sideBalance";
import { findMatching, sameSchool } from "./matchingEngine";

interface TeamRecord {
  teamId: number;
  schoolName: string;
  ballotWins: number;
  strengthOfSchedule: number;
}

/**
 * Derives each team's ballot win count and strength of schedule from locked
 * match results. Tied matches contribute 0.5 wins to each team.
 * SOS = sum of opponents' ballot win counts.
 */
function buildTeamRecords(
  teams: Team[],
  results: CourtroomResult[]
): TeamRecord[] {
  const winMap = new Map<number, number>();
  teams.forEach((t) => winMap.set(t.teamId, 0));

  for (const result of results) {
    if (result.isTieMatch) {
      winMap.set(result.petitionerTeamId, (winMap.get(result.petitionerTeamId) ?? 0) + 0.5);
      winMap.set(result.respondentTeamId, (winMap.get(result.respondentTeamId) ?? 0) + 0.5);
    } else if (result.matchWinnerId !== null) {
      winMap.set(result.matchWinnerId, (winMap.get(result.matchWinnerId) ?? 0) + 1);
    }
  }

  return teams.map((team) => {
    const opponents = results
      .filter(
        (r) =>
          r.petitionerTeamId === team.teamId ||
          r.respondentTeamId === team.teamId
      )
      .map((r) =>
        r.petitionerTeamId === team.teamId
          ? r.respondentTeamId
          : r.petitionerTeamId
      );

    const sos = opponents.reduce(
      (sum, oppId) => sum + (winMap.get(oppId) ?? 0),
      0
    );

    return {
      teamId: team.teamId,
      schoolName: team.schoolName,
      ballotWins: winMap.get(team.teamId) ?? 0,
      strengthOfSchedule: sos,
    };
  });
}

/**
 * Generates Swiss (power) pairings for a given round.
 *
 * Teams are sorted by win record then SOS, then passed to the backtracking
 * matching engine which preserves ranking order as a soft preference while
 * guaranteeing:
 *  - No same-school pairings (hard constraint).
 *  - No repeat matchups (soft — relaxed with a forced-repeat flag when
 *    unavoidable).
 *  - Side balance via assignSides.
 */
export function generateSwissPairings(
  roundNumber: number,
  teams: Team[],
  courtrooms: Courtroom[],
  lockedRounds: GeneratedRound[],
  results: CourtroomResult[]
): GeneratedRound {
  const records = buildTeamRecords(teams, results).sort((a, b) => {
    if (b.ballotWins !== a.ballotWins) return b.ballotWins - a.ballotWins;
    return b.strengthOfSchedule - a.strengthOfSchedule;
  });

  // Produce a Team[] sorted by Swiss record for the matching engine
  const sortedTeams: Team[] = records
    .map((r) => teams.find((t) => t.teamId === r.teamId))
    .filter((t): t is Team => t !== undefined);

  const historyMap = computeSideHistory(lockedRounds);
  const sortedCourtrooms = [...courtrooms].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const { pairs, unmatched } = findMatching(sortedTeams, lockedRounds);

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
