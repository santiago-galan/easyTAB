import type { GeneratedRound, Team } from "@/types";
import { serializeCSV, downloadCSV } from "@/lib/csv";

interface PairingGridProps {
  round: GeneratedRound;
  teams: Team[];
  tournamentName: string;
}

export default function PairingGrid({
  round,
  teams,
  tournamentName,
}: PairingGridProps): JSX.Element {
  const teamMap = new Map(teams.map((t) => [t.teamId, t]));

  const sorted = [...round.pairings].sort((a, b) =>
    a.courtroomName.localeCompare(b.courtroomName)
  );

  const handleExport = async () => {
    const rows = sorted.map((p) => ({
      Round: p.roundNumber,
      Courtroom: p.courtroomName,
      Petitioner_ID: p.petitionerTeamId,
      Petitioner_School:
        teamMap.get(p.petitionerTeamId)?.schoolName ?? "Unknown",
      Respondent_ID: p.respondentTeamId,
      Respondent_School:
        teamMap.get(p.respondentTeamId)?.schoolName ?? "Unknown",
    }));
    const csv = serializeCSV(rows);
    const filename = `pairings_round_${round.roundNumber}_${tournamentName.replace(/\s+/g, "_")}.csv`;
    await downloadCSV(csv, filename);
  };

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted italic py-4">
        No pairings generated yet for this round.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {round.isLocked ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
              Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700/30">
              Draft
            </span>
          )}
          <span className="text-xs text-muted">
            {sorted.length} matchup{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
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
              <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Courtroom
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Petitioner
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-muted uppercase tracking-wider w-8">
                vs
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Respondent
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((pairing, i) => {
              const petitioner = teamMap.get(pairing.petitionerTeamId);
              const respondent = teamMap.get(pairing.respondentTeamId);
              return (
                <tr
                  key={i}
                  className={[
                    "transition-colors",
                    pairing.forcedRepeat
                      ? "bg-yellow-900/10 hover:bg-yellow-900/20"
                      : "hover:bg-surface-2/50",
                  ].join(" ")}
                >
                  <td className="px-3 py-2 text-xs font-mono text-muted">
                    {pairing.courtroomName}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-white text-sm">
                      {petitioner?.schoolName ?? `Team ${pairing.petitionerTeamId}`}
                    </span>
                    <span className="text-muted text-xs ml-2">
                      #{pairing.petitionerTeamId}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-muted text-xs">
                    v.
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-white text-sm">
                      {respondent?.schoolName ?? `Team ${pairing.respondentTeamId}`}
                    </span>
                    <span className="text-muted text-xs ml-2">
                      #{pairing.respondentTeamId}
                    </span>
                    {pairing.forcedRepeat && (
                      <span
                        className="ml-3 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-800/40 text-yellow-300 border border-yellow-700/40"
                        title="These teams have already faced each other. No valid alternative pairing exists given the constraints."
                      >
                        Repeat matchup
                      </span>
                    )}
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
