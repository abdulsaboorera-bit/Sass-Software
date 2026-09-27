"use strict";

/** Platform subscription packages — single source of truth for pricing/duration. */
const PLANS = {
  MONTHLY: { label: "1 Month", days: 30, amount: 11 },
  SEMIANNUAL: { label: "6 Months", days: 182, amount: 52 },
  ANNUAL: { label: "1 Year", days: 365, amount: 105 },
};

module.exports = { PLANS };
