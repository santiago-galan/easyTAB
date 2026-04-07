// ── Tournament ────────────────────────────────────────────────────────────────

export type BallotType = "AMCA" | "NAMC";

export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
  currentRound: number;
  numberOfRounds: number;
  useSwissPairing: boolean;
  ballotType: BallotType;
}

// ── Module 1: Team Ingestion ──────────────────────────────────────────────────

export interface Team {
  teamId: number;
  schoolName: string;
  orator1: string;
  orator2: string;
  contactEmail: string;
}

export type TeamInput = Omit<Team, "teamId">;

export interface TeamValidationError {
  field: keyof TeamInput | "general";
  message: string;
}

export interface TeamValidationResult {
  valid: boolean;
  errors: TeamValidationError[];
}

export interface CSVImportRow extends TeamInput {
  rowIndex: number;
}

export interface CSVImportResult {
  valid: CSVImportRow[];
  invalid: Array<{ row: CSVImportRow; errors: TeamValidationError[] }>;
}

// ── Module 2: Pairing Engine ──────────────────────────────────────────────────

export type Side = "petitioner" | "respondent";

export interface Courtroom {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Pairing {
  roundNumber: number;
  courtroomId: string;
  courtroomName: string;
  petitionerTeamId: number;
  respondentTeamId: number;
  /**
   * True when the engine could not avoid a repeat matchup and was forced to
   * allow it. The pairing is valid and lockable but flagged for the director.
   */
  forcedRepeat?: boolean;
}

export type PairingConflictReason =
  | "school_conflict"
  | "repeat_matchup"
  | "no_valid_opponent";

export interface PairingConflict {
  teamId: number;
  reason: PairingConflictReason;
}

export interface GeneratedRound {
  roundNumber: number;
  pairings: Pairing[];
  conflicts: PairingConflict[];
  isLocked: boolean;
}

export interface SideHistory {
  teamId: number;
  petitionerCount: number;
  respondentCount: number;
}

// ── Module 3: Results Manager ─────────────────────────────────────────────────

export interface BallotCriterion {
  id: string;
  label: string;
  max: number; // min is always 0; whole numbers only
}

/** Scores awarded by one judge to one oralist. */
export interface OralistScore {
  oralistName: string;
  criteria: Record<string, number>; // criterionId → score
  total: number;
}

/** One judge's complete ballot for a single match. */
export interface JudgeBallot {
  judgeIndex: number; // 1-based
  petitionerOralist1: OralistScore;
  petitionerOralist2: OralistScore;
  respondentOralist1: OralistScore;
  respondentOralist2: OralistScore;
  petitionerTotal: number;
  respondentTotal: number;
  /** null only when this ballot has not been fully entered yet */
  winnerTeamId: number | null;
  isTie: boolean;
}

/** Full results record for one courtroom in one round. */
export interface CourtroomResult {
  courtroomId: string;
  courtroomName: string;
  roundNumber: number;
  petitionerTeamId: number;
  respondentTeamId: number;
  judgeCount: number;
  ballots: JudgeBallot[];
  isComplete: boolean;
  /** Majority-ballot winner; null until enough ballots are in. */
  matchWinnerId: number | null;
  /** True when the ballot split is exactly even (e.g., 1–1 with 2 judges). */
  isTieMatch: boolean;
}

// ── Module 4: Tabulator ───────────────────────────────────────────────────────

export interface TeamStanding {
  teamId: number;
  schoolName: string;
  ballotsWon: number;
  totalBallots: number;
  ballotWinRate: number;
  strengthOfSchedule: number;
  pointDifferential: number;
  seed: number | null;
}

export interface OralistStanding {
  oralistName: string;
  teamId: number;
  schoolName: string;
  averageScore: number;
  roundsCompeted: number;
}

// ── Electron IPC bridge (window.electronAPI) ──────────────────────────────────

export interface ElectronAPI {
  saveFile: (
    defaultName: string,
    content: string
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  openFile: () => Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
