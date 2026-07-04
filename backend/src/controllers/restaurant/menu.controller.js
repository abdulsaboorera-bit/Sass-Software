"use strict";

const { MenuCategory, MenuItem } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

/** GET /api/restaurant/menu -> { categories: [{ ..., menuItems: [...] }] } */
const list = asyncHandler(async (req, res) => {
  const categories = await MenuCategory.find({ tenantId: req.tenantId })
    .sort({ sortOrder: 1 })
    .populate({ path: "menuItems", options: { sort: { name: 1 } } })
    .lean({ virtuals: true });
  return apiSuccess(res, { categories });
});

/** POST body { type: "category"|"item", ... } -> { category } | { item } */
const create = asyncHandler(async (req, res) => {
  const { type, ...data } = req.body;
  if (type === "item") {
    const item = await MenuItem.create({ tenantId: req.tenantId, ...data });
    return apiSuccess(res, { item }, 201);
  }
  const category = await MenuCategory.create({ tenantId: req.tenantId, name: data.name, sortOrder: data.sortOrder });
  return apiSuccess(res, { category }, 201);
});

/** PATCH body { id, type, ... } -> { category } | { item } */
const update = asyncHandler(async (req, res) => {
  const { id, type, ...data } = req.body;
  if (!id) throw ApiError.badRequest("id is required");
  if (type === "item") {
    const item = await MenuItem.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, data, { new: true });
    if (!item) throw ApiError.notFound("Menu item not found");
    return apiSuccess(res, { item });
  }
  const category = await MenuCategory.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, data, { new: true });
  if (!category) throw ApiError.notFound("Category not found");
  return apiSuccess(res, { category });
});

/** DELETE ?id=&type=category|item -> { success } */
const remove = asyncHandler(async (req, res) => {
  const { id, type } = req.query;
  if (!id) throw ApiError.badRequest("id is required");
  if (type === "item") {
    await MenuItem.deleteOne({ _id: id, tenantId: req.tenantId });
  } else {
    await MenuItem.deleteMany({ categoryId: id, tenantId: req.tenantId });
    await MenuCategory.deleteOne({ _id: id, tenantId: req.tenantId });
  }
  return apiSuccess(res, { success: true, message: "Deleted" });
});

module.exports = { list, create, update, remove };
