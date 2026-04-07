import { useState } from "react";
import type {
  GeneratedRound,
  PairingConflict,
  Team,
  Courtroom,
} from "@/types";
import { resolveConflict, computeSideHistory } from "./lib/pairingEngine";

interface ConflictPanelProps {
  round: GeneratedRound;
  teams: Team[];
  courtrooms: Courtroom[];
  lockedRounds: GeneratedRound[];
  onRoundChange: (round: GeneratedRound) => void;
}

const REASON_LABELS: Record<PairingConflict["reason"], string> = {
  school_conflict: "All valid opponents are from the same school.",
  repeat_matchup: "All remaining opponents have already been faced.",
  no_valid_opponent: "No unmatched opponent remains.",
};

export default function ConflictPanel({
  round,
  teams,
  courtrooms,
  lockedRounds,
  onRoundChange,
}: ConflictPanelProps): JSX.Element | null {
  const [selectedOpponent, setSelectedOpponent] = useState<
    Record<number, number>
  >({});
  const [selectedCourtroom, setSelectedCourtroom] = useState<
    Record<number, string>
  >({});

  if (round.conflicts.length === 0) return null;

  const teamMap = new Map(teams.map((t) => [t.teamId, t]));

  const pairedIds = new Set(
    round.pairings.flatMap((p) => [p.petitionerTeamId, p.respondentTeamId])
  );
  const conflictIds = new Set(round.conflicts.map((c) => c.teamId));

  const availableOpponents = teams.filter(
    (t) => !pairedIds.has(t.teamId) && !conflictIds.has(t.teamId)
  );

  const handleResolve = (conflict: PairingConflict) => {
    const opponentId = selectedOpponent[conflict.teamId];
    const courtroomId = selectedCourtroom[conflict.teamId];
    if (!opponentId || !courtroomId) return;

    const courtroom = courtrooms.find((c) => c.id === courtroomId);
    if (!courtroom) return;

    const historyMap = computeSideHistory(lockedRounds);
    const updated = resolveConflict(
      round,
      conflict.teamId,
      opponentId,
      courtroom,
      historyMap
    );
    onRoundChange(updated);

    setSelectedOpponent((prev) => {
      const next = { ...prev };
      delete next[conflict.teamId];
      return next;
    });
    setSelectedCourtroom((prev) => {
      const next = { ...prev };
      delete next[conflict.teamId];
      return next;
    });
  };

  const selectClass =
    "flex-1 px-2 py-1.5 text-xs bg-surface-2 border border-border rounded text-white focus:outline-none focus:border-accent";

  return (
    <div className="rounded border border-red-700/40 bg-red-900/10 p-4 space-y-4">
      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
        {round.conflicts.length} Unresolved Conflict
        {round.conflicts.length !== 1 ? "s" : ""} — Round cannot be locked
        until resolved
      </p>

      {round.conflicts.map((conflict) => {
        const team = teamMap.get(conflict.teamId);
        const canResolve =
          availableOpponents.length > 0 && courtrooms.length > 0;

        return (
          <div
            key={conflict.teamId}
            className="space-y-2 pt-3 border-t border-red-700/20 first:border-0 first:pt-0"
          >
            <div>
              <p className="text-xs font-medium text-red-300">
                Team {conflict.teamId}
                {team ? ` — ${team.schoolName}` : ""}
              </p>
              <p className="text-xs text-red-400/70 mt-0.5">
                {REASON_LABELS[conflict.reason]}
              </p>
            </div>

            {canResolve ? (
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={selectedOpponent[conflict.teamId] ?? ""}
                  onChange={(e) =>
                    setSelectedOpponent((prev) => ({
                      ...prev,
                      [conflict.teamId]: Number(e.target.value),
                    }))
                  }
                  className={selectClass}
                >
                  <option value="">Select opponent...</option>
                  {availableOpponents.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      Team {t.teamId} — {t.schoolName}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCourtroom[conflict.teamId] ?? ""}
                  onChange={(e) =>
                    setSelectedCourtroom((prev) => ({
                      ...prev,
                      [conflict.teamId]: e.target.value,
                    }))
                  }
                  className={selectClass}
                >
                  <option value="">Select courtroom...</option>
                  {courtrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleResolve(conflict)}
                  disabled={
                    !selectedOpponent[conflict.teamId] ||
                    !selectedCourtroom[conflict.teamId]
                  }
                  className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted italic">
                No unmatched teams available to pair with.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
