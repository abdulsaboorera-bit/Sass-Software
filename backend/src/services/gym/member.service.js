"use strict";

const { Member, MembershipPlan, Trainer, GymPayment } = require("../../models");
const { ApiError } = require("../../utils/apiResponse");
const { nextMemberNo } = require("../../utils/ids");
const { addDays, computeMembershipStatus } = require("../../utils/dates");
const notifications = require("../notification.service");
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Attach derived fields (effectiveStatus, daysUntilExpiry) to a lean member. */
function decorate(m) {
  if (!m) return m;
  const DAY = 24 * 60 * 60 * 1000;
  const effectiveStatus = computeMembershipStatus(m);
  const daysUntilExpiry = m.endDate
    ? Math.ceil((new Date(m.endDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / DAY)
    : null;
  return { ...m, effectiveStatus, daysUntilExpiry };
}

/**
 * List members with pagination + filtering. `trainerScope` (a trainerId)
 * restricts results to that trainer's assigned members — used to enforce the
 * "trainers can only access assigned members" rule.
 */
async function list({ tenantId, page = 1, limit = 20, search, status, planId, trainerId, trainerScope }) {
  const filter = { tenantId };
  if (search) {
    filter.$or = [
       { name: { $regex: escapeRegex(search), $options: "i" } },
       { memberNo: { $regex: escapeRegex(search), $options: "i" } },
       { phone: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }
  if (status === "FROZEN" || status === "CANCELLED") filter.status = status;
  if (status === "ACTIVE" || status === "EXPIRED") {
    filter.$and = [{ status: { $nin: ["FROZEN", "CANCELLED"] } }, {
      endDate: status === "ACTIVE" ? { $gte: new Date() } : { $lt: new Date() },
    }];
  }
  if (planId) filter.planId = planId;
  if (trainerId) filter.trainerId = trainerId;
  if (trainerScope) filter.trainerId = trainerScope; // hard override for scoped trainers

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Member.find(filter)
      .populate("plan", "name price duration")
      .populate("trainer", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Member.countDocuments(filter),
  ]);

  const billing = require("./billing.service"); // lazy require avoids a cycle
  const latestInvoices = await billing.latestInvoicesByMember({ tenantId, memberIds: rows.map((r) => r._id) });
  const decorated = rows.map((r) => ({ ...decorate(r), feeStatus: latestInvoices.get(String(r._id))?.status || null }));

  return {
    members: decorated,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getById({ tenantId, id, trainerScope }) {
  const filter = { _id: id, tenantId };
  if (trainerScope) filter.trainerId = trainerScope;
  const member = await Member.findOne(filter)
    .populate("plan", "name price duration")
    .populate("trainer", "name phone")
    .lean({ virtuals: true });
  if (!member) throw ApiError.notFound("Member not found");

  const billing = require("./billing.service"); // lazy require avoids a cycle
  const latestInvoices = await billing.latestInvoicesByMember({ tenantId, memberIds: [member._id] });

  return { ...decorate(member), feeStatus: latestInvoices.get(String(member._id))?.status || null };
}

async function create({ tenantId, data, actor }) {
  const plan = await MembershipPlan.findOne({ _id: data.planId, tenantId });
  if (!plan) throw ApiError.badRequest("Invalid plan");

  if (data.trainerId) {
    const trainer = await Trainer.findOne({ _id: data.trainerId, tenantId });
    if (!trainer) throw ApiError.badRequest("Invalid trainer");
  }

  const memberNo = data.memberNo || (await nextMemberNo(Member, tenantId));
  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const endDate = addDays(startDate, plan.duration);

  const notesHistory = data.note
    ? [{ note: data.note, createdBy: actor && actor.userId, createdByName: actor && actor.name }]
    : [];

  const member = await Member.create({
    tenantId,
    memberNo,
    name: data.name,
    phone: data.phone,
    email: data.email,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    address: data.address,
    emergencyContact: data.emergencyContact,
    photo: data.photo,
    planId: data.planId,
    trainerId: data.trainerId || null,
    startDate,
    endDate,
    status: "ACTIVE",
    notesHistory,
  });

  // Fire a welcome notification (outbox row, no real send yet).
  await notifications.emit({
    tenantId,
    event: "WELCOME",
    channel: "WHATSAPP",
    recipientType: "MEMBER",
    recipientId: member._id,
    recipientName: member.name,
    recipientContact: member.phone,
    title: "Welcome to the gym!",
    message: `Welcome ${member.name}! Your membership (${plan.name}) is active until ${endDate.toDateString()}.`,
    data: { memberId: String(member._id) },
  });

  return decorate(member.toObject());
}

/**
 * Update editable fields. Notes are NEVER overwritten here — a supplied `note`
 * is appended to notesHistory. Status transitions to/from FROZEN maintain the
 * freeze bookkeeping fields.
 */
async function update({ tenantId, id, data, actor }) {
  const member = await Member.findOne({ _id: id, tenantId });
  if (!member) throw ApiError.notFound("Member not found");

  if (data.planId) {
    const plan = await MembershipPlan.findOne({ _id: data.planId, tenantId });
    if (!plan) throw ApiError.badRequest("Invalid plan");
    member.planId = data.planId;
  }
  if (data.trainerId !== undefined) {
    if (data.trainerId) {
      const trainer = await Trainer.findOne({ _id: data.trainerId, tenantId });
      if (!trainer) throw ApiError.badRequest("Invalid trainer");
    }
    member.trainerId = data.trainerId || null;
  }

  for (const f of ["name", "phone", "email", "address", "emergencyContact", "photo", "gender"]) {
    if (data[f] !== undefined) member[f] = data[f];
  }
  if (data.dateOfBirth !== undefined) member.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

  if (data.status && data.status !== member.status) {
    applyStatusChange(member, data.status, data.freezeReason);
  }

  if (data.note) {
    member.notesHistory.push({
      note: data.note,
      createdBy: actor && actor.userId,
      createdByName: actor && actor.name,
    });
  }

  await member.save();
  return decorate(member.toObject());
}

/** Centralised status transition with freeze bookkeeping. */
function applyStatusChange(member, status, freezeReason) {
  member.status = status;
  if (status === "FROZEN") {
    member.frozenAt = new Date();
    member.freezeReason = freezeReason || member.freezeReason || null;
  } else {
    member.frozenAt = null;
    member.freezeReason = null;
  }
}

/** Append a note without touching anything else (notes history). */
async function addNote({ tenantId, id, note, actor }) {
  const member = await Member.findOneAndUpdate(
    { _id: id, tenantId },
    {
      $push: {
        notesHistory: {
          note,
          createdBy: actor && actor.userId,
          createdByName: actor && actor.name,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  ).lean({ virtuals: true });
  if (!member) throw ApiError.notFound("Member not found");
  return decorate(member);
}

/**
 * Renew a membership: extend endDate (from the later of now / current end),
 * record a renewal history entry, reactivate, and optionally raise an invoice.
 */
async function renew({ tenantId, id, data, actor }) {
  const billing = require("./billing.service"); // lazy require avoids a cycle

  const member = await Member.findOne({ _id: id, tenantId });
  if (!member) throw ApiError.notFound("Member not found");

  const planId = data.planId || member.planId;
  const plan = await MembershipPlan.findOne({ _id: planId, tenantId });
  if (!plan) throw ApiError.badRequest("Invalid plan");

  const now = new Date();
  const base = member.endDate && new Date(member.endDate) > now ? new Date(member.endDate) : now;
  const previousEndDate = member.endDate;
  const newEndDate = addDays(base, plan.duration);
  const amount = data.amount != null ? Number(data.amount) : Number(plan.price);

  let invoice = null;
  if (data.createInvoice !== false) {
    invoice = await billing.createInvoice({
      tenantId,
      memberId: member._id,
      type: "RENEWAL",
      planId: plan._id,
      amount,
      dueDate: data.dueDate ? new Date(data.dueDate) : now,
      periodStart: base,
      periodEnd: newEndDate,
      notes: `Renewal — ${plan.name}`,
    });
  }

  member.planId = plan._id;
  member.endDate = newEndDate;
  member.status = "ACTIVE";
  member.frozenAt = null;
  member.freezeReason = null;
  member.renewals.push({
    planId: plan._id,
    planName: plan.name,
    previousEndDate,
    newEndDate,
    amount,
    invoiceId: invoice ? invoice._id : undefined,
    renewedBy: actor && actor.userId,
    renewedAt: now,
  });

  await member.save();
  return { member: decorate(member.toObject()), invoice };
}

async function remove({ tenantId, id }) {
  const member = await Member.findOneAndDelete({ _id: id, tenantId });
  if (!member) throw ApiError.notFound("Member not found");
  return { success: true };
}

/** Full payment history for a member (billing "payment history per member"). */
async function paymentHistory({ tenantId, id, trainerScope }) {
  const member = await Member.findOne({ _id: id, tenantId, ...(trainerScope ? { trainerId: trainerScope } : {}) }).select("_id").lean();
  if (!member) throw ApiError.notFound("Member not found");
  const payments = await GymPayment.find({ tenantId, memberId: id }).sort({ paidAt: -1 }).lean();
  return payments;
}

module.exports = {
  decorate,
  list,
  getById,
  create,
  update,
  addNote,
  renew,
  remove,
  paymentHistory,
};
