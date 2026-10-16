"use strict";

const { AuditLog } = require("../models");

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// Never persist these to the audit trail.
const REDACT = new Set([
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "twoFactorSecret",
  "twoFactorPendingSecret",
  "twoFactorRecoveryCodes",
  "code",
]);

function redact(value, depth = 0) {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Date) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = REDACT.has(k) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

function actionFor(method) {
  if (method === "POST") return "CREATE";
  if (method === "DELETE") return "DELETE";
  return "UPDATE";
}

/**
 * Fire-and-forget audit trail. On any successful authenticated mutation under
 * /api it appends an AuditLog row (never blocks the response; failures are
 * swallowed). Secrets are redacted before storage.
 */
function auditLog(req, res, next) {
  if (!MUTATING.has(req.method)) return next();

  res.on("finish", () => {
    try {
      if (res.statusCode >= 400) return;
      if (!req.user || !req.user.userId) return;

      const path = req.originalUrl.split("?")[0];
      const segments = path.split("/").filter(Boolean); // ["api", "gym", "members", ":id"]
      const resource = segments[1] || "unknown";
      const resourceId = (req.params && req.params.id) || (req.body && !Buffer.isBuffer(req.body) && typeof req.body === "object" && req.body.id) || null;

      const body = req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body) ? redact(req.body) : undefined;

      AuditLog.create({
        userId: req.user.userId,
        tenantId: req.tenantId || null,
        action: actionFor(req.method),
        resource,
        resourceId: resourceId ? String(resourceId) : undefined,
        newValues: body,
        ipAddress: req.ip,
      }).catch(() => {});
    } catch {
      // never let auditing break the request
    }
  });

  next();
}

module.exports = auditLog;
