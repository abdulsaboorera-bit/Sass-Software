"use strict";

const { z } = require("zod");
const trainerService = require("../../services/gym/trainer.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate, boolParam } = require("../../utils/query");

const createSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  specialization: z.string().optional(),
  fee: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  userId: z.string().optional(),
  maxMembers: z.number().int().nonnegative().optional(),
});

const updateSchema = createSchema.partial();
const assignSchema = z.object({ memberId: z.string().min(1) });

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query, { defaultLimit: 200 });
  const result = await trainerService.list({
    tenantId: req.tenantId,
    isActive: boolParam(req.query.isActive),
    page,
    limit,
  });
  return apiSuccess(res, result);
});

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const trainer = await trainerService.create({ tenantId: req.tenantId, data });
  return apiSuccess(res, { trainer }, 201);
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id; // /:id or collection PATCH (id in body)
  const data = updateSchema.parse(req.body);
  const trainer = await trainerService.update({ tenantId: req.tenantId, id, data });
  return apiSuccess(res, { trainer });
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id; // /:id or DELETE ?id=
  const result = await trainerService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const assignMember = asyncHandler(async (req, res) => {
  const { memberId } = assignSchema.parse(req.body);
  const result = await trainerService.assignMember({ tenantId: req.tenantId, trainerId: req.params.id, memberId });
  return apiSuccess(res, result);
});

const unassignMember = asyncHandler(async (req, res) => {
  const result = await trainerService.unassignMember({ tenantId: req.tenantId, memberId: req.params.memberId });
  return apiSuccess(res, result);
});

const assignedMembers = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await trainerService.assignedMembers({ tenantId: req.tenantId, trainerId: req.params.id, page, limit });
  return apiSuccess(res, result);
});

const selfMembers = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await trainerService.selfMembers({ tenantId: req.tenantId, userId: req.user.userId, page, limit });
  return apiSuccess(res, result);
});

const workload = asyncHandler(async (req, res) => {
  const result = await trainerService.workload({ tenantId: req.tenantId, trainerId: req.params.id });
  return apiSuccess(res, result);
});

const workloadAll = asyncHandler(async (req, res) => {
  const result = await trainerService.workloadAll({ tenantId: req.tenantId });
  return apiSuccess(res, { workload: result });
});

module.exports = {
  list,
  create,
  update,
  remove,
  assignMember,
  unassignMember,
  assignedMembers,
  selfMembers,
  workload,
  workloadAll,
};
