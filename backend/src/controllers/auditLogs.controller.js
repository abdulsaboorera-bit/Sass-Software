"use strict";

const { AuditLog } = require("../models");
const { apiSuccess } = require("../utils/apiResponse");
const { paginate } = require("../utils/query");

/** GET /api/audit-logs — tenant activity trail for owners/admins. */
async function list(req, res) {
  const { page, limit } = paginate(req.query, { maxLimit: 200 });
  const filter = { tenantId: req.tenantId };
  if (req.query.resource) filter.resource = req.query.resource;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return apiSuccess(res, { logs, pagination: { page, limit, total } });
}

module.exports = { list };
