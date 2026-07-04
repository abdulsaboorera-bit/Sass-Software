"use strict";

const { ApiError } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { loadMembership } = require("./auth");
const { permits } = require("./rbac");
const trainerService = require("../services/gym/trainer.service");

/**
 * Resolve how much of the member roster the caller may see and set
 * `req.memberScope`:
 *   - null            => full access (owner / receptionist / super admin)
 *   - <trainerId>     => restricted to that trainer's assigned members
 *
 * Access is granted if the caller has `members.view` (broad) OR
 * `members.view.assigned` (trainer-scoped). A trainer-scoped caller must have a
 * Trainer profile linked to their user account, otherwise they see nothing.
 */
const memberViewScope = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();

  const membership = await loadMembership(req);
  const perms = membership && membership.role ? membership.role.permissions : [];

  // Super admin without a tenant membership => full access.
  if (!membership && req.user.role === "SUPER_ADMIN") {
    req.memberScope = null;
    return next();
  }

  if (permits(perms, "members.view")) {
    req.memberScope = null;
    return next();
  }

  if (permits(perms, "members.view.assigned")) {
    const trainer = await trainerService.resolveTrainerForUser({
      tenantId: req.tenantId,
      userId: req.user.userId,
    });
    if (!trainer) throw ApiError.forbidden("No trainer profile linked to this account");
    req.memberScope = String(trainer._id);
    req.trainerId = String(trainer._id);
    return next();
  }

  throw ApiError.forbidden();
});

module.exports = { memberViewScope };
