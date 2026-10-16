"use strict";

/** Escape a single CSV cell. */
function cell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build a CSV string from an array of objects and a column spec.
 * columns: [{ key, label, map? }]
 */
function toCsv(rows, columns) {
  const header = columns.map((c) => cell(c.label || c.key)).join(",");
  const lines = rows.map((r) =>
    columns.map((c) => cell(c.map ? c.map(r) : r[c.key])).join(",")
  );
  return [header, ...lines].join("\n");
}

/**
 * Parse a CSV document (RFC 4180-ish) into an array of row arrays.
 * Handles quoted fields, escaped quotes ("") and CRLF/LF newlines.
 * Dependency-free so bulk imports work without extra packages.
 */
function parseRows(text) {
  const src = String(text).replace(/^\uFEFF/, ""); // strip UTF-8 BOM
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // swallow; newline handled by \n (and lone \r is a row break)
      if (src[i + 1] !== "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
    } else {
      field += ch;
    }
  }
  // Flush the final field/row unless the file ended on a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

/**
 * Parse CSV text into an array of objects keyed by the header row.
 * Returns { headers, records } where each record is { header: value }.
 */
function parseCsv(text) {
  const rows = parseRows(text);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? r[idx] : "";
    });
    return obj;
  });
  return { headers, records };
}

module.exports = { toCsv, parseCsv, parseRows };
