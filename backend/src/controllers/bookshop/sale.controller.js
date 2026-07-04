"use strict";

const { z } = require("zod");
const { Sale, SaleItem, Book, BookCustomer, LoyaltyPoint } = require("../../models");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");
const { invoiceRef } = require("../../utils/ids");

const createSchema = z.object({
  customerId: z.string().optional(),
  discount: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "JAZZCASH", "EASYPAISA"]).optional(),
  items: z.array(z.object({ bookId: z.string(), quantity: z.number().int().positive() })).min(1),
});

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const tenantId = req.tenantId;

  const bookIds = data.items.map((i) => i.bookId);
  const books = await Book.find({ _id: { $in: bookIds }, tenantId });
  const byId = new Map(books.map((b) => [String(b._id), b]));
  if (byId.size !== new Set(bookIds).size) throw ApiError.badRequest("One or more books are invalid");

  // Validate stock before mutating anything.
  for (const i of data.items) {
    const b = byId.get(i.bookId);
    if (b.quantity < i.quantity) throw ApiError.badRequest(`Insufficient stock for "${b.title}"`);
  }

  let subtotal = 0;
  const lineItems = data.items.map((i) => {
    const b = byId.get(i.bookId);
    const unitPrice = Number(b.price);
    const total = unitPrice * i.quantity;
    subtotal += total;
    return { tenantId, bookId: b._id, quantity: i.quantity, unitPrice, total };
  });

  const discount = Number(data.discount || 0);
  const total = subtotal - discount;

  const sale = await Sale.create({
    tenantId,
    invoiceNo: invoiceRef("SALE"),
    customerId: data.customerId || null,
    subtotal,
    discount,
    total,
    paymentMethod: data.paymentMethod || "CASH",
  });

  await SaleItem.insertMany(lineItems.map((li) => ({ ...li, saleId: sale._id })));

  // Decrement stock.
  for (const i of data.items) {
    await Book.updateOne({ _id: i.bookId, tenantId }, { $inc: { quantity: -i.quantity } });
  }

  // Loyalty: 1 point per 100 spent.
  if (data.customerId) {
    const points = Math.floor(total / 100);
    if (points > 0) {
      await BookCustomer.updateOne({ _id: data.customerId, tenantId }, { $inc: { loyaltyPoints: points } });
      await LoyaltyPoint.create({ tenantId, customerId: data.customerId, points, type: "EARNED", description: `Sale ${sale.invoiceNo}` });
    }
  }

  return apiSuccess(res, { sale: sale.toObject() }, 201);
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const filter = { tenantId: req.tenantId };
  if (req.query.customerId) filter.customerId = req.query.customerId;
  const [rows, total] = await Promise.all([
    Sale.find(filter)
      .populate("customer", "name phone")
      .populate({ path: "saleItems", populate: { path: "book", select: "title author" } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Sale.countDocuments(filter),
  ]);
  return apiSuccess(res, { sales: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate("customer", "name phone")
    .populate({ path: "saleItems", populate: { path: "book", select: "title author" } })
    .lean({ virtuals: true });
  if (!sale) throw ApiError.notFound("Sale not found");
  return apiSuccess(res, { sale });
});

module.exports = { create, list, getOne };
