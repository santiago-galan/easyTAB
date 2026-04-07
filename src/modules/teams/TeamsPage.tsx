import { useState, useCallback } from "react";
import type { Team, TeamInput, CSVImportRow } from "@/types";
import { useTournament } from "@/context/TournamentContext";
import { getTeams, addTeam, updateTeam, deleteTeam, importTeams } from "./lib/teamStorage";
import { serializeCSV, downloadCSV } from "@/lib/csv";
import TeamTable from "./TeamTable";
import ManualEntryForm from "./ManualEntryForm";
import BulkImportModal from "./BulkImportModal";

type ModalState = "none" | "add" | "edit" | "import";

export default function TeamsPage(): JSX.Element {
  const { activeTournament } = useTournament();
  const [modal, setModal] = useState<ModalState>("none");
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>(() =>
    activeTournament ? getTeams(activeTournament.id) : []
  );

  const refreshTeams = useCallback(() => {
    if (activeTournament) setTeams(getTeams(activeTournament.id));
  }, [activeTournament]);

  const handleAdd = (input: TeamInput) => {
    if (!activeTournament) return;
    addTeam(activeTournament.id, input);
    refreshTeams();
    setModal("none");
  };

  const handleEdit = (input: TeamInput, teamId?: number) => {
    if (!activeTournament || teamId === undefined) return;
    updateTeam(activeTournament.id, teamId, input);
    refreshTeams();
    setModal("none");
    setEditTarget(null);
  };

  const handleDelete = (teamId: number) => {
    if (!activeTournament) return;
    if (!window.confirm(`Remove Team ${teamId} from this tournament?`)) return;
    deleteTeam(activeTournament.id, teamId);
    refreshTeams();
  };

  const handleImportCommit = (rows: CSVImportRow[]) => {
    if (!activeTournament) return;
    importTeams(activeTournament.id, rows);
    refreshTeams();
    setModal("none");
  };

  const handleExport = async () => {
    if (teams.length === 0) return;
    const csv = serializeCSV(
      teams.map((t) => ({
        Team_ID: t.teamId,
        School_Name: t.schoolName,
        Orator_1: t.orator1,
        Orator_2: t.orator2,
        Contact_Email: t.contactEmail,
      }))
    );
    const filename = `master_teams_${activeTournament?.name.replace(/\s+/g, "_") ?? "export"}.csv`;
    await downloadCSV(csv, filename);
  };

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

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
        <div>
          <h1 className="text-base font-semibold text-white">Team Ingestion</h1>
          <p className="text-xs text-muted mt-0.5">
            {activeTournament.name} &mdash; {teams.length} team
            {teams.length !== 1 ? "s" : ""} registered
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal("import")}
            className="px-3 py-1.5 text-sm text-subtle hover:text-white border border-border hover:border-accent/50 rounded transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={handleExport}
            disabled={teams.length === 0}
            className="px-3 py-1.5 text-sm text-subtle hover:text-white border border-border hover:border-accent/50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditTarget(null);
              setModal("add");
            }}
            className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors"
          >
            + Add Team
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 py-5">
        <TeamTable
          teams={teams}
          onEdit={(team) => {
            setEditTarget(team);
            setModal("edit");
          }}
          onDelete={handleDelete}
        />
      </div>

      {(modal === "add" || modal === "edit") && (
        <ManualEntryForm
          existingTeams={teams}
          editTarget={modal === "edit" ? editTarget : null}
          onSubmit={modal === "add" ? handleAdd : handleEdit}
          onClose={() => {
            setModal("none");
            setEditTarget(null);
          }}
        />
      )}

      {modal === "import" && (
        <BulkImportModal
          existingTeams={teams}
          onCommit={handleImportCommit}
          onClose={() => setModal("none")}
        />
      )}
    </div>
  );
}
