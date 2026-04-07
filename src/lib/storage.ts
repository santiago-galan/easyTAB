/**
 * Generic LocalStorage CRUD layer.
 *
 * All keys are namespaced by tournamentId to ensure full data isolation
 * between tournaments stored in the same browser/Electron session.
 *
 * Key format: phoenixtab:<tournamentId>:<namespace>
 */

const KEY_PREFIX = "phoenixtab";

function buildKey(tournamentId: string, namespace: string): string {
  return `${KEY_PREFIX}:${tournamentId}:${namespace}`;
}

export function storageGet<T>(tournamentId: string, namespace: string): T | null {
  try {
    const raw = localStorage.getItem(buildKey(tournamentId, namespace));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function storageSet<T>(
  tournamentId: string,
  namespace: string,
  value: T
): void {
  localStorage.setItem(buildKey(tournamentId, namespace), JSON.stringify(value));
}

export function storageDelete(tournamentId: string, namespace: string): void {
  localStorage.removeItem(buildKey(tournamentId, namespace));
}

/**
 * Removes all keys belonging to a tournament, effectively deleting all its data.
 */
export function storagePurgeTournament(tournamentId: string): void {
  const prefix = `${KEY_PREFIX}:${tournamentId}:`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keysToRemove.push(key);
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Returns all tournament IDs stored in LocalStorage by scanning for the
 * meta key pattern.
 */
export function storageListTournamentIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${KEY_PREFIX}:`) && key.endsWith(":meta")) {
      const parts = key.split(":");
      if (parts.length === 3) ids.push(parts[1]);
    }
  }
  return ids;
}
