"use strict";

const express = require("express");
const { requireAuth, requireTenant } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/data.controller");

const router = express.Router();

router.use(requireAuth, requireTenant);

// Datasets available to the current tenant.
router.get("/", asyncHandler(ctrl.list));

// Generic export (CSV / PDF) and CSV import keyed by dataset id, e.g. "gym.members".
router.get("/:key/export.csv", asyncHandler(ctrl.exportCsv));
router.get("/:key/export.pdf", asyncHandler(ctrl.exportPdf));
router.post(
  "/:key/import",
  express.text({ type: ["text/csv", "text/plain", "application/csv"], limit: "5mb" }),
  asyncHandler(ctrl.importCsv)
);

module.exports = router;
