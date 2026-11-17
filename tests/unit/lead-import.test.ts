import { describe, expect, it } from "vitest";
import { cellText, parseCsv, rowsFromTable } from "@/lib/lead-import";

describe("lead spreadsheet parsing", () => {
  it("parses quoted CSV fields, doubled quotes, CRLF and a BOM", () => {
    expect(parseCsv('﻿Name,Note\r\n"Rao, Asha","said ""hi""\nthen left"\r\n')).toEqual([
      ["Name", "Note"],
      ["Rao, Asha", 'said "hi"\nthen left'],
    ]);
  });

  it("finds the heading row, maps heading synonyms and reports spreadsheet row numbers", () => {
    const parsed = rowsFromTable([
      ["Leads from job fair"],
      [],
      ["Student Name", "E-mail ID", "Mobile No.", "Location", "Remarks", "Batch"],
      ["Asha Rao", "asha@example.com", 9876543210, "Pune", "Hot lead", "A"],
      ["", "", "", "", "", ""],
      ["", "nobody@example.com", "", "", "", ""],
      ["Ravi", "", "+91 91234 56789", "", "", ""],
    ]);
    expect(parsed.recognised).toEqual(["Name", "Email", "Phone", "City", "Note"]);
    expect(parsed.ignored).toEqual(["Batch"]);
    expect(parsed.rows).toEqual([
      { fullName: "Asha Rao", email: "asha@example.com", phone: "9876543210", city: "Pune", note: "Hot lead" },
      { fullName: "Ravi", phone: "+91 91234 56789" },
    ]);
    expect(parsed.sheetRows).toEqual([4, 7]);
    expect(parsed.missingName).toEqual([6]);
  });

  it("returns nothing when no heading is recognised", () => {
    expect(rowsFromTable([["foo", "bar"], ["1", "2"]]).rows).toEqual([]);
  });

  it("keeps every digit of phone numbers typed as numbers", () => {
    expect(cellText(919876543210)).toBe("919876543210");
    expect(cellText(null)).toBe("");
  });
});
