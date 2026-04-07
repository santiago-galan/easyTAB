import type { OralistStanding } from "@/types";
import { serializeCSV, downloadCSV } from "@/lib/csv";

interface Props {
  standings: OralistStanding[];
  tournamentName: string;
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export default function OralistTable({
  standings,
  tournamentName,
}: Props): JSX.Element {
  const handleExport = async () => {
    const rows = standings.map((s, i) => ({
      Rank: i + 1,
      Oralist: s.oralistName,
      Team_ID: s.teamId,
      School: s.schoolName,
      Average_Score: fmt(s.averageScore, 3),
      Total_Points: s.totalPoints,
      Appearances: s.appearances,
    }));
    const csv = serializeCSV(rows);
    await downloadCSV(
      csv,
      `oralist_awards_${tournamentName.replace(/\s+/g, "_")}.csv`
    );
  };

  if (standings.length === 0) {
    return (
      <p className="text-sm text-muted italic py-6">
        No oralist scores have been entered yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {standings.length} oralist{standings.length !== 1 ? "s" : ""} ranked
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
                Rank
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Oralist
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                School
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider w-10">
                #
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Avg Score
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Total Pts
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Appearances
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {standings.map((s, i) => {
              const prevAvg = i > 0 ? standings[i - 1].averageScore : null;
              const isTied = prevAvg !== null && prevAvg === s.averageScore;

              return (
                <tr
                  key={`${s.teamId}::${s.oralistName}`}
                  className="hover:bg-surface-2/50 transition-colors"
                >
                  <td className="px-3 py-2 text-right tabular-nums">
                    {isTied ? (
                      <span className="text-muted text-xs">=</span>
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {i + 1}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-white font-medium">
                    {s.oralistName}
                  </td>
                  <td className="px-3 py-2 text-subtle text-sm">
                    {s.schoolName}
                  </td>
                  <td className="px-3 py-2 text-right text-muted text-xs tabular-nums">
                    #{s.teamId}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="text-accent font-semibold">
                      {fmt(s.averageScore)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-subtle tabular-nums text-xs">
                    {s.totalPoints}
                  </td>
                  <td className="px-3 py-2 text-right text-muted tabular-nums text-xs">
                    {s.appearances}
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
