/** CRUD and bulk-import operations for teams within a tournament. */

import type { Team, TeamInput, CSVImportRow } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";

const NAMESPACE = "teams";

function readTeams(tournamentId: string): Team[] {
  return storageGet<Team[]>(tournamentId, NAMESPACE) ?? [];
}

function writeTeams(tournamentId: string, teams: Team[]): void {
  storageSet(tournamentId, NAMESPACE, teams);
}

function nextTeamId(teams: Team[]): number {
  if (teams.length === 0) return 1;
  return Math.max(...teams.map((t) => t.teamId)) + 1;
}

export function getTeams(tournamentId: string): Team[] {
  return readTeams(tournamentId);
}

export function addTeam(tournamentId: string, input: TeamInput): Team {
  const teams = readTeams(tournamentId);
  const team: Team = { teamId: nextTeamId(teams), ...input };
  writeTeams(tournamentId, [...teams, team]);
  return team;
}

export function updateTeam(
  tournamentId: string,
  teamId: number,
  updates: Partial<TeamInput>
): Team | null {
  const teams = readTeams(tournamentId);
  const index = teams.findIndex((t) => t.teamId === teamId);
  if (index === -1) return null;
  const updated = { ...teams[index], ...updates };
  const next = [...teams];
  next[index] = updated;
  writeTeams(tournamentId, next);
  return updated;
}

export function deleteTeam(tournamentId: string, teamId: number): void {
  const teams = readTeams(tournamentId);
  writeTeams(
    tournamentId,
    teams.filter((t) => t.teamId !== teamId)
  );
}

/**
 * Commits a batch of validated CSV import rows.
 * IDs are assigned sequentially starting from the current max.
 */
export function importTeams(
  tournamentId: string,
  rows: CSVImportRow[]
): Team[] {
  const existing = readTeams(tournamentId);
  let nextId = nextTeamId(existing);

  const newTeams: Team[] = rows.map((row) => ({
    teamId: nextId++,
    schoolName: row.schoolName,
    orator1: row.orator1,
    orator2: row.orator2,
    contactEmail: row.contactEmail,
  }));

  writeTeams(tournamentId, [...existing, ...newTeams]);
  return newTeams;
}
