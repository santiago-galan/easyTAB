/** Persistence layer for per-courtroom ballot results. */

import type { CourtroomResult } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";

const NS = "results";

function key(roundNumber: number, courtroomId: string): string {
  return `r${roundNumber}_${courtroomId}`;
}

export function getCourtroomResult(
  tournamentId: string,
  roundNumber: number,
  courtroomId: string
): CourtroomResult | null {
  return storageGet<CourtroomResult>(tournamentId, `${NS}_${key(roundNumber, courtroomId)}`);
}

export function getAllResults(tournamentId: string): CourtroomResult[] {
  const raw = storageGet<CourtroomResult[]>(tournamentId, `${NS}_index`);
  if (!raw) return [];
  return raw
    .map((r) => getCourtroomResult(tournamentId, r.roundNumber, r.courtroomId))
    .filter((r): r is CourtroomResult => r !== null);
}

export function getResultsForRound(
  tournamentId: string,
  roundNumber: number
): CourtroomResult[] {
  return getAllResults(tournamentId).filter((r) => r.roundNumber === roundNumber);
}

export function saveCourtroomResult(
  tournamentId: string,
  result: CourtroomResult
): void {
  storageSet(
    tournamentId,
    `${NS}_${key(result.roundNumber, result.courtroomId)}`,
    result
  );
  // Maintain index of all (roundNumber, courtroomId) pairs
  const index = storageGet<Array<{ roundNumber: number; courtroomId: string }>>(
    tournamentId,
    `${NS}_index`
  ) ?? [];
  const exists = index.some(
    (e) => e.roundNumber === result.roundNumber && e.courtroomId === result.courtroomId
  );
  if (!exists) {
    index.push({ roundNumber: result.roundNumber, courtroomId: result.courtroomId });
    storageSet(tournamentId, `${NS}_index`, index);
  }
}

export function deleteCourtroomResult(
  tournamentId: string,
  roundNumber: number,
  courtroomId: string
): void {
  storageSet(tournamentId, `${NS}_${key(roundNumber, courtroomId)}`, null);
  const index = storageGet<Array<{ roundNumber: number; courtroomId: string }>>(
    tournamentId,
    `${NS}_index`
  ) ?? [];
  const updated = index.filter(
    (e) => !(e.roundNumber === roundNumber && e.courtroomId === courtroomId)
  );
  storageSet(tournamentId, `${NS}_index`, updated);
}
