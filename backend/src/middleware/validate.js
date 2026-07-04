"use strict";

/**
 * Validate a request part against a Zod schema and replace it with the
 * parsed (typed/coerced) value. Throws ZodError which the error handler
 * turns into a 400 with the first issue message.
 *
 *   router.post("/", validate(schema), handler)          // body (default)
 *   router.get("/", validate(qSchema, "query"), handler) // query
 */
function validate(schema, source = "body") {
  return (req, _res, next) => {
    const parsed = schema.parse(req[source]);
    // req.query is a read-only getter on some Express versions; assign safely.
    if (source === "query") {
      req.validatedQuery = parsed;
    } else {
      req[source] = parsed;
    }
    next();
  };
}

module.exports = validate;
