import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { getTeams } from "@/modules/teams/lib/teamStorage";
import { getRounds } from "@/modules/pairings/lib/pairingStorage";
import { getAllResults } from "@/modules/results/lib/resultsStorage";
import {
  computeTeamStandings,
  computeOralistStandings,
  checkCompleteness,
} from "./lib/tabulatorEngine";
import StandingsTable from "./StandingsTable";
import OralistTable from "./OralistTable";

type Tab = "standings" | "oralists";

export default function TabulatorPage(): JSX.Element {
  const { activeTournament } = useTournament();
  const [tab, setTab] = useState<Tab>("standings");

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
  const teams = getTeams(tid);
  const rounds = getRounds(tid);
  const lockedRounds = rounds.filter((r) => r.isLocked);
  const allResults = getAllResults(tid);

  const pairingsPerRound = new Map(
    lockedRounds.map((r) => [r.roundNumber, r.pairings.length])
  );

  const completeness = checkCompleteness(
    lockedRounds.map((r) => r.roundNumber),
    allResults,
    pairingsPerRound
  );

  const teamStandings = computeTeamStandings(teams, allResults);
  const oralistStandings = computeOralistStandings(teams, allResults);

  const tabClass = (active: boolean) =>
    [
      "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
      active
        ? "border-accent text-white"
        : "border-transparent text-muted hover:text-subtle",
    ].join(" ");

  const isFullyComplete =
    completeness.completeCourtrooms === completeness.totalCourtrooms &&
    completeness.totalCourtrooms > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
        <div>
          <h1 className="text-base font-semibold text-white">Tabulator</h1>
          <p className="text-xs text-muted mt-0.5">
            {activeTournament.name} &mdash; {activeTournament.ballotType} Ballot &mdash;{" "}
            {completeness.completeCourtrooms} / {completeness.totalCourtrooms} courtrooms complete
          </p>
        </div>
        {isFullyComplete && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/40">
            All results in
          </span>
        )}
      </header>

      {/* Completeness warnings */}
      {lockedRounds.length === 0 && (
        <div className="mx-6 mt-4 px-4 py-3 rounded border border-yellow-700/40 bg-yellow-900/20 text-xs text-yellow-300">
          No locked rounds yet. Lock rounds in the Pairing Engine before tabulating.
        </div>
      )}

      {completeness.lockedRoundsWithNoResults.length > 0 && (
        <div className="mx-6 mt-4 px-4 py-3 rounded border border-yellow-700/40 bg-yellow-900/20 text-xs text-yellow-300">
          Round{completeness.lockedRoundsWithNoResults.length > 1 ? "s" : ""}{" "}
          {completeness.lockedRoundsWithNoResults.join(", ")} ha
          {completeness.lockedRoundsWithNoResults.length > 1 ? "ve" : "s"} no
          results entered. Standings shown below reflect only rounds with data.
        </div>
      )}

      {!isFullyComplete &&
        completeness.totalCourtrooms > 0 &&
        completeness.lockedRoundsWithNoResults.length === 0 && (
          <div className="mx-6 mt-4 px-4 py-3 rounded border border-border bg-surface-2 text-xs text-muted">
            {completeness.totalCourtrooms - completeness.completeCourtrooms} courtroom
            {completeness.totalCourtrooms - completeness.completeCourtrooms !== 1 ? "s" : ""}{" "}
            still have incomplete results. Standings update live as results are entered.
          </div>
        )}

      {/* Tabs */}
      <div className="flex border-b border-border flex-none mt-2">
        <button
          className={tabClass(tab === "standings")}
          onClick={() => setTab("standings")}
        >
          Team Standings
        </button>
        <button
          className={tabClass(tab === "oralists")}
          onClick={() => setTab("oralists")}
        >
          Oralist Awards
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        {tab === "standings" && (
          <StandingsTable
            standings={teamStandings}
            tournamentName={activeTournament.name}
          />
        )}
        {tab === "oralists" && (
          <OralistTable
            standings={oralistStandings}
            tournamentName={activeTournament.name}
          />
        )}
      </div>
    </div>
  );
}
