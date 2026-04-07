/** CRUD operations for Tournament metadata stored in LocalStorage. */

import type { Tournament } from "@/types";
import {
  storageGet,
  storageSet,
  storagePurgeTournament,
  storageListTournamentIds,
} from "./storage";

const META_NAMESPACE = "meta";

export function getTournament(id: string): Tournament | null {
  return storageGet<Tournament>(id, META_NAMESPACE);
}

export function saveTournament(tournament: Tournament): void {
  storageSet(tournament.id, META_NAMESPACE, tournament);
}

export function listTournaments(): Tournament[] {
  return storageListTournamentIds()
    .map((id) => getTournament(id))
    .filter((t): t is Tournament => t !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function createTournament(name: string): Tournament {
  const tournament: Tournament = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    currentRound: 0,
    numberOfRounds: 3,
    useSwissPairing: false,
    ballotType: "AMCA",
  };
  saveTournament(tournament);
  return tournament;
}

export function updateTournament(
  id: string,
  updates: Partial<Omit<Tournament, "id" | "createdAt">>
): Tournament | null {
  const existing = getTournament(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  saveTournament(updated);
  return updated;
}

export function deleteTournament(id: string): void {
  storagePurgeTournament(id);
}
