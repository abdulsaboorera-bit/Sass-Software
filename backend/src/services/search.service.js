"use strict";

const datasets = require("./datasets.service");
const { permits } = require("../middleware/rbac");

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TITLE_FIELDS = ["name", "title", "code", "memberNo", "admissionNo", "patientNo", "customerNo", "invoiceRef", "invoiceNo", "plateNumber", "unitNo"];
const SUBTITLE_FIELDS = ["phone", "email", "address", "cnic", "guardianPhone", "publisher", "author"];

function pick(row, fields) {
  for (const f of fields) {
    if (row[f]) return row[f];
  }
  return "";
}

/**
 * Ctrl/Cmd+K style global search. Scans every dataset the tenant's industry
 * exposes AND the user is permitted to view, matching the query against that
 * dataset's declared `searchFields`. Returns grouped results.
 */
async function search({ tenantId, industry, permissions, q, perGroup = 5 }) {
  const query = String(q || "").trim();
  if (query.length < 2) return [];
  const rx = new RegExp(escapeRegex(query), "i");

  const groups = [];
  for (const item of datasets.listForIndustry(industry)) {
    const entry = datasets.resolve(item.key);
    if (!entry.searchFields || entry.searchFields.length === 0) continue;
    if (!permits(permissions, entry.viewPerm)) continue;

    const filter = { tenantId, $or: entry.searchFields.map((f) => ({ [f]: rx })) };
    // eslint-disable-next-line no-await-in-loop
    const rows = await entry.Model.find(filter).limit(perGroup).lean();
    if (!rows.length) continue;

    groups.push({
      key: item.key,
      label: item.label,
      items: rows.map((r) => ({
        id: r._id,
        title: pick(r, TITLE_FIELDS) || "(untitled)",
        subtitle: pick(r, SUBTITLE_FIELDS),
      })),
    });
  }
  return groups;
}

module.exports = { search };
