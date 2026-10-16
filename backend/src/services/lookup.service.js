"use strict";

const models = require("../models");
const { permits } = require("../middleware/rbac");
const { ApiError } = require("../utils/apiResponse");

/**
 * Barcode/QR lookup registry. Maps a scan code field to the model + the
 * permission required to view it, per industry. Used by the "scan a code"
 * feature on the frontend (camera or USB scanner) to jump straight to a record.
 */
const LOOKUPS = {
  GYM: [
    { code: "memberNo", model: "Member", perm: "members.view", label: "Member", title: "name" },
    { code: "invoiceRef", model: "GymInvoice", perm: "billing.view", label: "Invoice", title: "invoiceRef" },
  ],
  SCHOOL: [
    { code: "admissionNo", model: "Student", perm: "students.view", label: "Student", title: "name" },
  ],
  CLINIC: [
    { code: "patientNo", model: "Patient", perm: "patients.view", label: "Patient", title: "name" },
  ],
  RESTAURANT: [
    { code: "customerNo", model: "RestaurantCustomer", perm: "customers.view", label: "Customer", title: "name" },
  ],
  BOOKSHOP: [
    { code: "isbn", model: "Book", perm: "inventory.view", label: "Book", title: "title" },
  ],
  CAR_RENTAL: [
    { code: "registrationNo", model: "Car", perm: "cars.view", label: "Car", title: "name" },
  ],
  REAL_ESTATE: [
    { code: "unitNo", model: "PropertyUnit", perm: "units.view", label: "Unit", title: "unitNo" },
  ],
  SALON: [
    { code: "customerNo", model: "SalonCustomer", perm: "customers.view", label: "Customer", title: "name" },
  ],
};

/**
 * Resolve a scanned code to a record within the tenant's industry. Tries each
 * registered lookup for the industry that the user is permitted to view.
 */
async function lookup({ tenantId, industry, permissions, code }) {
  const value = String(code || "").trim();
  if (!value) throw ApiError.badRequest("code is required");

  const strategies = LOOKUPS[industry] || [];
  for (const s of strategies) {
    if (!permits(permissions, s.perm)) continue;
    const Model = models[s.model];
    if (!Model) continue;
    // eslint-disable-next-line no-await-in-loop
    const doc = await Model.findOne({ tenantId, [s.code]: value }).lean();
    if (doc) {
      return {
        type: s.model,
        label: s.label,
        title: doc[s.title] || value,
        value,
        item: doc,
      };
    }
  }
  return null;
}

module.exports = { lookup, LOOKUPS };
