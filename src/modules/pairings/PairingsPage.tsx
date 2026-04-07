import { useState, useCallback, useEffect } from "react";
import type { BallotType, GeneratedRound } from "@/types";
import { useTournament } from "@/context/TournamentContext";
import { updateTournament } from "@/lib/tournament";
import { getTeams } from "@/modules/teams/lib/teamStorage";
import { getCourtrooms, getRounds, saveRound, lockRound, deleteRound } from "./lib/pairingStorage";
import { getAllResults } from "@/modules/results/lib/resultsStorage";
import { generateRound } from "./lib/pairingEngine";
import CourtroomManager from "./CourtroomManager";
import PairingGrid from "./PairingGrid";
import ConflictPanel from "./ConflictPanel";

type PanelView = "setup" | "rounds";

export default function PairingsPage(): JSX.Element {
  const { activeTournament, refreshTournaments } = useTournament();
  const [view, setView] = useState<PanelView>("setup");
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Reset local UI state whenever the active tournament changes
  useEffect(() => {
    setView("setup");
    setActiveRoundNumber(1);
  }, [activeTournament?.id]);

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
  // `tick` is referenced here so that calling refresh() re-runs these reads
  const teams = getTeams(tid);
  const courtrooms = getCourtrooms(tid);
  const rounds = getRounds(tid);
  const allResults = getAllResults(tid);
  void tick;
  const lockedRounds = rounds.filter((r) => r.isLocked);
  const activeRound = rounds.find((r) => r.roundNumber === activeRoundNumber) ?? null;
  const totalRounds = activeTournament.numberOfRounds;

  const handleGenerateRound = () => {
    const existing = rounds.find((r) => r.roundNumber === activeRoundNumber);

    // For Swiss rounds 2+, require that the previous round has at least one
    // entered result so the record sort is meaningful.
    if (
      activeTournament.useSwissPairing &&
      activeRoundNumber > 1
    ) {
      const priorRoundResults = allResults.filter(
        (r) => r.roundNumber === activeRoundNumber - 1
      );
      if (priorRoundResults.length === 0) {
        window.alert(
          `Round ${activeRoundNumber - 1} has no results entered.\n\n` +
          `Swiss pairing ranks teams by ballot wins, so results for the ` +
          `previous round must be entered before generating Round ${activeRoundNumber}.`
        );
        return;
      }
    }

    if (existing && !window.confirm(`Regenerate Round ${activeRoundNumber}? The existing draft will be replaced.`)) return;
    if (existing) deleteRound(tid, activeRoundNumber);

    const generated = generateRound({
      roundNumber: activeRoundNumber,
      teams,
      courtrooms,
      lockedRounds,
      results: allResults,
      useSwissPairing: activeTournament.useSwissPairing,
    });
    saveRound(tid, generated);
    setView("rounds");
    refresh();
  };

  const handleLockRound = () => {
    if (!activeRound || activeRound.conflicts.length > 0) return;
    if (!window.confirm(`Lock Round ${activeRoundNumber}? This cannot be undone.`)) return;
    lockRound(tid, activeRoundNumber);
    updateTournament(tid, { currentRound: activeRoundNumber });
    refreshTournaments();
    refresh();
  };

  const handleRoundChange = (updated: GeneratedRound) => {
    saveRound(tid, updated);
    refresh();
  };

  const handleSettingChange = (
    key: "numberOfRounds" | "useSwissPairing" | "ballotType",
    value: number | boolean | BallotType
  ) => {
    updateTournament(tid, { [key]: value });
    refreshTournaments();
  };

  const tabClass = (active: boolean) =>
    [
      "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
      active
        ? "border-accent text-white"
        : "border-transparent text-muted hover:text-subtle",
    ].join(" ");

  const roundTabClass = (n: number) =>
    [
      "px-3 py-1.5 text-xs rounded transition-colors",
      activeRoundNumber === n
        ? "bg-accent text-white font-medium"
        : rounds.find((r) => r.roundNumber === n)?.isLocked
        ? "bg-surface-2 text-green-400"
        : rounds.find((r) => r.roundNumber === n)
        ? "bg-surface-2 text-yellow-400"
        : "bg-surface-2 text-muted hover:text-subtle",
    ].join(" ");

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
        <div>
          <h1 className="text-base font-semibold text-white">Pairing Engine</h1>
          <p className="text-xs text-muted mt-0.5">
            {activeTournament.name} &mdash; {teams.length} teams &mdash;{" "}
            {totalRounds} prelim rounds
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === "rounds" && activeRound && !activeRound.isLocked && (
            <>
              <button
                onClick={handleGenerateRound}
                className="px-3 py-1.5 text-sm text-subtle hover:text-white border border-border hover:border-accent/50 rounded transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={handleLockRound}
                disabled={activeRound.conflicts.length > 0}
                className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Lock Round {activeRoundNumber}
              </button>
            </>
          )}
          {view === "rounds" && !activeRound && (
            <button
              onClick={handleGenerateRound}
              disabled={teams.length < 2 || courtrooms.length === 0}
              className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Round {activeRoundNumber}
            </button>
          )}
        </div>
      </header>

      <div className="flex border-b border-border flex-none">
        <button className={tabClass(view === "setup")} onClick={() => setView("setup")}>
          Setup
        </button>
        <button className={tabClass(view === "rounds")} onClick={() => setView("rounds")}>
          Rounds
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        {view === "setup" && (
          <div className="max-w-md space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                Tournament Settings
              </p>

              <div className="flex items-center justify-between p-3 bg-surface-2 rounded border border-border">
                <div>
                  <p className="text-sm text-white">Preliminary Rounds</p>
                  <p className="text-xs text-muted mt-0.5">
                    Number of rounds before elimination
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={totalRounds}
                  onChange={(e) =>
                    handleSettingChange(
                      "numberOfRounds",
                      Math.max(1, Math.min(10, Number(e.target.value)))
                    )
                  }
                  className="w-16 px-2 py-1 text-sm text-center bg-surface-3 border border-border rounded text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-2 rounded border border-border">
                <div>
                  <p className="text-sm text-white">Swiss / Power Pairing</p>
                  <p className="text-xs text-muted mt-0.5">
                    Rounds 2+ pair teams by win record
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleSettingChange(
                      "useSwissPairing",
                      !activeTournament.useSwissPairing
                    )
                  }
                  className={[
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    activeTournament.useSwissPairing
                      ? "bg-accent"
                      : "bg-surface-3 border border-border",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                      activeTournament.useSwissPairing
                        ? "translate-x-4"
                        : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-2 rounded border border-border">
                <div>
                  <p className="text-sm text-white">Ballot Standard</p>
                  <p className="text-xs text-muted mt-0.5">
                    Scoring criteria applied to all judge ballots
                  </p>
                </div>
                <div className="flex items-center rounded overflow-hidden border border-border text-xs font-medium">
                  {(["AMCA", "NAMC"] as BallotType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSettingChange("ballotType", type)}
                      className={[
                        "px-3 py-1.5 transition-colors",
                        activeTournament.ballotType === type
                          ? "bg-accent text-white"
                          : "bg-surface-3 text-muted hover:text-subtle",
                      ].join(" ")}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <CourtroomManager
              tournamentId={tid}
              courtrooms={courtrooms}
              onChange={refresh}
            />

            {teams.length === 0 && (
              <p className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                No teams registered. Add teams in the Team Ingestion module before generating pairings.
              </p>
            )}

            {courtrooms.length === 0 && teams.length > 0 && (
              <p className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                Add at least one courtroom above before generating pairings.
              </p>
            )}

            {teams.length >= 2 && courtrooms.length > 0 && (
              <button
                onClick={() => {
                  setView("rounds");
                  setActiveRoundNumber(1);
                }}
                className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors"
              >
                Proceed to Rounds
              </button>
            )}
          </div>
        )}

        {view === "rounds" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setActiveRoundNumber(n)}
                  className={roundTabClass(n)}
                >
                  Round {n}
                  {rounds.find((r) => r.roundNumber === n)?.isLocked
                    ? " ✓"
                    : ""}
                </button>
              ))}
            </div>

            {activeRound ? (
              <div className="space-y-4">
                <ConflictPanel
                  round={activeRound}
                  teams={teams}
                  courtrooms={courtrooms}
                  lockedRounds={lockedRounds}
                  onRoundChange={handleRoundChange}
                />
                <PairingGrid
                  round={activeRound}
                  teams={teams}
                  tournamentName={activeTournament.name}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-subtle font-medium">Round {activeRoundNumber} not yet generated</p>
                <p className="text-muted text-sm mt-1 mb-4">
                  {activeRoundNumber > 1 && !lockedRounds.find((r) => r.roundNumber === activeRoundNumber - 1)
                    ? `Lock Round ${activeRoundNumber - 1} before generating Round ${activeRoundNumber}.`
                    : "Click Generate to create pairings for this round."}
                </p>
                <button
                  onClick={handleGenerateRound}
                  disabled={
                    teams.length < 2 ||
                    courtrooms.length === 0 ||
                    (activeRoundNumber > 1 &&
                      !lockedRounds.find(
                        (r) => r.roundNumber === activeRoundNumber - 1
                      ))
                  }
                  className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generate Round {activeRoundNumber}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
