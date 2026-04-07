import type { GeneratedRound, SideHistory, Side } from "@/types";

/**
 * Computes the side history (petitioner/respondent counts) for every team
 * across all previously locked rounds.
 */
export function computeSideHistory(
  lockedRounds: GeneratedRound[]
): Map<number, SideHistory> {
  const map = new Map<number, SideHistory>();

  const ensure = (teamId: number): SideHistory => {
    if (!map.has(teamId)) {
      map.set(teamId, { teamId, petitionerCount: 0, respondentCount: 0 });
    }
    return map.get(teamId)!;
  };

  for (const round of lockedRounds) {
    for (const pairing of round.pairings) {
      ensure(pairing.petitionerTeamId).petitionerCount += 1;
      ensure(pairing.respondentTeamId).respondentCount += 1;
    }
  }

  return map;
}

/**
 * Returns the side imbalance delta for a team: positive means more petitioner
 * appearances, negative means more respondent appearances.
 */
export function sideImbalance(history: SideHistory): number {
  return history.petitionerCount - history.respondentCount;
}

/**
 * Given two teams and their side histories, assigns the side that minimizes
 * the combined imbalance. Ties are broken randomly.
 *
 * Returns which team should be petitioner.
 */
export function assignSides(
  teamAId: number,
  teamBId: number,
  historyMap: Map<number, SideHistory>
): { petitionerTeamId: number; respondentTeamId: number } {
  const histA = historyMap.get(teamAId) ?? {
    teamId: teamAId,
    petitionerCount: 0,
    respondentCount: 0,
  };
  const histB = historyMap.get(teamBId) ?? {
    teamId: teamBId,
    petitionerCount: 0,
    respondentCount: 0,
  };

  const deltaA = sideImbalance(histA);
  const deltaB = sideImbalance(histB);

  // Team with fewer petitioner appearances (lower delta) should go petitioner
  if (deltaA < deltaB) {
    return { petitionerTeamId: teamAId, respondentTeamId: teamBId };
  }
  if (deltaB < deltaA) {
    return { petitionerTeamId: teamBId, respondentTeamId: teamAId };
  }

  // Tied: random assignment
  return Math.random() < 0.5
    ? { petitionerTeamId: teamAId, respondentTeamId: teamBId }
    : { petitionerTeamId: teamBId, respondentTeamId: teamAId };
}

/**
 * Returns the preferred side for a team given its history. Used by the engine
 * to express a preference when negotiating across a pair.
 */
export function preferredSide(history: SideHistory): Side {
  return sideImbalance(history) <= 0 ? "petitioner" : "respondent";
}
