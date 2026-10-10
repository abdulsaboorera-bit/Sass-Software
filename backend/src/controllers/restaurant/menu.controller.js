"use strict";

const { z } = require("zod");
const { MenuCategory, MenuItem, RestaurantInventoryItem } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const categorySchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

const modifierSchema = z.object({ name: z.string().min(1), price: z.number().nonnegative().optional() });

const recipeLineSchema = z.object({ inventoryItemId: z.string().min(1), quantity: z.number().positive() });

const itemSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().optional(),
  imageUrl: z.string().optional(),
  preparationTime: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
  modifiers: z.array(modifierSchema).optional(),
  recipe: z.array(recipeLineSchema).optional(),
  sellWithoutStock: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === "true";
  const catFilter = { tenantId: req.tenantId };
  const itemFilter = { tenantId: req.tenantId };
  if (!includeInactive) {
    catFilter.isActive = true;
    itemFilter.isActive = true;
  }
  const categories = await MenuCategory.find(catFilter)
    .sort({ sortOrder: 1, name: 1 })
    .populate({ path: "menuItems", match: itemFilter, options: { sort: { name: 1 } } })
    .lean({ virtuals: true });
  return apiSuccess(res, { categories });
});

const create = asyncHandler(async (req, res) => {
  const { type, ...data } = req.body;
  if (type === "item") {
    const parsed = itemSchema.parse(data);
    if (!(await MenuCategory.exists({ _id: parsed.categoryId, tenantId: req.tenantId }))) throw ApiError.badRequest("Invalid category");
    if (parsed.recipe && parsed.recipe.length) {
      const ids = parsed.recipe.map((r) => r.inventoryItemId);
      const found = await RestaurantInventoryItem.countDocuments({ _id: { $in: ids }, tenantId: req.tenantId });
      if (found !== new Set(ids).size) throw ApiError.badRequest("One or more recipe ingredients are invalid");
    }
    const item = await MenuItem.create({ tenantId: req.tenantId, ...parsed });
    return apiSuccess(res, { item }, 201);
  }
  const parsed = categorySchema.parse(data);
  const category = await MenuCategory.create({ tenantId: req.tenantId, ...parsed });
  return apiSuccess(res, { category }, 201);
});

const update = asyncHandler(async (req, res) => {
  const { id, type, ...data } = req.body;
  if (!id) throw ApiError.badRequest("id is required");
  if (type === "item") {
    const parsed = itemSchema.partial().parse(data);
    if (parsed.categoryId && !(await MenuCategory.exists({ _id: parsed.categoryId, tenantId: req.tenantId }))) throw ApiError.badRequest("Invalid category");
    if (parsed.recipe && parsed.recipe.length) {
      const ids = parsed.recipe.map((r) => r.inventoryItemId);
      const found = await RestaurantInventoryItem.countDocuments({ _id: { $in: ids }, tenantId: req.tenantId });
      if (found !== new Set(ids).size) throw ApiError.badRequest("One or more recipe ingredients are invalid");
    }
    const item = await MenuItem.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, parsed, { new: true, runValidators: true });
    if (!item) throw ApiError.notFound("Menu item not found");
    return apiSuccess(res, { item });
  }
  const parsed = categorySchema.partial().parse(data);
  const category = await MenuCategory.findOneAndUpdate({ _id: id, tenantId: req.tenantId }, parsed, { new: true, runValidators: true });
  if (!category) throw ApiError.notFound("Category not found");
  return apiSuccess(res, { category });
});

const remove = asyncHandler(async (req, res) => {
  const { id, type } = req.query;
  if (!id) throw ApiError.badRequest("id is required");
  if (type === "item") {
    const item = await MenuItem.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!item) throw ApiError.notFound("Menu item not found");
  } else {
    await MenuItem.deleteMany({ categoryId: id, tenantId: req.tenantId });
    const category = await MenuCategory.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!category) throw ApiError.notFound("Category not found");
  }
  return apiSuccess(res, { success: true, message: "Deleted" });
});

module.exports = { list, create, update, remove };