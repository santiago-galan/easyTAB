import { useState } from "react";
import type { Team, CSVImportRow, CSVImportResult } from "@/types";
import { parseCSV } from "@/lib/csv";
import { openCSVFile } from "@/lib/csv";
import { validateCSVImport, normalizeCSVRecord } from "./lib/teamValidation";

interface BulkImportModalProps {
  existingTeams: Team[];
  onCommit: (validRows: CSVImportRow[]) => void;
  onClose: () => void;
}

export default function BulkImportModal({
  existingTeams,
  onCommit,
  onClose,
}: BulkImportModalProps): JSX.Element {
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleOpenFile = async () => {
    setIsLoading(true);
    setFileError(null);
    try {
      const content = await openCSVFile();
      if (!content) {
        setIsLoading(false);
        return;
      }

      const rawRecords = parseCSV<Record<string, string>>(content);
      if (rawRecords.length === 0) {
        setFileError("The selected file is empty or could not be parsed.");
        setIsLoading(false);
        return;
      }

      const rows: CSVImportRow[] = rawRecords.map((record, i) =>
        normalizeCSVRecord(record, i + 1)
      );

      setImportResult(validateCSVImport(rows, existingTeams));
    } catch {
      setFileError("An error occurred while reading the file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = () => {
    if (!importResult || importResult.valid.length === 0) return;
    onCommit(importResult.valid);
  };

  const hasResults = importResult !== null;
  const validCount = importResult?.valid.length ?? 0;
  const invalidCount = importResult?.invalid.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-1 border border-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-none">
          <h2 className="text-sm font-semibold text-white">Bulk CSV Import</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="p-3 bg-surface-2 rounded border border-border text-xs text-muted space-y-1">
            <p className="text-subtle font-medium">Expected CSV format:</p>
            <p className="font-mono text-muted/80">
              School_Name, Orator_1, Orator_2, Contact_Email
            </p>
            <p>Column headers are case-insensitive. Team IDs are auto-assigned.</p>
          </div>

          {!hasResults && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              {fileError && (
                <p className="text-sm text-red-400">{fileError}</p>
              )}
              <button
                onClick={handleOpenFile}
                disabled={isLoading}
                className="px-5 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50"
              >
                {isLoading ? "Reading file..." : "Select CSV File"}
              </button>
            </div>
          )}

          {hasResults && (
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-green-900/20 border border-green-700/30 rounded">
                  <p className="text-xs text-green-400 font-medium">
                    {validCount} row{validCount !== 1 ? "s" : ""} ready to import
                  </p>
                </div>
                {invalidCount > 0 && (
                  <div className="flex-1 p-3 bg-red-900/20 border border-red-700/30 rounded">
                    <p className="text-xs text-red-400 font-medium">
                      {invalidCount} row{invalidCount !== 1 ? "s" : ""} with errors (skipped)
                    </p>
                  </div>
                )}
              </div>

              {invalidCount > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Invalid Rows
                  </p>
                  {importResult!.invalid.map(({ row, errors }) => (
                    <div
                      key={row.rowIndex}
                      className="p-3 bg-red-900/10 border border-red-700/20 rounded text-xs"
                    >
                      <p className="text-red-300 font-medium mb-1">
                        Row {row.rowIndex}: {row.schoolName || "(no school name)"}
                      </p>
                      <ul className="space-y-0.5">
                        {errors.map((e, i) => (
                          <li key={i} className="text-red-400/80">
                            {e.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {validCount > 0 && (
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-2 border-b border-border">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted font-medium">Row</th>
                        <th className="px-3 py-2 text-left text-muted font-medium">School</th>
                        <th className="px-3 py-2 text-left text-muted font-medium">Orator 1</th>
                        <th className="px-3 py-2 text-left text-muted font-medium">Orator 2</th>
                        <th className="px-3 py-2 text-left text-muted font-medium">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importResult!.valid.map((row) => (
                        <tr key={row.rowIndex}>
                          <td className="px-3 py-1.5 font-mono text-muted">{row.rowIndex}</td>
                          <td className="px-3 py-1.5 text-white">{row.schoolName}</td>
                          <td className="px-3 py-1.5 text-subtle">{row.orator1}</td>
                          <td className="px-3 py-1.5 text-subtle">{row.orator2}</td>
                          <td className="px-3 py-1.5 text-muted">{row.contactEmail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border flex-none">
          {hasResults && (
            <button
              onClick={() => {
                setImportResult(null);
                setFileError(null);
              }}
              className="px-4 py-2 text-sm text-subtle hover:text-white transition-colors"
            >
              Choose Different File
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-subtle hover:text-white bg-surface-2 hover:bg-surface-3 rounded transition-colors"
            >
              Cancel
            </button>
            {hasResults && validCount > 0 && (
              <button
                onClick={handleCommit}
                className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors"
              >
                Import {validCount} Team{validCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
