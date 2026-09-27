"use strict";

const { z } = require("zod");
const memberService = require("../../services/gym/member.service");
const { apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { paginate } = require("../../utils/query");

const createSchema = z.object({
  memberNo: z.string().min(1).optional(),
  name: z.string().min(2),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  planId: z.string().min(1),
  trainerId: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  photo: z.string().optional(),
  startDate: z.string().optional(),
  note: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  planId: z.string().optional(),
  trainerId: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "FROZEN", "CANCELLED"]).optional(),
  freezeReason: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().nullable().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  photo: z.string().optional(),
  note: z.string().optional(),
});

const renewSchema = z.object({
  planId: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  dueDate: z.string().optional(),
  createInvoice: z.boolean().optional(),
});

const actor = (req) => ({ userId: req.user.userId, name: req.user.name });

const list = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const result = await memberService.list({
    tenantId: req.tenantId,
    page,
    limit,
    search: req.query.search,
    status: req.query.status,
    planId: req.query.planId,
    trainerId: req.query.trainerId,
    trainerScope: req.memberScope, // set by memberViewScope middleware
  });
  return apiSuccess(res, result);
});

const getOne = asyncHandler(async (req, res) => {
  const member = await memberService.getById({
    tenantId: req.tenantId,
    id: req.params.id,
    trainerScope: req.memberScope,
  });
  return apiSuccess(res, { member });
});

const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const member = await memberService.create({ tenantId: req.tenantId, data, actor: actor(req) });
  return apiSuccess(res, { member }, 201);
});

const update = asyncHandler(async (req, res) => {
  const id = req.params.id || req.body.id; // supports /:id and collection PATCH (id in body)
  const data = updateSchema.parse(req.body);
  const member = await memberService.update({ tenantId: req.tenantId, id, data, actor: actor(req) });
  return apiSuccess(res, { member });
});

const addNote = asyncHandler(async (req, res) => {
  const { note } = z.object({ note: z.string().min(1) }).parse(req.body);
  const member = await memberService.addNote({ tenantId: req.tenantId, id: req.params.id, note, actor: actor(req) });
  return apiSuccess(res, { member });
});

const renew = asyncHandler(async (req, res) => {
  const data = renewSchema.parse(req.body);
  const result = await memberService.renew({ tenantId: req.tenantId, id: req.params.id, data, actor: actor(req) });
  return apiSuccess(res, result);
});

const remove = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id; // supports /:id and DELETE ?id=
  const result = await memberService.remove({ tenantId: req.tenantId, id });
  return apiSuccess(res, result);
});

const payments = asyncHandler(async (req, res) => {
  const history = await memberService.paymentHistory({ tenantId: req.tenantId, id: req.params.id, trainerScope: req.memberScope });
  return apiSuccess(res, { payments: history });
});

module.exports = { list, getOne, create, update, addNote, renew, remove, payments };
