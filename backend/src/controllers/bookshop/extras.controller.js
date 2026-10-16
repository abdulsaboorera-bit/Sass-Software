"use strict";

const { Book, BookshopSettings } = require("../../models");
const { apiSuccess, ApiError } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const OPENLIBRARY = "https://openlibrary.org/isbn/{isbn}.json";

/** GET /api/bookshop/isbn/:isbn — lookup book by ISBN (local first, fallback to OpenLibrary). */
const isbnLookup = asyncHandler(async (req, res) => {
  const isbn = (req.params.isbn || "").trim();
  if (!isbn) throw ApiError.badRequest("ISBN is required");

  const existing = await Book.findOne({ tenantId: req.tenantId, isbn }).lean();
  if (existing) return apiSuccess(res, { found: true, source: "local", book: existing });

  try {
    const url = OPENLIBRARY.replace("{isbn}", encodeURIComponent(isbn));
    const r = await fetch(url, { headers: { "User-Agent": "nexus-saas/1.0" } });
    if (!r.ok) return apiSuccess(res, { found: false });
    const data = await r.json();
    const book = {
      isbn,
      title: data.title || "",
      author: Array.isArray(data.authors) ? data.authors.map((a) => a.name).join(", ") : "",
      publisher: Array.isArray(data.publishers) ? data.publishers.map((p) => p.name).join(", ") : "",
    };
    const settings = await BookshopSettings.findOne({ tenantId: req.tenantId }).select("lowStockThreshold").lean();
    return apiSuccess(res, {
      found: true,
      source: "openlibrary",
      book,
      suggested: {
        price: 0,
        costPrice: 0,
        quantity: 0,
        minStock: settings?.lowStockThreshold ?? 5,
      },
    });
  } catch {
    return apiSuccess(res, { found: false });
  }
});

module.exports = { isbnLookup };
