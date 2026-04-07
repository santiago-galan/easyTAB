import type { BallotCriterion, BallotType } from "@/types";

const AMCA_CRITERIA: BallotCriterion[] = [
  { id: "knowledge", label: "Knowledge of Subject Matter", max: 100 },
  { id: "response", label: "Response to Questions", max: 100 },
  { id: "demeanor", label: "Forensic Skill & Courtroom Demeanor", max: 100 },
  { id: "organization", label: "Organization, Logic & Clarity of Argument", max: 100 },
];

const NAMC_CRITERIA: BallotCriterion[] = [
  { id: "content", label: "Content of Argument", max: 20 },
  { id: "extemporaneous", label: "Extemporaneous Ability", max: 20 },
  { id: "demeanor", label: "Forensic Skill & Courtroom Demeanor", max: 10 },
];

export function getCriteria(ballotType: BallotType): BallotCriterion[] {
  return ballotType === "AMCA" ? AMCA_CRITERIA : NAMC_CRITERIA;
}

export function getMaxTotal(ballotType: BallotType): number {
  return getCriteria(ballotType).reduce((sum, c) => sum + c.max, 0);
}

/** Returns true if the score is below 50% of the criterion's max. */
export function isFlaggedScore(score: number, criterion: BallotCriterion): boolean {
  return score < criterion.max * 0.5;
}

export function emptyOralistCriteria(ballotType: BallotType): Record<string, number> {
  return Object.fromEntries(getCriteria(ballotType).map((c) => [c.id, 0]));
}
