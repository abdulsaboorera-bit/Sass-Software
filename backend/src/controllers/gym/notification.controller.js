"use strict";

const notificationService = require("../../services/notification.service");
const { Notification } = require("../../models");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const filter = { tenantId: req.tenantId };
  if (req.query.event) filter.event = req.query.event;
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);
  return apiSuccess(res, { notifications: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/** Attempt delivery of this tenant's pending notifications (via registered adapters). */
const dispatch = asyncHandler(async (req, res) => {
  const result = await notificationService.dispatchPending({ tenantId: req.tenantId });
  return apiSuccess(res, result);
});

module.exports = { list, dispatch };
