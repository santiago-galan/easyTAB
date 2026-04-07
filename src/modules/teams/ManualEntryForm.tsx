import { useState, useEffect } from "react";
import type { Team, TeamInput, TeamValidationError } from "@/types";
import { validateTeamForm } from "./lib/teamValidation";

interface ManualEntryFormProps {
  existingTeams: Team[];
  editTarget: Team | null;
  onSubmit: (input: TeamInput, teamId?: number) => void;
  onClose: () => void;
}

const EMPTY_FORM: TeamInput = {
  schoolName: "",
  orator1: "",
  orator2: "",
  contactEmail: "",
};

export default function ManualEntryForm({
  existingTeams,
  editTarget,
  onSubmit,
  onClose,
}: ManualEntryFormProps): JSX.Element {
  const [form, setForm] = useState<TeamInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<TeamValidationError[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (editTarget) {
      setForm({
        schoolName: editTarget.schoolName,
        orator1: editTarget.orator1,
        orator2: editTarget.orator2,
        contactEmail: editTarget.contactEmail,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors([]);
    setSubmitted(false);
  }, [editTarget]);

  const fieldError = (field: TeamValidationError["field"]): string | null => {
    const err = errors.find((e) => e.field === field);
    return err ? err.message : null;
  };

  const handleChange = (field: keyof TeamInput, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (submitted) {
      const result = validateTeamForm(updated, existingTeams, editTarget?.teamId);
      setErrors(result.errors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const result = validateTeamForm(form, existingTeams, editTarget?.teamId);
    setErrors(result.errors);
    if (!result.valid) return;
    onSubmit(form, editTarget?.teamId);
  };

  const isEdit = editTarget !== null;

  const inputClass = (field: keyof TeamInput) => {
    const hasError = submitted && !!fieldError(field);
    return [
      "w-full px-3 py-2 text-sm bg-surface-2 border rounded text-white placeholder-muted",
      "focus:outline-none transition-colors",
      hasError
        ? "border-red-500 focus:border-red-400"
        : "border-border focus:border-accent",
    ].join(" ");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-1 border border-border rounded-lg w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-white">
            {isEdit ? `Edit Team ${editTarget.teamId}` : "Add Team"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
              School Name
            </label>
            <input
              type="text"
              value={form.schoolName}
              onChange={(e) => handleChange("schoolName", e.target.value)}
              placeholder="e.g. University of Chicago"
              className={inputClass("schoolName")}
            />
            {fieldError("schoolName") && (
              <p className="mt-1 text-xs text-red-400">{fieldError("schoolName")}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
                Orator 1
              </label>
              <input
                type="text"
                value={form.orator1}
                onChange={(e) => handleChange("orator1", e.target.value)}
                placeholder="Full name"
                className={inputClass("orator1")}
              />
              {fieldError("orator1") && (
                <p className="mt-1 text-xs text-red-400">{fieldError("orator1")}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
                Orator 2
              </label>
              <input
                type="text"
                value={form.orator2}
                onChange={(e) => handleChange("orator2", e.target.value)}
                placeholder="Full name"
                className={inputClass("orator2")}
              />
              {fieldError("orator2") && (
                <p className="mt-1 text-xs text-red-400">{fieldError("orator2")}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              placeholder="coach@school.edu"
              className={inputClass("contactEmail")}
            />
            {fieldError("contactEmail") && (
              <p className="mt-1 text-xs text-red-400">{fieldError("contactEmail")}</p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors"
            >
              {isEdit ? "Save Changes" : "Add Team"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-subtle hover:text-white bg-surface-2 hover:bg-surface-3 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
