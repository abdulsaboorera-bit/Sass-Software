"use strict";

/**
 * Typed application error. Controllers/services throw these and the
 * central error middleware converts them into JSON responses.
 * Mirrors the shape the old Next.js routes returned: { error: message }.
 */
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (details) this.details = details;
  }

  static badRequest(msg = "Bad request", details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = "Not authenticated") {
    return new ApiError(401, msg);
  }
  static forbidden(msg = "Permission denied") {
    return new ApiError(403, msg);
  }
  static notFound(msg = "Not found") {
    return new ApiError(404, msg);
  }
  static conflict(msg = "Conflict") {
    return new ApiError(409, msg);
  }
}

/**
 * Recursively rename Mongo's `_id` -> `id` and drop `__v` on a plain object
 * tree. Runs only at the HTTP boundary so internal code can keep using `_id`.
 */
function normalizeIds(node) {
  if (Array.isArray(node)) {
    node.forEach(normalizeIds);
    return;
  }
  if (node && typeof node === "object") {
    if (node._id !== undefined && node.id === undefined) node.id = node._id;
    delete node._id;
    delete node.__v;
    for (const key of Object.keys(node)) normalizeIds(node[key]);
  }
}

/**
 * Success responder. Serialises the payload once (which triggers Mongoose
 * document toJSON transforms), then normalises any remaining `_id` from lean
 * results — so every response exposes `id`, matching the previous Prisma shape.
 */
function apiSuccess(res, data, status = 200) {
  const plain = data === undefined ? null : JSON.parse(JSON.stringify(data));
  if (plain && typeof plain === "object") normalizeIds(plain);
  return res.status(status).json(plain);
}

module.exports = { ApiError, apiSuccess };
