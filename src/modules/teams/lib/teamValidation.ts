/**
 * Validation logic for team registration forms and CSV imports.
 * Enforces required fields, unique oralist names, and valid email format.
 */

import type {
  TeamInput,
  TeamValidationError,
  TeamValidationResult,
  Team,
  CSVImportRow,
  CSVImportResult,
} from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildResult(errors: TeamValidationError[]): TeamValidationResult {
  return { valid: errors.length === 0, errors };
}

/**
 * Checks that no oralist name appears on any other team in the tournament.
 * Skips the team with `excludeTeamId` to allow editing without self-collision.
 */
function findOralistCollisions(
  input: TeamInput,
  existingTeams: Team[],
  excludeTeamId?: number
): TeamValidationError[] {
  const errors: TeamValidationError[] = [];
  const candidates = excludeTeamId
    ? existingTeams.filter((t) => t.teamId !== excludeTeamId)
    : existingTeams;

  const orator1Lower = input.orator1.trim().toLowerCase();
  const orator2Lower = input.orator2.trim().toLowerCase();

  for (const team of candidates) {
    const existing = [
      team.orator1.toLowerCase(),
      team.orator2.toLowerCase(),
    ];

    if (existing.includes(orator1Lower)) {
      errors.push({
        field: "orator1",
        message: `"${input.orator1}" is already registered on Team ${team.teamId} (${team.schoolName}).`,
      });
    }

    if (existing.includes(orator2Lower)) {
      errors.push({
        field: "orator2",
        message: `"${input.orator2}" is already registered on Team ${team.teamId} (${team.schoolName}).`,
      });
    }
  }

  return errors;
}

/**
 * Validates a single team form submission.
 * Pass `excludeTeamId` when validating an edit to skip self-comparison.
 */
export function validateTeamForm(
  input: TeamInput,
  existingTeams: Team[],
  excludeTeamId?: number
): TeamValidationResult {
  const errors: TeamValidationError[] = [];

  if (!input.schoolName.trim()) {
    errors.push({ field: "schoolName", message: "School name is required." });
  }

  if (!input.orator1.trim()) {
    errors.push({ field: "orator1", message: "Orator 1 name is required." });
  }

  if (!input.orator2.trim()) {
    errors.push({ field: "orator2", message: "Orator 2 name is required." });
  }

  if (
    input.orator1.trim() &&
    input.orator2.trim() &&
    input.orator1.trim().toLowerCase() === input.orator2.trim().toLowerCase()
  ) {
    errors.push({
      field: "orator2",
      message: "Orator 1 and Orator 2 must be different people.",
    });
  }

  if (!input.contactEmail.trim()) {
    errors.push({
      field: "contactEmail",
      message: "Contact email is required.",
    });
  } else if (!EMAIL_REGEX.test(input.contactEmail.trim())) {
    errors.push({
      field: "contactEmail",
      message: "Contact email is not a valid email address.",
    });
  }

  if (errors.length > 0) return buildResult(errors);

  const collisions = findOralistCollisions(input, existingTeams, excludeTeamId);
  errors.push(...collisions);

  return buildResult(errors);
}

/**
 * Validates a raw CSV import row. Uses the same rules as validateTeamForm
 * but returns errors tagged with the source row index for UI display.
 */
export function validateCSVRow(
  row: CSVImportRow,
  existingTeams: Team[],
  alreadyValidatedRows: CSVImportRow[]
): TeamValidationResult {
  const existingPlusPrior: Team[] = [
    ...existingTeams,
    ...alreadyValidatedRows.map((r, i) => ({
      teamId: -(i + 1),
      schoolName: r.schoolName,
      orator1: r.orator1,
      orator2: r.orator2,
      contactEmail: r.contactEmail,
    })),
  ];

  return validateTeamForm(row, existingPlusPrior);
}

/**
 * Processes an array of raw CSV rows (parsed but not yet committed) and
 * splits them into valid and invalid buckets.
 */
export function validateCSVImport(
  rows: CSVImportRow[],
  existingTeams: Team[]
): CSVImportResult {
  const valid: CSVImportRow[] = [];
  const invalid: CSVImportResult["invalid"] = [];

  for (const row of rows) {
    const result = validateCSVRow(row, existingTeams, valid);
    if (result.valid) {
      valid.push(row);
    } else {
      invalid.push({ row, errors: result.errors });
    }
  }

  return { valid, invalid };
}

/**
 * Normalizes a raw Papa Parse record into a typed CSVImportRow.
 * Handles case-insensitive header matching.
 */
export function normalizeCSVRecord(
  record: Record<string, string>,
  rowIndex: number
): CSVImportRow {
  const get = (key: string): string => {
    const found = Object.entries(record).find(
      ([k]) => k.toLowerCase().replace(/[\s_]/g, "") === key.toLowerCase()
    );
    return found ? found[1].trim() : "";
  };

  return {
    rowIndex,
    schoolName: get("schoolname"),
    orator1: get("orator1"),
    orator2: get("orator2"),
    contactEmail: get("contactemail"),
  };
}
