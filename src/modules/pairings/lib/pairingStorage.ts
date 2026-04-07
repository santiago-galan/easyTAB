import type { Courtroom, GeneratedRound } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";

const ROUNDS_NAMESPACE = "pairing_rounds";
const COURTROOMS_NAMESPACE = "courtrooms";

// ── Courtrooms ────────────────────────────────────────────────────────────────

export function getCourtrooms(tournamentId: string): Courtroom[] {
  return storageGet<Courtroom[]>(tournamentId, COURTROOMS_NAMESPACE) ?? [];
}

export function saveCourtrooms(
  tournamentId: string,
  courtrooms: Courtroom[]
): void {
  storageSet(tournamentId, COURTROOMS_NAMESPACE, courtrooms);
}

export function addCourtroom(
  tournamentId: string,
  name: string
): Courtroom {
  const existing = getCourtrooms(tournamentId);
  const courtroom: Courtroom = {
    id: crypto.randomUUID(),
    name: name.trim(),
    sortOrder: existing.length,
  };
  saveCourtrooms(tournamentId, [...existing, courtroom]);
  return courtroom;
}

export function updateCourtroom(
  tournamentId: string,
  id: string,
  name: string
): void {
  const courtrooms = getCourtrooms(tournamentId).map((c) =>
    c.id === id ? { ...c, name: name.trim() } : c
  );
  saveCourtrooms(tournamentId, courtrooms);
}

export function deleteCourtroom(tournamentId: string, id: string): void {
  const filtered = getCourtrooms(tournamentId)
    .filter((c) => c.id !== id)
    .map((c, i) => ({ ...c, sortOrder: i }));
  saveCourtrooms(tournamentId, filtered);
}

export function reorderCourtrooms(
  tournamentId: string,
  orderedIds: string[]
): void {
  const courtrooms = getCourtrooms(tournamentId);
  const reordered = orderedIds
    .map((id, i) => {
      const c = courtrooms.find((c) => c.id === id);
      return c ? { ...c, sortOrder: i } : null;
    })
    .filter((c): c is Courtroom => c !== null);
  saveCourtrooms(tournamentId, reordered);
}

// ── Rounds ────────────────────────────────────────────────────────────────────

export function getRounds(tournamentId: string): GeneratedRound[] {
  return storageGet<GeneratedRound[]>(tournamentId, ROUNDS_NAMESPACE) ?? [];
}

export function getRound(
  tournamentId: string,
  roundNumber: number
): GeneratedRound | null {
  return getRounds(tournamentId).find((r) => r.roundNumber === roundNumber) ?? null;
}

export function saveRound(
  tournamentId: string,
  round: GeneratedRound
): void {
  const existing = getRounds(tournamentId).filter(
    (r) => r.roundNumber !== round.roundNumber
  );
  storageSet(tournamentId, ROUNDS_NAMESPACE, [...existing, round].sort(
    (a, b) => a.roundNumber - b.roundNumber
  ));
}

export function deleteRound(tournamentId: string, roundNumber: number): void {
  const filtered = getRounds(tournamentId).filter(
    (r) => r.roundNumber !== roundNumber
  );
  storageSet(tournamentId, ROUNDS_NAMESPACE, filtered);
}

export function lockRound(tournamentId: string, roundNumber: number): void {
  const round = getRound(tournamentId, roundNumber);
  if (!round) return;
  saveRound(tournamentId, { ...round, isLocked: true });
}
