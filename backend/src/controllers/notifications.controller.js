"use strict";

const { Notification } = require("../models");
const { ApiError, apiSuccess } = require("../utils/apiResponse");
const { paginate } = require("../utils/query");
const notify = require("../services/notification.service");

/** GET /api/notifications — tenant notification outbox, newest first. */
async function list(req, res) {
  const { page, limit } = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { tenantId: req.tenantId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.channel) filter.channel = req.query.channel;
  if (req.query.unread === "true") filter.readAt = null;

  const [rows, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  return apiSuccess(res, { notifications: rows, pagination: { page, limit, total } });
}

/** GET /api/notifications/unread-count — badge count for the staff bell. */
async function unreadCount(req, res) {
  const count = await Notification.countDocuments({ tenantId: req.tenantId, readAt: null });
  return apiSuccess(res, { count });
}

/** POST /api/notifications/:id/read */
async function markRead(req, res) {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();
  if (!n) throw ApiError.notFound("Notification not found");
  return apiSuccess(res, { notification: n });
}

/** POST /api/notifications/read-all */
async function markAllRead(req, res) {
  const result = await Notification.updateMany(
    { tenantId: req.tenantId, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return apiSuccess(res, { updated: result.modifiedCount });
}

/** POST /api/notifications/:id/send — confirm a queued click-to-chat was sent. */
async function markSent(req, res) {
  const n = await notify.markSent(req.tenantId, req.params.id);
  if (!n) throw ApiError.notFound("Notification not found");
  return apiSuccess(res, { notification: n });
}

/** POST /api/notifications/dispatch — run the outbox adapters now. */
async function dispatch(req, res) {
  const result = await notify.dispatchPending({ tenantId: req.tenantId, limit: req.body && req.body.limit });
  return apiSuccess(res, { result });
}

/** POST /api/notifications — create a manual notification (e.g. broadcast). */
async function create(req, res) {
  const { title, message, channel = "IN_APP", recipientType = "USER", recipientId, recipientName, recipientContact, event = "GENERIC" } = req.body || {};
  if (!title || !message) throw ApiError.badRequest("title and message are required");
  const notification = await notify.emit({
    tenantId: req.tenantId,
    event,
    channel,
    recipientType,
    recipientId,
    recipientName,
    recipientContact,
    title,
    message,
  });
  return apiSuccess(res, { notification }, 201);
}

module.exports = { list, unreadCount, markRead, markAllRead, markSent, dispatch, create };
