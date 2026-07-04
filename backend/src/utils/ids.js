"use strict";

const crypto = require("crypto");

/** Short uppercase random suffix, e.g. "A1B2C3". */
function randomCode(len = 6) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .toUpperCase()
    .slice(0, len);
}

/**
 * Human-friendly invoice reference, e.g. "INV-2607-8F3A2C".
 * `prefix` lets each module namespace its refs (INV, RCP, ...).
 */
function invoiceRef(prefix = "INV", date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${yy}${mm}-${randomCode(6)}`;
}

/**
 * Next sequential member number scoped to a tenant, e.g. "M-0001".
 * Reads the current max for the tenant; the unique index on
 * (tenantId, memberNo) guards against races on write.
 */
async function nextMemberNo(MemberModel, tenantId, prefix = "M") {
  const last = await MemberModel.findOne({ tenantId })
    .sort({ createdAt: -1 })
    .select("memberNo")
    .lean();

  let n = 0;
  if (last && last.memberNo) {
    const m = String(last.memberNo).match(/(\d+)\s*$/);
    if (m) n = parseInt(m[1], 10);
  }
  return `${prefix}-${String(n + 1).padStart(4, "0")}`;
}

module.exports = { randomCode, invoiceRef, nextMemberNo };
