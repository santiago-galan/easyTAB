/**
 * Tabulation engine: computes team standings and oralist rankings.
 *
 * All ballots are normalized to exactly 2 per courtroom regardless of
 * actual judge count, scaled proportionally by votes won. Rankings use
 * AMCA/NAMC tiebreaker ordering: ballot wins > SOS > point differential.
 */

import type {
  CourtroomResult,
  OralistStanding,
  Team,
  TeamStanding,
} from "@/types";

// ── Ballot normalization ──────────────────────────────────────────────────────

/**
 * Each courtroom contributes exactly 2 normalized ballots, split proportionally
 * by the number of judge ballots each team won.
 *
 * Formula:  teamNormalized = (judgesWon / totalJudges) × 2
 *
 * Tied individual judge ballots contribute 0.5 to each team before the
 * proportional scaling.
 */
function normalizedBallots(
  result: CourtroomResult
): { petitioner: number; respondent: number } {
  const judgeCount = result.ballots.length;
  if (judgeCount === 0) return { petitioner: 0, respondent: 0 };

  let petWon = 0;
  let resWon = 0;
  for (const ballot of result.ballots) {
    if (ballot.isTie) {
      petWon += 0.5;
      resWon += 0.5;
    } else if (ballot.winnerTeamId === result.petitionerTeamId) {
      petWon += 1;
    } else {
      resWon += 1;
    }
  }

  const scale = 2 / judgeCount;
  return {
    petitioner: petWon * scale,
    respondent: resWon * scale,
  };
}

/**
 * Raw point total scored by one side across all entered ballots in a result.
 * Petitioner = sum of both petitioner oralists' totals across all judges.
 */
function rawPoints(result: CourtroomResult): { petitioner: number; respondent: number } {
  let pet = 0;
  let res = 0;
  for (const b of result.ballots) {
    pet += b.petitionerTotal;
    res += b.respondentTotal;
  }
  return { petitioner: pet, respondent: res };
}

// ── Team standings ────────────────────────────────────────────────────────────

function teamCode(team: Team): string {
  return `${team.schoolName} #${team.teamId}`;
}

interface RawTeamStats {
  teamId: number;
  ballotsWon: number;
  totalBallots: number;
  pointsFor: number;
  pointsAgainst: number;
  opponents: number[];
}

function buildRawStats(
  teams: Team[],
  results: CourtroomResult[]
): Map<number, RawTeamStats> {
  const statsMap = new Map<number, RawTeamStats>();
  for (const t of teams) {
    statsMap.set(t.teamId, {
      teamId: t.teamId,
      ballotsWon: 0,
      totalBallots: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      opponents: [],
    });
  }

  for (const result of results) {
    if (result.ballots.length === 0) continue;

    const norm = normalizedBallots(result);
    const pts = rawPoints(result);

    const pet = statsMap.get(result.petitionerTeamId);
    const res = statsMap.get(result.respondentTeamId);

    if (pet) {
      pet.ballotsWon += norm.petitioner;
      pet.totalBallots += 2;
      pet.pointsFor += pts.petitioner;
      pet.pointsAgainst += pts.respondent;
      pet.opponents.push(result.respondentTeamId);
    }
    if (res) {
      res.ballotsWon += norm.respondent;
      res.totalBallots += 2;
      res.pointsFor += pts.respondent;
      res.pointsAgainst += pts.petitioner;
      res.opponents.push(result.petitionerTeamId);
    }
  }

  return statsMap;
}

/**
 * SOS = average normalized ballot-win rate of all opponents faced.
 */
function computeSOS(
  teamId: number,
  statsMap: Map<number, RawTeamStats>
): number {
  const stats = statsMap.get(teamId);
  if (!stats || stats.opponents.length === 0) return 0;

  const totalOppRate = stats.opponents.reduce((sum, oppId) => {
    const opp = statsMap.get(oppId);
    if (!opp || opp.totalBallots === 0) return sum;
    return sum + opp.ballotsWon / opp.totalBallots;
  }, 0);

  return totalOppRate / stats.opponents.length;
}

export function computeTeamStandings(
  teams: Team[],
  results: CourtroomResult[]
): TeamStanding[] {
  const statsMap = buildRawStats(teams, results);

  const standings: TeamStanding[] = teams.map((team) => {
    const stats = statsMap.get(team.teamId) ?? {
      teamId: team.teamId,
      ballotsWon: 0,
      totalBallots: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      opponents: [],
    };

    const ballotWinRate =
      stats.totalBallots > 0 ? stats.ballotsWon / stats.totalBallots : 0;
    const sos = computeSOS(team.teamId, statsMap);
    const pointDifferential = stats.pointsFor - stats.pointsAgainst;

    return {
      teamId: team.teamId,
      teamCode: teamCode(team),
      schoolName: team.schoolName,
      ballotsWon: stats.ballotsWon,
      totalBallots: stats.totalBallots,
      ballotWinRate,
      strengthOfSchedule: sos,
      pointDifferential,
      seed: null,
    };
  });

  // Sort: ballot wins DESC → SOS DESC → point differential DESC
  standings.sort((a, b) => {
    if (b.ballotsWon !== a.ballotsWon) return b.ballotsWon - a.ballotsWon;
    if (b.strengthOfSchedule !== a.strengthOfSchedule)
      return b.strengthOfSchedule - a.strengthOfSchedule;
    return b.pointDifferential - a.pointDifferential;
  });

  // Assign seeds — tied teams share a seed and skip the next
  let currentSeed = 1;
  for (let i = 0; i < standings.length; i++) {
    if (i === 0) {
      standings[i].seed = currentSeed;
    } else {
      const prev = standings[i - 1];
      const curr = standings[i];
      const tied =
        prev.ballotsWon === curr.ballotsWon &&
        prev.strengthOfSchedule === curr.strengthOfSchedule &&
        prev.pointDifferential === curr.pointDifferential;
      if (tied) {
        standings[i].seed = prev.seed;
      } else {
        currentSeed = i + 1;
        standings[i].seed = currentSeed;
      }
    }
  }

  return standings;
}

// ── Oralist standings ─────────────────────────────────────────────────────────

interface OralistKey {
  oralistName: string;
  teamId: number;
}

interface OralistAccum {
  key: OralistKey;
  totalPoints: number;
  appearances: number;
}

export function computeOralistStandings(
  teams: Team[],
  results: CourtroomResult[]
): OralistStanding[] {
  const accumMap = new Map<string, OralistAccum>();

  const keyStr = (name: string, teamId: number) => `${teamId}::${name}`;

  for (const result of results) {
    if (result.ballots.length === 0) continue;

    const petTeam = teams.find((t) => t.teamId === result.petitionerTeamId);
    const resTeam = teams.find((t) => t.teamId === result.respondentTeamId);

    for (const ballot of result.ballots) {
      // Petitioner oralists
      for (const { name, total } of [
        { name: ballot.petitionerOralist1.oralistName, total: ballot.petitionerOralist1.total },
        { name: ballot.petitionerOralist2.oralistName, total: ballot.petitionerOralist2.total },
      ]) {
        if (!petTeam) continue;
        const k = keyStr(name, petTeam.teamId);
        const existing = accumMap.get(k) ?? {
          key: { oralistName: name, teamId: petTeam.teamId },
          totalPoints: 0,
          appearances: 0,
        };
        existing.totalPoints += total;
        existing.appearances += 1;
        accumMap.set(k, existing);
      }

      // Respondent oralists
      for (const { name, total } of [
        { name: ballot.respondentOralist1.oralistName, total: ballot.respondentOralist1.total },
        { name: ballot.respondentOralist2.oralistName, total: ballot.respondentOralist2.total },
      ]) {
        if (!resTeam) continue;
        const k = keyStr(name, resTeam.teamId);
        const existing = accumMap.get(k) ?? {
          key: { oralistName: name, teamId: resTeam.teamId },
          totalPoints: 0,
          appearances: 0,
        };
        existing.totalPoints += total;
        existing.appearances += 1;
        accumMap.set(k, existing);
      }
    }
  }

  const standings: OralistStanding[] = Array.from(accumMap.values()).map(
    (accum) => {
      const team = teams.find((t) => t.teamId === accum.key.teamId);
      return {
        oralistName: accum.key.oralistName,
        teamId: accum.key.teamId,
        teamCode: team ? `${team.schoolName} #${team.teamId}` : `Team ${accum.key.teamId}`,
        schoolName: team?.schoolName ?? "Unknown",
        totalPoints: accum.totalPoints,
        appearances: accum.appearances,
        averageScore:
          accum.appearances > 0 ? accum.totalPoints / accum.appearances : 0,
      };
    }
  );

  // Sort: average score DESC → appearances DESC
  standings.sort((a, b) => {
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    return b.appearances - a.appearances;
  });

  return standings;
}

// ── Completeness helpers ──────────────────────────────────────────────────────

export interface CompletenessReport {
  totalCourtrooms: number;
  completeCourtrooms: number;
  lockedRoundsWithNoResults: number[];
}

export function checkCompleteness(
  lockedRoundNumbers: number[],
  results: CourtroomResult[],
  pairingsPerRound: Map<number, number>
): CompletenessReport {
  let totalCourtrooms = 0;
  let completeCourtrooms = 0;
  const lockedRoundsWithNoResults: number[] = [];

  for (const roundNum of lockedRoundNumbers) {
    const count = pairingsPerRound.get(roundNum) ?? 0;
    totalCourtrooms += count;

    const roundResults = results.filter((r) => r.roundNumber === roundNum);
    completeCourtrooms += roundResults.filter((r) => r.isComplete).length;

    if (roundResults.length === 0 && count > 0) {
      lockedRoundsWithNoResults.push(roundNum);
    }
  }

  return { totalCourtrooms, completeCourtrooms, lockedRoundsWithNoResults };
}

