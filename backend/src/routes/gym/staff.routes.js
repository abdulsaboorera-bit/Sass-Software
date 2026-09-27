"use strict";

const { makeCrudRouter } = require("../../utils/crud");
const { Staff } = require("../../models");

module.exports = makeCrudRouter({
  model: Staff,
  permission: "staff",
  listKey: "staff",
  itemKey: "staff",
  paginated: false,
  searchFields: ["name", "phone"],
  filterFields: ["isActive"],
  sort: { name: 1 },
});
