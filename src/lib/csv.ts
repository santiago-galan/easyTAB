import Papa from "papaparse";

/**
 * Parses a CSV string into an array of typed records.
 * Returns an empty array if parsing fails or the file is empty.
 */
export function parseCSV<T extends Record<string, unknown>>(
  csvString: string
): T[] {
  const result = Papa.parse<T>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  return result.data;
}

/**
 * Serializes an array of records to a CSV string.
 * Column order follows the order of keys in the first record.
 */
export function serializeCSV<T extends Record<string, unknown>>(
  records: T[],
  columns?: (keyof T)[]
): string {
  if (records.length === 0) return "";

  const fields = columns
    ? (columns as string[])
    : Object.keys(records[0] as Record<string, unknown>);

  return Papa.unparse({ fields, data: records });
}

/**
 * Triggers a file download in browser/Electron renderer.
 * Falls back to native file dialog when running in Electron.
 */
export async function downloadCSV(
  content: string,
  defaultName: string
): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.saveFile(defaultName, content);
    return;
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = defaultName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Opens a file picker and returns the CSV string.
 * Uses Electron's native dialog when available.
 */
export async function openCSVFile(): Promise<string | null> {
  if (window.electronAPI) {
    const result = await window.electronAPI.openFile();
    return result.success && result.content ? result.content : null;
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string ?? null);
      reader.readAsText(file);
    };
    input.click();
  });
}
