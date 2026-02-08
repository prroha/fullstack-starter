/**
 * Data Export Utilities
 *
 * Client-side utilities for generating and downloading CSV files,
 * as well as triggering file downloads from API endpoints.
 */

/**
 * Column definition for CSV export
 */
export interface CsvColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number | boolean | null | undefined);
}

/**
 * Generate CSV string from data array on the client-side
 * Uses simple CSV generation without external dependencies
 */
export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  if (!data.length) {
    // Return just headers for empty data
    return columns.map(col => escapeCsvValue(col.header)).join(",") + "\n";
  }

  // Build header row
  const headerRow = columns.map(col => escapeCsvValue(col.header)).join(",");

  // Build data rows
  const dataRows = data.map(item => {
    return columns
      .map(col => {
        const value = typeof col.accessor === "function"
          ? col.accessor(item)
          : item[col.accessor];
        return escapeCsvValue(formatCsvValue(value));
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n") + "\n";
}

/**
 * Escape a value for CSV format
 * Handles quotes, commas, and newlines
 */
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    // Escape double quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}

/**
 * Format a value for CSV output
 */
function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Trigger a CSV download from client-generated data
 *
 * @param data - Array of objects to export
 * @param columns - Column definitions for the CSV
 * @param filename - Filename for the download (without extension)
 */
export function downloadCsv<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  const csv = generateCsv(data, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Download a file from an API endpoint
 * Handles authentication via cookies automatically
 *
 * @param url - The API endpoint URL
 * @param filename - Optional filename override (if not provided, uses Content-Disposition header)
 */
export async function downloadFile(
  url: string,
  filename?: string
): Promise<void> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include", // Include cookies for authentication
    headers: {
      "Accept": "text/csv, application/json, */*",
    },
  });

  if (!response.ok) {
    // Try to parse error message
    const contentType = response.headers.get("Content-Type");
    if (contentType?.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.error?.message || "Download failed");
    }
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  // Get filename from Content-Disposition header if not provided
  let downloadFilename = filename;
  if (!downloadFilename) {
    const disposition = response.headers.get("Content-Disposition");
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        downloadFilename = match[1].replace(/['"]/g, "");
      }
    }
    // Fallback filename
    if (!downloadFilename) {
      downloadFilename = "export.csv";
    }
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", blobUrl);
  link.setAttribute("download", downloadFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(blobUrl);
}

/**
 * Download JSON data as a file
 *
 * @param data - The data to export
 * @param filename - Filename for the download (without extension)
 * @param pretty - Whether to format the JSON with indentation
 */
export function downloadJson(
  data: unknown,
  filename: string,
  pretty: boolean = true
): void {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Export format options
 */
export type ExportFormat = "csv" | "json";

/**
 * Get the appropriate Content-Type for an export format
 */
export function getContentType(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

/**
 * Get file extension for an export format
 */
export function getFileExtension(format: ExportFormat): string {
  return `.${format}`;
}
