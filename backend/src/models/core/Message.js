"use strict";

const mongoose = require("mongoose");
const { baseOptions } = require("../base");

const { Schema } = mongoose;

/**
 * A simple 1:1 support thread per tenant, between the platform super admin
 * and that tenant's admin. `tenantId` identifies the thread; senderRole says
 * which side sent it. Independent read flags give each side its own unread
 * badge without needing a separate per-message-per-user read table.
 */
const messageSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    senderRole: { type: String, enum: ["PLATFORM", "TENANT"], required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    readByPlatform: { type: Boolean, default: false },
    readByTenant: { type: Boolean, default: false },
  },
  baseOptions
);

messageSchema.index({ tenantId: 1, createdAt: 1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
