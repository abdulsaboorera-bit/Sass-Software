"use strict";

/**
 * Shared Mongoose plumbing so every model serialises the way the frontend
 * already expects from the old Prisma layer: `id` (string) instead of `_id`,
 * no `__v`, and ISO timestamps. Apply via `schema.plugin(idPlugin)` or by
 * spreading `baseOptions` into the Schema constructor.
 *
 * Note: `.lean()` results keep `_id` internally (service code relies on it);
 * the `_id` -> `id` normalisation for lean payloads happens once at the HTTP
 * boundary in `apiSuccess` (see utils/apiResponse.js), not in the data layer.
 */

function transform(_doc, ret) {
  ret.id = ret._id != null ? String(ret._id) : ret.id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

const baseOptions = {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false, transform },
  toObject: { virtuals: true, versionKey: false, transform },
};

function idPlugin(schema) {
  schema.set("toJSON", baseOptions.toJSON);
  schema.set("toObject", baseOptions.toObject);
}

module.exports = { baseOptions, idPlugin, transform };
