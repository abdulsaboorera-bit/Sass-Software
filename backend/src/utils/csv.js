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

module.exports = { toCsv };
