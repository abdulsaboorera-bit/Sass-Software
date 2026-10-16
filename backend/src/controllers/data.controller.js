"use strict";

const { loadMembership } = require("../middleware/auth");
const { permits } = require("../middleware/rbac");
const { ApiError, apiSuccess } = require("../utils/apiResponse");
const { Tenant } = require("../models");
const datasets = require("../services/datasets.service");

/** Resolve the caller's permission set (or ["*"] for platform super admins). */
async function permSet(req) {
  const membership = await loadMembership(req);
  if (!membership) {
    if (req.user.role === "SUPER_ADMIN" && !req.user.tenantId) return ["*"];
    return [];
  }
  return membership.role ? membership.role.permissions : [];
}

/** Load a dataset, enforcing that it belongs to the caller's industry + permission. */
async function loadDataset(req, permission) {
  const entry = datasets.resolve(req.params.key);
  if (entry.industry !== req.tenant.industry) {
    throw ApiError.forbidden("This dataset is not available for your industry");
  }
  const perms = await permSet(req);
  if (!permits(perms, permission)) throw ApiError.forbidden();
  return entry;
}

/** GET /api/data — datasets available to the current tenant. */
async function list(req, res) {
  const perms = await permSet(req);
  const items = datasets
    .listForIndustry(req.tenant.industry)
    .map((item) => {
      const entry = datasets.resolve(item.key);
      return {
        ...item,
        canExport: permits(perms, entry.viewPerm),
        canImport: Boolean(item.importable && entry.createPerm && permits(perms, entry.createPerm)),
      };
    })
    .filter((item) => item.canExport);
  return apiSuccess(res, { datasets: items });
}

/** GET /api/data/:key/export.csv */
async function exportCsv(req, res) {
  const entry = await loadDataset(req, datasets.resolve(req.params.key).viewPerm);
  const { filename, csv } = await datasets.buildCsv(entry.key, req.tenantId, req.query);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(csv);
}

/** GET /api/data/:key/export.pdf */
async function exportPdf(req, res) {
  const entry = await loadDataset(req, datasets.resolve(req.params.key).viewPerm);
  const tenant = await Tenant.findById(req.tenantId).select("name").lean();
  return datasets.streamPdf(entry.key, req.tenantId, tenant && tenant.name, res, req.query);
}

/** POST /api/data/:key/import  (text/csv body or JSON { csv }) */
async function importCsv(req, res) {
  const entry = datasets.resolve(req.params.key);
  if (!entry.createPerm) throw ApiError.badRequest("This dataset does not support import");
  await loadDataset(req, entry.createPerm);

  const body = req.body;
  const csv = typeof body === "string" ? body : body && body.csv;
  if (!csv || typeof csv !== "string") throw ApiError.badRequest("Provide CSV content as text/csv or JSON { csv }");

  const result = await datasets.importCsv(entry.key, req.tenantId, csv);
  return apiSuccess(res, { result });
}

module.exports = { list, exportCsv, exportPdf, importCsv };
