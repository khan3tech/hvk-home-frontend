"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminApi, type LeadImportResult } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { ACCEPTED_FILES, parseLeadFile, TEMPLATE_CSV, type ParsedLeadSheet } from "@/lib/lead-import";
import { cardClass } from "./admin-shell";

/** The API takes at most this many rows per request; bigger files are sent in parts. */
const CHUNK = 1000;

const REASON_LABEL: Record<LeadImportResult["skipped"][number]["reason"], string> = {
  invalid: "Invalid",
  registered: "Already registered",
  duplicate: "Duplicate",
};

interface Outcome {
  created: number;
  skipped: { sheetRow: number; reason: LeadImportResult["skipped"][number]["reason"]; message: string }[];
}

/** Upload an Excel or CSV sheet of people; each row becomes a lead in the list below. */
export function LeadImport({ onImported }: { onImported: () => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [sheet, setSheet] = React.useState<ParsedLeadSheet | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`;

  async function choose(file: File | undefined) {
    setOutcome(null);
    setError(null);
    setSheet(null);
    setFileName(file?.name ?? null);
    if (!file) return;
    try {
      const parsed = await parseLeadFile(file);
      if (parsed.recognised.length === 0) {
        setError("No recognised column headings. The first row needs headings such as Name, Email and Phone.");
      } else if (!parsed.recognised.includes("Name")) {
        setError("The sheet needs a Name column.");
      } else if (parsed.rows.length === 0) {
        setError("No rows with a name were found under the headings.");
      } else {
        setSheet(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this file.");
    }
  }

  function reset() {
    setSheet(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!sheet) return;
    setBusy(true);
    setError(null);
    const total: Outcome = { created: 0, skipped: [] };
    try {
      for (let start = 0; start < sheet.rows.length; start += CHUNK) {
        const res = await adminApi.importLeads(sheet.rows.slice(start, start + CHUNK));
        total.created += res.created;
        for (const s of res.skipped) total.skipped.push({ sheetRow: sheet.sheetRows[start + s.row - 1] ?? s.row, reason: s.reason, message: s.message });
      }
      for (const row of sheet.missingName) total.skipped.push({ sheetRow: row, reason: "invalid", message: "Name is missing" });
      total.skipped.sort((a, b) => a.sheetRow - b.sheetRow);
      setOutcome(total);
      reset();
      onImported();
    } catch (err) {
      // Parts already sent stay imported; sending the file again skips them as duplicates.
      setError(errorMessage(err));
      if (total.created > 0) {
        setOutcome(total);
        onImported();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${cardClass} mb-4`} aria-labelledby="lead-import-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="lead-import-heading" className="flex items-center gap-2 font-semibold text-navy dark:text-white">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Import leads from a spreadsheet
          </h2>
          <p className="mt-1 text-sm text-muted">
            Excel (.xlsx) or CSV with a heading row: Name, plus Email and/or Phone. City, College and Note are optional.
            People who are already registered or already imported are skipped.
          </p>
        </div>
        <a href={templateHref} download="leads-template.csv" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-blue hover:underline dark:text-bright-blue">
          <Download className="h-4 w-4" aria-hidden="true" /> Template
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {fileName ?? "Choose file"}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_FILES}
            className="sr-only"
            aria-label="Spreadsheet of leads"
            onChange={(e) => void choose(e.target.files?.[0])}
          />
        </label>
        {sheet ? (
          <>
            <Button type="button" size="sm" loading={busy} onClick={() => void upload()}>
              Import {sheet.rows.length} lead{sheet.rows.length === 1 ? "" : "s"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={reset}>
              Cancel
            </Button>
          </>
        ) : null}
      </div>

      {sheet ? (
        <p className="mt-3 text-sm text-muted" role="status">
          Columns found: {sheet.recognised.join(", ")}
          {sheet.ignored.length ? `. Ignored: ${sheet.ignored.join(", ")}` : ""}
          {sheet.missingName.length ? `. ${sheet.missingName.length} row(s) without a name will be skipped` : ""}.
        </p>
      ) : null}

      <FormMessage>{error}</FormMessage>

      {outcome ? (
        <div className="mt-3 text-sm" role="status">
          <p className="font-semibold text-navy dark:text-white">
            {outcome.created} lead{outcome.created === 1 ? "" : "s"} added
            {outcome.skipped.length ? `, ${outcome.skipped.length} skipped` : ""}.
          </p>
          {outcome.skipped.length ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-primary-blue dark:text-bright-blue">Show skipped rows</summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-muted">
                {outcome.skipped.map((s) => (
                  <li key={`${s.sheetRow}-${s.reason}`}>
                    Row {s.sheetRow}: {REASON_LABEL[s.reason]} ({s.message})
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
