"use strict";

const { loadMembership } = require("../middleware/auth");
const { ApiError, apiSuccess } = require("../utils/apiResponse");
const { qrDataUrl } = require("../utils/qr");
const { lookup } = require("../services/lookup.service");

async function permSet(req) {
  const membership = await loadMembership(req);
  if (!membership) {
    if (req.user.role === "SUPER_ADMIN" && !req.user.tenantId) return ["*"];
    return [];
  }
  return membership.role ? membership.role.permissions : [];
}

/** GET /api/lookup?code= — resolve a scanned barcode/QR value to a record. */
async function findByCode(req, res) {
  const permissions = await permSet(req);
  const result = await lookup({
    tenantId: req.tenantId,
    industry: req.tenant.industry,
    permissions,
    code: req.query.code,
  });
  if (!result) throw ApiError.notFound("No matching record for this code");
  return apiSuccess(res, { result });
}

/** GET /api/lookup/qr?data= — generate a QR PNG data URL (for labels/cards). */
async function makeQr(req, res) {
  const data = req.query.data || req.query.text;
  if (!data) throw ApiError.badRequest("data is required");
  const url = await qrDataUrl(data, { width: Math.min(parseInt(req.query.width, 10) || 240, 1024) });
  return apiSuccess(res, { qr: url });
}

module.exports = { findByCode, makeQr };
