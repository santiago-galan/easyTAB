import { useState, useEffect, useRef } from "react";
import { useTournament } from "@/context/TournamentContext";

export default function TournamentSelector(): JSX.Element {
  const {
    tournaments,
    activeTournament,
    setActiveTournament,
    addTournament,
    removeTournament,
  } = useTournament();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isCreating]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addTournament(trimmed);
    setNewName("");
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleSelect = (tournamentId: string) => {
    const t = tournaments.find((t) => t.id === tournamentId);
    if (t) {
      setActiveTournament(t);
      setIsOpen(false);
    }
  };

  return (
    <div className="px-3 py-3 border-b border-border relative">
      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
        Tournament
      </p>

      {isCreating ? (
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setIsCreating(false);
            }}
            placeholder="Tournament name"
            className="w-full px-2 py-1.5 text-xs bg-surface-2 border border-border rounded text-white placeholder-muted focus:outline-none focus:border-accent"
          />
          <div className="flex gap-1">
            <button
              onClick={handleCreate}
              className="flex-1 px-2 py-1 text-xs bg-accent hover:bg-accent-hover text-white rounded transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 px-2 py-1 text-xs bg-surface-2 hover:bg-surface-3 text-subtle rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs bg-surface-2 border border-border rounded text-white hover:border-accent/50 transition-colors"
          >
            <span className="truncate">
              {activeTournament ? activeTournament.name : "No tournament"}
            </span>
            <svg
              className={`w-3 h-3 text-muted flex-none ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-border rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {tournaments.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">
                  No tournaments yet
                </p>
              ) : (
                tournaments.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center group hover:bg-surface-3 transition-colors"
                  >
                    <button
                      onClick={() => handleSelect(t.id)}
                      className={[
                        "flex-1 text-left px-3 py-1.5 text-xs",
                        activeTournament?.id === t.id
                          ? "text-accent font-medium"
                          : "text-subtle",
                      ].join(" ")}
                    >
                      {t.name}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Delete "${t.name}"? All data for this tournament will be permanently removed.`
                          )
                        ) {
                          removeTournament(t.id);
                          setIsOpen(false);
                        }
                      }}
                      title="Delete tournament"
                      className="px-2 py-1.5 text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreating(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-accent hover:bg-surface-3 transition-colors"
                >
                  + New tournament
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isCreating && tournaments.length === 0 && (
        <button
          onClick={() => setIsCreating(true)}
          className="mt-1.5 w-full px-2 py-1.5 text-xs text-accent border border-accent/30 rounded hover:bg-accent/10 transition-colors"
        >
          + Create first tournament
        </button>
      )}
    </div>
  );
}
