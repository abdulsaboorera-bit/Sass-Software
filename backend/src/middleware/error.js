"use strict";

const { ZodError } = require("zod");
const { ApiError } = require("../utils/apiResponse");

/** 404 fallthrough for unmatched routes. */
function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Central error handler. Normalises the various error shapes
 * (ApiError, ZodError, Mongoose validation/duplicate-key) into the
 * `{ error: message }` JSON contract the frontend already expects.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Explicit application errors
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  }

  // Zod validation — surface the first issue message (matches old behaviour)
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0].message, issues: err.issues });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path}` });
  }

  // Mongoose schema validation
  if (err.name === "ValidationError") {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ error: first ? first.message : "Validation failed" });
  }

  // Duplicate key (unique index) — e.g. duplicate memberNo / invoiceNo
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(", ");
    return res.status(409).json({ error: `Duplicate value for ${field || "unique field"}` });
  }

  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = { notFoundHandler, errorHandler };
