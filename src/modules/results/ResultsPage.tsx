import { useState, useCallback } from "react";
import type { CourtroomResult } from "@/types";
import { useTournament } from "@/context/TournamentContext";
import { getTeams } from "@/modules/teams/lib/teamStorage";
import { getRounds } from "@/modules/pairings/lib/pairingStorage";
import { getAllResults, saveCourtroomResult } from "./lib/resultsStorage";

import RoundSection from "./RoundSection";

export default function ResultsPage(): JSX.Element {
  const { activeTournament } = useTournament();
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  if (!activeTournament) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24">
        <p className="text-subtle font-medium">No tournament selected</p>
        <p className="text-muted text-sm mt-1">
          Create or select a tournament from the sidebar to begin.
        </p>
      </div>
    );
  }

  const tid = activeTournament.id;
  void tick;

  const teams = getTeams(tid);
  const rounds = getRounds(tid);
  const lockedRounds = rounds.filter((r) => r.isLocked);
  const allResults = getAllResults(tid);

  const handleSave = (updated: CourtroomResult) => {
    saveCourtroomResult(tid, updated);
    refresh();
  };

  if (lockedRounds.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className="px-6 py-4 border-b border-border flex-none">
          <h1 className="text-base font-semibold text-white">Results Manager</h1>
          <p className="text-xs text-muted mt-0.5">
            {activeTournament.name} &mdash; {activeTournament.ballotType} Ballot
          </p>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 text-center py-24">
          <p className="text-subtle font-medium">No locked rounds yet</p>
          <p className="text-muted text-sm mt-1">
            Lock at least one round in the Pairing Engine before entering results.
          </p>
        </div>
      </div>
    );
  }

  const totalCourtrooms = lockedRounds.reduce(
    (s, r) => s + r.pairings.length,
    0
  );
  const completeCount = allResults.filter((r) => r.isComplete).length;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
        <div>
          <h1 className="text-base font-semibold text-white">Results Manager</h1>
          <p className="text-xs text-muted mt-0.5">
            {activeTournament.name} &mdash; {activeTournament.ballotType} Ballot &mdash;{" "}
            {completeCount} / {totalCourtrooms} courtrooms complete
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">
        {lockedRounds
          .sort((a, b) => a.roundNumber - b.roundNumber)
          .map((round) => {
            const roundResults = allResults.filter(
              (r) => r.roundNumber === round.roundNumber
            );
            return (
              <RoundSection
                key={round.roundNumber}
                round={round}
                results={roundResults}
                teams={teams}
                ballotType={activeTournament.ballotType}
                onSave={handleSave}
              />
            );
          })}
      </div>
    </div>
  );
}
