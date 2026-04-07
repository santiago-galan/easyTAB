/**
 * Score computation and validation for ballot entry.
 * Handles oralist totals, judge ballot winners, match-level resolution
 * (majority ballot wins with 0.5-ballot tie handling), and score flagging.
 */

import type {
  BallotCriterion,
  BallotType,
  CourtroomResult,
  JudgeBallot,
  OralistScore,
} from "@/types";
import { getCriteria, isFlaggedScore } from "@/lib/ballotConfig";

export interface OralistScoreDraft {
  oralistName: string;
  criteria: Record<string, number>;
}

export interface FlaggedCell {
  judgeIndex: number;
  side: "petitioner" | "respondent";
  oralistSlot: 1 | 2;
  criterionId: string;
}

export function buildOralistScore(
  draft: OralistScoreDraft,
  ballotType: BallotType
): OralistScore {
  const criteria = { ...draft.criteria };
  const total = getCriteria(ballotType).reduce(
    (s, c) => s + (criteria[c.id] ?? 0),
    0
  );
  return { oralistName: draft.oralistName, criteria, total };
}

export function computeJudgeTotals(ballot: JudgeBallot): {
  petitionerTotal: number;
  respondentTotal: number;
} {
  return {
    petitionerTotal:
      ballot.petitionerOralist1.total + ballot.petitionerOralist2.total,
    respondentTotal:
      ballot.respondentOralist1.total + ballot.respondentOralist2.total,
  };
}

/** Returns the winner team id, or null + isTie flag for equal totals. */
export function resolveBallotWinner(
  ballot: JudgeBallot,
  petitionerTeamId: number,
  respondentTeamId: number
): { winnerTeamId: number | null; isTie: boolean } {
  if (ballot.petitionerTotal > ballot.respondentTotal) {
    return { winnerTeamId: petitionerTeamId, isTie: false };
  }
  if (ballot.respondentTotal > ballot.petitionerTotal) {
    return { winnerTeamId: respondentTeamId, isTie: false };
  }
  return { winnerTeamId: null, isTie: true };
}

/**
 * Determines the match winner from completed ballots.
 * Each ballot is worth 1 point (0.5 each if tied).
 * Returns null if no ballots are complete yet.
 */
export function resolveMatchWinner(
  result: CourtroomResult
): { matchWinnerId: number | null; isTieMatch: boolean } {
  const complete = result.ballots.filter(
    (b) => b.winnerTeamId !== null || b.isTie
  );
  if (complete.length === 0) return { matchWinnerId: null, isTieMatch: false };

  let petitionerScore = 0;
  let respondentScore = 0;
  for (const b of complete) {
    if (b.isTie) {
      petitionerScore += 0.5;
      respondentScore += 0.5;
    } else if (b.winnerTeamId === result.petitionerTeamId) {
      petitionerScore += 1;
    } else {
      respondentScore += 1;
    }
  }

  if (petitionerScore > respondentScore) {
    return { matchWinnerId: result.petitionerTeamId, isTieMatch: false };
  }
  if (respondentScore > petitionerScore) {
    return { matchWinnerId: result.respondentTeamId, isTieMatch: false };
  }
  return { matchWinnerId: null, isTieMatch: true };
}

/** Collects all cells where the score is below 50% of the criterion max. */
export function getFlaggedCells(
  ballots: JudgeBallot[],
  criteria: BallotCriterion[]
): FlaggedCell[] {
  const flags: FlaggedCell[] = [];
  for (const ballot of ballots) {
    const slots: Array<{
      side: "petitioner" | "respondent";
      slot: 1 | 2;
      score: OralistScore;
    }> = [
      { side: "petitioner", slot: 1, score: ballot.petitionerOralist1 },
      { side: "petitioner", slot: 2, score: ballot.petitionerOralist2 },
      { side: "respondent", slot: 1, score: ballot.respondentOralist1 },
      { side: "respondent", slot: 2, score: ballot.respondentOralist2 },
    ];
    for (const { side, slot, score } of slots) {
      for (const criterion of criteria) {
        const val = score.criteria[criterion.id] ?? 0;
        if (isFlaggedScore(val, criterion)) {
          flags.push({
            judgeIndex: ballot.judgeIndex,
            side,
            oralistSlot: slot,
            criterionId: criterion.id,
          });
        }
      }
    }
  }
  return flags;
}

/** Validates that a score is a whole number within [0, max]. */
export function isValidScore(value: number, max: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= max;
}
