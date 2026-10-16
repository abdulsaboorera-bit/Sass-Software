"use strict";

const { Tenant, Booking, MenuCategory, MenuItem, RestaurantSettings, Property, PropertyUnit } = require("../models");
const { ApiError, apiSuccess } = require("../utils/apiResponse");
const { sanitize } = require("../utils/crud");

/**
 * Public (unauthenticated) endpoints backing the per-tenant booking page.
 * The tenant is identified by its slug in the URL, so visitors need no account.
 */

async function loadTenant(slug) {
  const tenant = await Tenant.findOne({ slug: String(slug).toLowerCase() })
    .select("name slug industry status currency timezone logo")
    .lean();
  if (!tenant) throw ApiError.notFound("Business not found");
  if (!["ACTIVE", "TRIAL"].includes(tenant.status)) throw ApiError.forbidden("This business is not accepting requests");
  return tenant;
}

/** GET /api/public/:slug/info — public business profile for the booking page. */
async function info(req, res) {
  const tenant = await loadTenant(req.params.slug);
  return apiSuccess(res, { tenant });
}

/** POST /api/public/:slug/bookings — submit a booking/lead/contact request. */
async function submit(req, res) {
  const tenant = await loadTenant(req.params.slug);
  const body = req.body || {};
  const name = (body.name || "").trim();
  if (!name) throw ApiError.badRequest("Your name is required");
  if (!body.phone && !body.email) throw ApiError.badRequest("Provide a phone number or email so we can reach you");

  const payload = sanitize({
    type: ["BOOKING", "LEAD", "CONTACT"].includes(body.type) ? body.type : "BOOKING",
    name,
    phone: body.phone,
    email: body.email,
    service: body.service,
    message: body.message,
    preferredDate: body.preferredDate,
    preferredTime: body.preferredTime,
    partySize: body.partySize,
    data: body.data,
    source: "PUBLIC_PAGE",
  });

  const booking = await Booking.create({ ...payload, tenantId: tenant._id });
  return apiSuccess(res, { success: true, id: booking._id }, 201);
}

/** GET /api/public/:slug/menu — public QR-menu for restaurants. */
async function menu(req, res) {
  const tenant = await loadTenant(req.params.slug);
  if (tenant.industry !== "RESTAURANT") throw ApiError.notFound("Menu not available");

  const [categories, settings] = await Promise.all([
    MenuCategory.find({ tenantId: tenant._id, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .populate({
        path: "menuItems",
        match: { isActive: true, isAvailable: true },
        select: "name description price imageUrl preparationTime tags isVegetarian isVegan isSpicy allergens modifiers",
        options: { sort: { name: 1 } },
      })
      .lean({ virtuals: true }),
    RestaurantSettings.findOne({ tenantId: tenant._id })
      .select("restaurantName tagline phone address currency logo operatingHours")
      .lean(),
  ]);

  const visible = categories.filter((c) => Array.isArray(c.menuItems) && c.menuItems.length);
  return apiSuccess(res, { tenant, settings: settings || {}, categories: visible });
}

/** GET /api/public/:slug/listings — public property/unit availability for real estate. */
async function listings(req, res) {
  const tenant = await loadTenant(req.params.slug);
  if (tenant.industry !== "REAL_ESTATE") throw ApiError.notFound("Listings not available");

  const properties = await Property.find({ tenantId: tenant._id, isActive: true })
    .select("name address city type description pictures")
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });

  const units = await PropertyUnit.find({ tenantId: tenant._id, isActive: true, status: "VACANT" })
    .select("propertyId unitNo floor type bedrooms bathrooms areaSqft rentAmount")
    .sort({ rentAmount: 1 })
    .lean({ virtuals: true });

  const byProperty = new Map();
  for (const u of units) {
    const key = String(u.propertyId);
    if (!byProperty.has(key)) byProperty.set(key, []);
    byProperty.get(key).push(u);
  }

  const result = properties
    .map((p) => ({ ...p, availableUnits: byProperty.get(String(p._id)) || [] }))
    .filter((p) => p.availableUnits.length);

  return apiSuccess(res, { tenant, count: result.length, properties: result });
}

module.exports = { info, submit, menu, listings };
