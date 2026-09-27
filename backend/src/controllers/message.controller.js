"use strict";

const { z } = require("zod");
const messageService = require("../services/message.service");
const { apiSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const sendSchema = z.object({ body: z.string().min(1).max(4000) });

// ── Super admin side: /api/admin/messages/:tenantId ────────
const adminInbox = asyncHandler(async (_req, res) => {
  const rows = await messageService.inbox();
  return apiSuccess(res, { inbox: rows });
});

const adminThread = asyncHandler(async (req, res) => {
  const rows = await messageService.listThread({ tenantId: req.params.tenantId });
  await messageService.markRead({ tenantId: req.params.tenantId, side: "PLATFORM" });
  return apiSuccess(res, { messages: rows });
});

const adminSend = asyncHandler(async (req, res) => {
  const { body } = sendSchema.parse(req.body);
  const msg = await messageService.send({
    tenantId: req.params.tenantId,
    senderRole: "PLATFORM",
    senderId: req.user.userId,
    body,
  });
  return apiSuccess(res, { message: msg }, 201);
});

// ── Tenant side: /api/messages ──────────────────────────────
const tenantThread = asyncHandler(async (req, res) => {
  const rows = await messageService.listThread({ tenantId: req.tenantId });
  await messageService.markRead({ tenantId: req.tenantId, side: "TENANT" });
  return apiSuccess(res, { messages: rows });
});

const tenantSend = asyncHandler(async (req, res) => {
  const { body } = sendSchema.parse(req.body);
  const msg = await messageService.send({
    tenantId: req.tenantId,
    senderRole: "TENANT",
    senderId: req.user.userId,
    body,
  });
  return apiSuccess(res, { message: msg }, 201);
});

const tenantUnread = asyncHandler(async (req, res) => {
  const unread = await messageService.tenantUnreadCount({ tenantId: req.tenantId });
  return apiSuccess(res, { unread });
});

module.exports = { adminInbox, adminThread, adminSend, tenantThread, tenantSend, tenantUnread };
