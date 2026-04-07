import type { TeamStanding } from "@/types";
import { serializeCSV, downloadCSV } from "@/lib/csv";

interface Props {
  standings: TeamStanding[];
  tournamentName: string;
}

function fmt(n: number, decimals = 3): string {
  return n.toFixed(decimals);
}

function signedDiff(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export default function StandingsTable({
  standings,
  tournamentName,
}: Props): JSX.Element {
  const handleExport = async () => {
    const rows = standings.map((s) => ({
      Seed: s.seed ?? "",
      Team_ID: s.teamId,
      School: s.schoolName,
      Ballots_Won: fmt(s.ballotsWon, 3),
      Total_Ballots: s.totalBallots,
      Ballot_Win_Rate: fmt(s.ballotWinRate, 4),
      Strength_of_Schedule: fmt(s.strengthOfSchedule, 4),
      Point_Differential: s.pointDifferential,
    }));
    const csv = serializeCSV(rows);
    await downloadCSV(
      csv,
      `seed_list_${tournamentName.replace(/\s+/g, "_")}.csv`
    );
  };

  if (standings.length === 0) {
    return (
      <p className="text-sm text-muted italic py-6">
        No teams registered or no results available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {standings.length} team{standings.length !== 1 ? "s" : ""} ranked
        </p>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-xs text-subtle hover:text-white border border-border hover:border-accent/50 rounded transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider w-12">
                Seed
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                School
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider w-10">
                #
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Ballots
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">
                SOS
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Pt Diff
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {standings.map((s, i) => {
              const isSharedSeed =
                i > 0 && standings[i - 1].seed === s.seed;
              const hasNoResults = s.totalBallots === 0;

              return (
                <tr
                  key={s.teamId}
                  className={[
                    "transition-colors",
                    hasNoResults
                      ? "opacity-40"
                      : "hover:bg-surface-2/50",
                  ].join(" ")}
                >
                  <td className="px-3 py-2 text-right tabular-nums">
                    {isSharedSeed ? (
                      <span className="text-muted text-xs">=</span>
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {s.seed}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-white font-medium">
                    {s.schoolName}
                  </td>
                  <td className="px-3 py-2 text-right text-muted text-xs tabular-nums">
                    #{s.teamId}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="text-accent font-semibold">
                      {fmt(s.ballotsWon, 2)}
                    </span>
                    <span className="text-muted text-xs ml-1">
                      / {s.totalBallots}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-subtle tabular-nums text-xs">
                    {fmt(s.ballotWinRate * 100, 1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-subtle tabular-nums text-xs">
                    {fmt(s.strengthOfSchedule, 4)}
                  </td>
                  <td
                    className={[
                      "px-3 py-2 text-right tabular-nums text-xs font-medium",
                      s.pointDifferential >= 0
                        ? "text-green-400"
                        : "text-red-400",
                    ].join(" ")}
                  >
                    {signedDiff(s.pointDifferential)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
