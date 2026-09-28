"use strict";

const express = require("express");
const env = require("../../config/env");
const { runGymDaily } = require("../../jobs/gymDaily");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { requireAnyPermission } = require("../../middleware/rbac");

const router = express.Router();

/**
 * Secondary trigger for the daily pass, for environments that prefer an
 * external scheduler over the in-process node-cron. Mounted OUTSIDE the tenant
 * guard so machine callers (no login) can reach it. Authorised by EITHER a
 * matching `x-cron-secret` header OR a settings.edit / billing.edit permission.
 * This handler resolves tenant context itself for the permissioned path.
 */
const cronAuthOrPermission = asyncHandler(async (req, res, next) => {
  const secret = req.headers["x-cron-secret"];
  if (env.cron.enabled && secret && secret === env.cron.secret) {
    req.cronMachine = true;
    return next();
  }

  if (!req.user) throw ApiError.unauthorized();

  // Resolve tenant context (mirrors requireTenant) for the human path.
  let tenantId = req.user.tenantId;
  if (!tenantId && req.user.role === "SUPER_ADMIN") {
    tenantId = req.query.tenantId || req.headers["x-tenant-id"];
  }
  if (!tenantId) throw ApiError.forbidden("No tenant context");
  req.tenantId = String(tenantId);

  return requireAnyPermission("settings.edit", "billing.edit")(req, res, next);
});

router.post(
  "/daily",
  cronAuthOrPermission,
  asyncHandler(async (req, res) => {
    // Machine callers may target a specific tenant or run platform-wide (no id).
    const tenantId = req.tenantId || req.body.tenantId || undefined;
    const summary = await runGymDaily({ tenantId });
    return apiSuccess(res, summary);
  })
);

module.exports = router;
