"use strict";

const express = require("express");
const { ApiError, apiSuccess } = require("./apiResponse");
const asyncHandler = require("./asyncHandler");
const { paginate } = require("./query");
const { requirePermission } = require("../middleware/rbac");

const PROTECTED = new Set(["_id", "id", "tenantId", "createdAt", "updatedAt", "__v"]);

/** Strip fields a client must never set directly. */
function sanitize(body) {
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (PROTECTED.has(k)) continue;
    if (k.startsWith("$") || k.includes(".")) throw ApiError.badRequest("Invalid field name");
    out[k] = sanitizeValue(v);
  }
  return out;
}

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".")) throw ApiError.badRequest("Invalid nested field name");
    out[key] = sanitizeValue(nested);
  }
  return out;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tenant-scoped, permission-guarded CRUD router that reproduces the EXACT
 * response contract of the previous Next.js/Prisma routes, so the existing
 * frontend pages work unchanged through the `/api/*` proxy:
 *
 *   GET    /        -> { [listKey]: rows, pagination? }
 *   POST   /        -> { [itemKey]: doc }                    (201)
 *   PATCH  /        -> { [itemKey]: doc }   (id in body)     // collection style
 *   DELETE /?id=    -> { success: true }                     // collection style
 *   GET    /:id     -> { [itemKey]: doc }
 *   PATCH  /:id     -> { [itemKey]: doc }                    // REST style
 *   DELETE /:id     -> { success: true }                     // REST style
 *
 * Both the collection style (gym/restaurant/bookshop pages) and the REST style
 * (clinic/school detail pages) are registered, so every page's convention works.
 */
function makeCrudRouter({
  model,
  permission,
  listKey,
  itemKey,
  paginated = true,
  searchFields = [],
  populate = [],
  sort = { createdAt: -1 },
  filterFields = [],
  beforeCreate,
  beforeUpdate,
  afterCreate,
  decorateRows, // async (rows, req) => rows  (e.g. add _count)
  perms = {},
}) {
  const router = express.Router();
  const key = itemKey || model.modelName.toLowerCase();
  const keyPlural = listKey || `${key}s`;

  const P = {
    view: perms.view || `${permission}.view`,
    create: perms.create || `${permission}.create`,
    edit: perms.edit || `${permission}.edit`,
    remove: perms.remove || perms.edit || `${permission}.edit`,
  };

  const applyPopulate = (q) => populate.reduce((acc, p) => acc.populate(p), q);

  const buildFilter = (req) => {
    const filter = { tenantId: req.tenantId };
    if (req.query.search && searchFields.length) {
      filter.$or = searchFields.map((f) => ({ [f]: { $regex: escapeRegex(req.query.search), $options: "i" } }));
    }
    for (const f of filterFields) {
      if (req.query[f] !== undefined && req.query[f] !== "") filter[f] = req.query[f];
    }
    return filter;
  };

  const list = asyncHandler(async (req, res) => {
    const filter = buildFilter(req);

    if (!paginated) {
      let rows = await applyPopulate(model.find(filter)).sort(sort).lean({ virtuals: true });
      if (decorateRows) rows = await decorateRows(rows, req);
      return apiSuccess(res, { [keyPlural]: rows });
    }

    const { page, limit } = paginate(req.query, { maxLimit: 1000 });
    let [rows, total] = await Promise.all([
      applyPopulate(model.find(filter)).sort(sort).skip((page - 1) * limit).limit(limit).lean({ virtuals: true }),
      model.countDocuments(filter),
    ]);
    if (decorateRows) rows = await decorateRows(rows, req);
    return apiSuccess(res, { [keyPlural]: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await applyPopulate(model.findOne({ _id: req.params.id, tenantId: req.tenantId })).lean({ virtuals: true });
    if (!doc) throw ApiError.notFound(`${model.modelName} not found`);
    return apiSuccess(res, { [key]: doc });
  });

  const create = asyncHandler(async (req, res) => {
    let payload = { ...sanitize(req.body), tenantId: req.tenantId };
    if (beforeCreate) payload = (await beforeCreate(payload, req)) || payload;
    const doc = await model.create(payload);
    if (afterCreate) await afterCreate(doc, req);
    return apiSuccess(res, { [key]: doc }, 201);
  });

  const doUpdate = async (id, req) => {
    let updates = sanitize(req.body);
    if (beforeUpdate) updates = (await beforeUpdate(updates, req)) || updates;
    const doc = await model.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      updates,
      { new: true, runValidators: true }
    );
    if (!doc) throw ApiError.notFound(`${model.modelName} not found`);
    return doc;
  };

  const updateBody = asyncHandler(async (req, res) => {
    const id = req.body.id;
    if (!id) throw ApiError.badRequest("id is required");
    return apiSuccess(res, { [key]: await doUpdate(id, req) });
  });
  const updateParam = asyncHandler(async (req, res) =>
    apiSuccess(res, { [key]: await doUpdate(req.params.id, req) })
  );

  const doDelete = async (id, req) => {
    const doc = await model.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!doc) throw ApiError.notFound(`${model.modelName} not found`);
  };
  const removeQuery = asyncHandler(async (req, res) => {
    const id = req.query.id;
    if (!id) throw ApiError.badRequest("id is required");
    await doDelete(id, req);
    return apiSuccess(res, { success: true });
  });
  const removeParam = asyncHandler(async (req, res) => {
    await doDelete(req.params.id, req);
    return apiSuccess(res, { success: true });
  });

  // Collection style (id in body / query)
  router.get("/", requirePermission(P.view), list);
  router.post("/", requirePermission(P.create), create);
  router.patch("/", requirePermission(P.edit), updateBody);
  router.delete("/", requirePermission(P.remove), removeQuery);
  // REST style (/:id)
  router.get("/:id", requirePermission(P.view), getOne);
  router.patch("/:id", requirePermission(P.edit), updateParam);
  router.put("/:id", requirePermission(P.edit), updateParam);
  router.delete("/:id", requirePermission(P.remove), removeParam);

  return router;
}

module.exports = { makeCrudRouter, sanitize };
