import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { Tournament } from "@/types";
import {
  listTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
} from "@/lib/tournament";

interface TournamentContextValue {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  setActiveTournament: (tournament: Tournament) => void;
  addTournament: (name: string) => Tournament;
  renameTournament: (id: string, name: string) => void;
  removeTournament: (id: string) => void;
  refreshTournaments: () => void;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournamentState] =
    useState<Tournament | null>(null);

  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeTournament?.id ?? null;

  const refreshTournaments = useCallback(() => {
    const all = listTournaments();
    setTournaments(all);
    const currentId = activeIdRef.current;
    if (currentId) {
      const fresh = all.find((t) => t.id === currentId);
      if (fresh) setActiveTournamentState(fresh);
    }
    return all;
  }, []);

  useEffect(() => {
    const all = refreshTournaments();
    if (all.length > 0 && !activeTournament) {
      setActiveTournamentState(all[0]);
    }
  }, []);

  const setActiveTournament = useCallback((tournament: Tournament) => {
    setActiveTournamentState(tournament);
  }, []);

  const addTournament = useCallback(
    (name: string): Tournament => {
      const created = createTournament(name);
      const all = refreshTournaments();
      const fresh = all.find((t) => t.id === created.id) ?? created;
      setActiveTournamentState(fresh);
      return fresh;
    },
    [refreshTournaments]
  );

  const renameTournament = useCallback(
    (id: string, name: string) => {
      const updated = updateTournament(id, { name });
      refreshTournaments();
      if (activeTournament?.id === id && updated) {
        setActiveTournamentState(updated);
      }
    },
    [activeTournament, refreshTournaments]
  );

  const removeTournament = useCallback(
    (id: string) => {
      deleteTournament(id);
      const remaining = refreshTournaments();
      if (activeTournament?.id === id) {
        setActiveTournamentState(remaining[0] ?? null);
      }
    },
    [activeTournament, refreshTournaments]
  );

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        activeTournament,
        setActiveTournament,
        addTournament,
        renameTournament,
        removeTournament,
        refreshTournaments,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament(): TournamentContextValue {
  const ctx = useContext(TournamentContext);
  if (!ctx)
    throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
