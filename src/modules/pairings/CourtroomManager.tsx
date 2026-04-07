import { useState } from "react";
import type { Courtroom } from "@/types";
import {
  addCourtroom,
  updateCourtroom,
  deleteCourtroom,
} from "./lib/pairingStorage";

interface CourtroomManagerProps {
  tournamentId: string;
  courtrooms: Courtroom[];
  onChange: () => void;
}

export default function CourtroomManager({
  tournamentId,
  courtrooms,
  onChange,
}: CourtroomManagerProps): JSX.Element {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addCourtroom(tournamentId, trimmed);
    setNewName("");
    onChange();
  };

  const handleEditSave = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    updateCourtroom(tournamentId, id, trimmed);
    setEditingId(null);
    setEditName("");
    onChange();
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Remove courtroom "${name}"?`)) return;
    deleteCourtroom(tournamentId, id);
    onChange();
  };

  const sorted = [...courtrooms].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted uppercase tracking-wider">
        Courtrooms
      </p>

      {sorted.length === 0 && (
        <p className="text-xs text-muted/60 italic">
          No courtrooms defined. Add at least one before generating pairings.
        </p>
      )}

      <ul className="space-y-1">
        {sorted.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            {editingId === c.id ? (
              <>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave(c.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-surface-2 border border-accent rounded text-white focus:outline-none"
                />
                <button
                  onClick={() => handleEditSave(c.id)}
                  className="px-2 py-1 text-xs bg-accent hover:bg-accent-hover text-white rounded transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-2 py-1 text-xs text-muted hover:text-subtle transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs text-subtle font-mono">
                  {c.name}
                </span>
                <button
                  onClick={() => {
                    setEditingId(c.id);
                    setEditName(c.name);
                  }}
                  className="text-xs text-muted hover:text-subtle transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="text-xs text-muted hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="e.g. Weiss 114"
          className="flex-1 px-2 py-1.5 text-xs bg-surface-2 border border-border rounded text-white placeholder-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
}
