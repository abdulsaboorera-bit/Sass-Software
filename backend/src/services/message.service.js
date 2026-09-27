"use strict";

const { Message, Tenant } = require("../models");

/** Full thread for one tenant, oldest first. */
async function listThread({ tenantId, limit = 200 }) {
  return Message.find({ tenantId }).sort({ createdAt: 1 }).limit(limit).lean();
}

async function send({ tenantId, senderRole, senderId, body }) {
  return Message.create({
    tenantId,
    senderRole,
    senderId,
    body,
    readByPlatform: senderRole === "PLATFORM",
    readByTenant: senderRole === "TENANT",
  });
}

/** Mark every message the OTHER side sent as read for `side`. */
async function markRead({ tenantId, side }) {
  const field = side === "PLATFORM" ? "readByPlatform" : "readByTenant";
  const theirRole = side === "PLATFORM" ? "TENANT" : "PLATFORM";
  await Message.updateMany({ tenantId, senderRole: theirRole, [field]: false }, { [field]: true });
  return { success: true };
}

/** Unread-from-tenant count per tenant, for the super admin's inbox list. */
async function unreadCounts() {
  const rows = await Message.aggregate([
    { $match: { senderRole: "TENANT", readByPlatform: false } },
    { $group: { _id: "$tenantId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

/** How many PLATFORM messages this tenant hasn't read yet — for their own chat badge. */
async function tenantUnreadCount({ tenantId }) {
  return Message.countDocuments({ tenantId, senderRole: "PLATFORM", readByTenant: false });
}

/** Tenant list + last message preview + unread count, for the admin inbox. */
async function inbox() {
  const [tenants, unread, lastMessages] = await Promise.all([
    Tenant.find().select("name slug industry").sort({ name: 1 }).lean(),
    unreadCounts(),
    Message.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$tenantId", body: { $first: "$body" }, createdAt: { $first: "$createdAt" }, senderRole: { $first: "$senderRole" } } },
    ]),
  ]);
  const lastByTenant = new Map(lastMessages.map((m) => [String(m._id), m]));

  return tenants.map((t) => {
    const last = lastByTenant.get(String(t._id)) || null;
    return {
      tenant: { id: String(t._id), name: t.name, slug: t.slug, industry: t.industry },
      unread: unread.get(String(t._id)) || 0,
      lastMessage: last ? { body: last.body, createdAt: last.createdAt, senderRole: last.senderRole } : null,
    };
  });
}

module.exports = { listThread, send, markRead, unreadCounts, tenantUnreadCount, inbox };
