import { useState } from "react";
import type { Team } from "@/types";

type SortField = "teamId" | "schoolName" | "orator1" | "orator2";
type SortDirection = "asc" | "desc";

interface TeamTableProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: number) => void;
}

export default function TeamTable({
  teams,
  onEdit,
  onDelete,
}: TeamTableProps): JSX.Element {
  const [sortField, setSortField] = useState<SortField>("teamId");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [filter, setFilter] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = teams.filter((t) => {
    const q = filter.toLowerCase();
    return (
      t.schoolName.toLowerCase().includes(q) ||
      t.orator1.toLowerCase().includes(q) ||
      t.orator2.toLowerCase().includes(q) ||
      String(t.teamId).includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = sortField === "teamId" ? a.teamId : a[sortField];
    const valB = sortField === "teamId" ? b.teamId : b[sortField];
    const cmp =
      typeof valA === "number" && typeof valB === "number"
        ? valA - valB
        : String(valA).localeCompare(String(valB));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <span className="text-muted/40 ml-1">↕</span>;
    return (
      <span className="text-accent ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  const thClass =
    "px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer select-none hover:text-subtle transition-colors";

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4 text-muted/30">⬡</div>
        <p className="text-subtle font-medium">No teams registered</p>
        <p className="text-muted text-sm mt-1">
          Use the toolbar above to add teams manually or import from CSV.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by school, orator, or ID..."
          className="flex-1 px-3 py-1.5 text-sm bg-surface-2 border border-border rounded text-white placeholder-muted focus:outline-none focus:border-accent"
        />
        <span className="text-xs text-muted whitespace-nowrap">
          {sorted.length} / {teams.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th
                className={thClass}
                onClick={() => handleSort("teamId")}
              >
                ID <SortIcon field="teamId" />
              </th>
              <th
                className={thClass}
                onClick={() => handleSort("schoolName")}
              >
                School <SortIcon field="schoolName" />
              </th>
              <th
                className={thClass}
                onClick={() => handleSort("orator1")}
              >
                Orator 1 <SortIcon field="orator1" />
              </th>
              <th
                className={thClass}
                onClick={() => handleSort("orator2")}
              >
                Orator 2 <SortIcon field="orator2" />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Contact
              </th>
              <th className="px-3 py-2 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((team) => (
              <tr
                key={team.teamId}
                className="hover:bg-surface-2/50 transition-colors"
              >
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {team.teamId}
                </td>
                <td className="px-3 py-2 font-medium text-white">
                  {team.schoolName}
                </td>
                <td className="px-3 py-2 text-subtle">{team.orator1}</td>
                <td className="px-3 py-2 text-subtle">{team.orator2}</td>
                <td className="px-3 py-2 text-muted text-xs">
                  {team.contactEmail}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => onEdit(team)}
                      className="px-2 py-1 text-xs text-subtle hover:text-white hover:bg-surface-3 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(team.teamId)}
                      className="px-2 py-1 text-xs text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
