/** Turns an uploaded spreadsheet (Excel .xlsx or .csv) into lead rows for POST /admin/ta-leads/import. */

export interface LeadImportRow {
  fullName: string;
  email?: string;
  phone?: string;
  city?: string;
  college?: string;
  note?: string;
}

export interface ParsedLeadSheet {
  rows: LeadImportRow[];
  /** Spreadsheet row number (1 = first line of the file) of each entry in `rows`. */
  sheetRows: number[];
  /** Headings we recognised, in our own words, e.g. ["Name", "Email"]. */
  recognised: string[];
  /** Headings we did not recognise (their columns are ignored). */
  ignored: string[];
  /** Rows that had no name, by spreadsheet row number. */
  missingName: number[];
}

type Field = keyof LeadImportRow;

const FIELD_LABEL: Record<Field, string> = { fullName: "Name", email: "Email", phone: "Phone", city: "City", college: "College", note: "Note" };

/** Accepted column headings (compared without case, spaces or punctuation). */
const HEADINGS: Record<string, Field> = Object.fromEntries(
  (
    [
      ["fullName", ["name", "fullname", "candidatename", "studentname", "leadname", "firstname"]],
      ["email", ["email", "emailid", "emailaddress", "mail", "mailid", "email1"]],
      ["phone", ["phone", "phonenumber", "phoneno", "mobile", "mobilenumber", "mobileno", "contact", "contactnumber", "contactno", "whatsapp", "whatsappnumber", "number"]],
      ["city", ["city", "location", "place", "town", "district"]],
      ["college", ["college", "collegename", "institute", "institution", "university", "school"]],
      ["note", ["note", "notes", "remark", "remarks", "comment", "comments", "source"]],
    ] as [Field, string[]][]
  ).flatMap(([field, names]) => names.map((n) => [n, field] as const)),
);

const normalise = (heading: string) => heading.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Cell to text; whole numbers (phone numbers typed into Excel) keep all their digits. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isInteger(value) ? value.toFixed(0) : String(value);
  if (typeof value === "string" || typeof value === "boolean") return String(value).trim();
  return "";
}

/** The first row with at least one recognised heading is the header row; everything below it is data. */
export function rowsFromTable(table: unknown[][]): ParsedLeadSheet {
  const result: ParsedLeadSheet = { rows: [], sheetRows: [], recognised: [], ignored: [], missingName: [] };
  const headerIndex = table.findIndex((row) => row.some((cell) => HEADINGS[normalise(cellText(cell))]));
  if (headerIndex === -1) return result;

  const columns = table[headerIndex]!.map((cell) => {
    const text = cellText(cell);
    return { text, field: HEADINGS[normalise(text)] };
  });
  const used = new Set<Field>();
  const fieldAt = columns.map((c) => {
    // A second "Phone" column etc. is ignored rather than overwriting the first.
    if (!c.field || used.has(c.field)) return undefined;
    used.add(c.field);
    return c.field;
  });
  result.recognised = (Object.keys(FIELD_LABEL) as Field[]).filter((f) => used.has(f)).map((f) => FIELD_LABEL[f]);
  result.ignored = columns.filter((c, i) => c.text && !fieldAt[i]).map((c) => c.text);

  table.slice(headerIndex + 1).forEach((cells, offset) => {
    const sheetRow = headerIndex + offset + 2;
    const entry: Partial<LeadImportRow> = {};
    cells.forEach((cell, i) => {
      const field = fieldAt[i];
      const text = cellText(cell);
      if (field && text) entry[field] = text;
    });
    if (Object.keys(entry).length === 0) return; // blank line
    if (!entry.fullName) {
      result.missingName.push(sheetRow);
      return;
    }
    result.rows.push(entry as LeadImportRow);
    result.sheetRows.push(sheetRow);
  });
  return result;
}

/** Minimal RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!;
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export const ACCEPTED_FILES = ".xlsx,.csv";

export async function parseLeadFile(file: File): Promise<ParsedLeadSheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return rowsFromTable(parseCsv(await file.text()));
  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    return rowsFromTable(await readSheet(file));
  }
  throw new Error("Upload an Excel (.xlsx) or CSV file. For an older .xls file or a Word table, save it as .xlsx or CSV first.");
}

export const TEMPLATE_CSV = "Name,Email,Phone,City,College,Note\nAsha Rao,asha@example.com,9876543210,Pune,COEP,Met at job fair\n";
