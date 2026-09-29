"use strict";

const mongoose = require("mongoose");
const { Trainer, Member, Session } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function list({ tenantId, isActive, page = 1, limit = 20 }) {
  const filter = { tenantId };
  if (isActive !== undefined) filter.isActive = isActive;
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Trainer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Trainer.countDocuments(filter),
  ]);

  // Attach real member counts (lean() doesn't resolve ref virtuals)
  const trainerIds = rows.map((r) => r._id);
  const counts = await Member.aggregate([
    { $match: { tenantId: oid(tenantId), trainerId: { $in: trainerIds } } },
    {
      $group: {
        _id: "$trainerId",
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
      },
    },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c]));
  for (const r of rows) {
    const c = countMap.get(String(r._id)) || { total: 0, active: 0 };
    r.assignedMembers = c.total;
    r.activeMembers = c.active;
  }

  return { trainers: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function create({ tenantId, data }) {
  if (await Trainer.exists({ tenantId, phone: data.phone })) throw ApiError.conflict("A trainer with this phone already exists");
  return (await Trainer.create({ tenantId, ...data })).toObject();
}

async function update({ tenantId, id, data }) {
  if (data.phone && await Trainer.exists({ tenantId, phone: data.phone, _id: { $ne: id } })) throw ApiError.conflict("A trainer with this phone already exists");
  const trainer = await Trainer.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true }).lean({ virtuals: true });
  if (!trainer) throw ApiError.notFound("Trainer not found");
  return trainer;
}

async function remove({ tenantId, id }) {
  const trainer = await Trainer.findOne({ _id: id, tenantId });
  if (!trainer) throw ApiError.notFound("Trainer not found");
  // Detach members before deletion so none are orphaned to a missing trainer.
  await Member.updateMany({ tenantId, trainerId: id }, { $set: { trainerId: null } });
  await trainer.deleteOne();
  return { success: true };
}

/** Assign a member to a trainer (respecting maxMembers if set). */
async function assignMember({ tenantId, trainerId, memberId }) {
  const trainer = await Trainer.findOne({ _id: trainerId, tenantId });
  if (!trainer) throw ApiError.notFound("Trainer not found");
  const member = await Member.findOne({ _id: memberId, tenantId });
  if (!member) throw ApiError.notFound("Member not found");

  if (trainer.maxMembers && trainer.maxMembers > 0) {
    const current = await Member.countDocuments({ tenantId, trainerId });
    if (String(member.trainerId) !== String(trainerId) && current >= trainer.maxMembers) {
      throw ApiError.badRequest("Trainer has reached maximum member capacity");
    }
  }

  member.trainerId = trainerId;
  await member.save();
  return { success: true, memberId, trainerId };
}

async function unassignMember({ tenantId, memberId }) {
  const member = await Member.findOneAndUpdate(
    { _id: memberId, tenantId },
    { $set: { trainerId: null } },
    { new: true }
  ).lean();
  if (!member) throw ApiError.notFound("Member not found");
  return { success: true };
}

/** Members assigned to a trainer (the trainer-facing roster). */
async function assignedMembers({ tenantId, trainerId, page = 1, limit = 20 }) {
  const trainer = await Trainer.findOne({ _id: trainerId, tenantId }).select("name").lean();
  if (!trainer) throw ApiError.notFound("Trainer not found");
  const filter = { tenantId, trainerId };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Member.find(filter).populate("plan", "name price duration").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Member.countDocuments(filter),
  ]);
  return {
    trainer: { id: String(trainer._id), name: trainer.name },
    members: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function selfMembers({ tenantId, userId, page = 1, limit = 20 }) {
  const trainer = await Trainer.findOne({ tenantId, userId }).select("_id").lean();
  if (!trainer) throw ApiError.notFound("Trainer profile not found");
  return assignedMembers({ tenantId, trainerId: trainer._id, page, limit });
}

/** Workload metrics for a single trainer. */
async function workload({ tenantId, trainerId }) {
  const trainer = await Trainer.findOne({ _id: trainerId, tenantId }).lean();
  if (!trainer) throw ApiError.notFound("Trainer not found");

  const now = new Date();
  const [assigned, active, sessions] = await Promise.all([
    Member.countDocuments({ tenantId, trainerId }),
    Member.countDocuments({ tenantId, trainerId, status: "ACTIVE", endDate: { $gte: now } }),
    Session.countDocuments({ tenantId, trainerId, isActive: true }),
  ]);

  return {
    trainer: { id: String(trainer._id), name: trainer.name },
    assignedMembers: assigned,
    activeMembers: active,
    expiredMembers: assigned - active,
    activeSessions: sessions,
    capacity: trainer.maxMembers || null,
    utilization: trainer.maxMembers ? +((assigned / trainer.maxMembers) * 100).toFixed(1) : null,
  };
}

/** Workload leaderboard across all trainers (aggregation). */
async function workloadAll({ tenantId }) {
  return Member.aggregate([
    { $match: { tenantId: oid(tenantId), trainerId: { $ne: null } } },
    {
      $group: {
        _id: "$trainerId",
        assignedMembers: { $sum: 1 },
        activeMembers: {
          $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
        },
      },
    },
    { $lookup: { from: "trainers", localField: "_id", foreignField: "_id", as: "trainer" } },
    { $unwind: "$trainer" },
    {
      $project: {
        _id: 0,
        trainerId: "$_id",
        name: "$trainer.name",
        assignedMembers: 1,
        activeMembers: 1,
      },
    },
    { $sort: { assignedMembers: -1 } },
  ]);
}

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
