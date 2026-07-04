"use strict";

/** Parse common pagination params with sane bounds. */
function paginate(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || defaultLimit;
  limit = Math.min(Math.max(1, limit), maxLimit);
  return { page, limit };
}

/** Coerce a query string to boolean, or undefined when absent. */
function boolParam(v) {
  if (v === undefined) return undefined;
  return v === "true" || v === "1";
}

module.exports = { paginate, boolParam };
