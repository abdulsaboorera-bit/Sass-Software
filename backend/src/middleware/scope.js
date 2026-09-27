"use strict";

const { ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { loadMembership } = require("./auth");
const { permits } = require("./rbac");
const { Trainer } = require("../models");

/**
 * Resolve how much of the member roster the caller may see and set
 * `req.memberScope` is null for full roster access, or a Trainer id for a
 * trainer with the scoped `members.view.assigned` permission.
 */
const memberViewScope = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();

  const membership = await loadMembership(req);
  const perms = membership && membership.role ? membership.role.permissions : [];

  // Platform super admin (no tenant of their own) acting cross-tenant => full access.
  if (!membership && req.user.role === "SUPER_ADMIN" && !req.user.tenantId) {
    req.memberScope = null;
    return next();
  }

  if (permits(perms, "members.view")) {
    req.memberScope = null;
    return next();
  }

  if (permits(perms, "members.view.assigned")) {
    const trainer = await Trainer.findOne({ tenantId: req.tenantId, userId: req.user.userId }).select("_id").lean();
    if (!trainer) throw ApiError.forbidden("No trainer profile is linked to this account");
    req.memberScope = String(trainer._id);
    return next();
  }

  throw ApiError.forbidden();
});

module.exports = { memberViewScope };
