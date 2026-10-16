"use strict";

const { loadMembership } = require("../middleware/auth");
const { apiSuccess } = require("../utils/apiResponse");
const { search } = require("../services/search.service");

async function permSet(req) {
  const membership = await loadMembership(req);
  if (!membership) {
    if (req.user.role === "SUPER_ADMIN" && !req.user.tenantId) return ["*"];
    return [];
  }
  return membership.role ? membership.role.permissions : [];
}

/** GET /api/search?q= — grouped cross-module search for the tenant. */
async function globalSearch(req, res) {
  const permissions = await permSet(req);
  const groups = await search({
    tenantId: req.tenantId,
    industry: req.tenant.industry,
    permissions,
    q: req.query.q,
  });
  return apiSuccess(res, { groups });
}

module.exports = { globalSearch };
