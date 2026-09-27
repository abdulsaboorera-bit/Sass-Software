"use strict";

const { z } = require("zod");
const { Member, Session, GymInvoice, GymPayment, Tenant } = require("../../models");
const { ApiError, apiSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const { signMemberToken } = require("../../utils/jwt");
const { computeMembershipStatus } = require("../../utils/dates");
const attendanceService = require("../../services/gym/attendance.service");
const gamification = require("../../services/gym/gamification.service");
const bookingService = require("../../services/gym/booking.service");

const loginSchema = z.object({
  memberNo: z.string().min(1),
  phone: z.string().min(4),
  tenantSlug: z.string().min(1).optional(),
});

/**
 * POST /api/gym/portal/login  { memberNo, phone }
 * Lightweight member auth: matches memberNo + phone. Returns a member-scoped JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { memberNo, phone, tenantSlug } = loginSchema.parse(req.body);
  const tenant = tenantSlug ? await Tenant.findOne({ slug: tenantSlug, industry: "GYM", status: { $in: ["ACTIVE", "TRIAL"] } }).select("_id").lean() : null;
  if (tenantSlug && !tenant) throw ApiError.unauthorized("Invalid gym");
  const matches = await Member.find({ memberNo, phone, ...(tenant ? { tenantId: tenant._id } : {}) }).limit(2);
  if (matches.length !== 1) throw ApiError.unauthorized("Invalid member number or phone");
  const member = matches[0];

  const token = signMemberToken({ memberId: member._id, tenantId: member.tenantId });
  return apiSuccess(res, {
    token,
    member: { id: String(member._id), name: member.name, memberNo: member.memberNo },
  });
});

const me = asyncHandler(async (req, res) => {
  const { memberId, tenantId } = req.portalMember;
  const member = await Member.findOne({ _id: memberId, tenantId }).populate("plan", "name price duration").populate("trainer", "name").lean();
  if (!member) throw ApiError.notFound("Member not found");
  const tenant = await Tenant.findById(tenantId).select("name currency").lean();

  return apiSuccess(res, {
    member: {
      id: String(member._id),
      name: member.name,
      memberNo: member.memberNo,
      phone: member.phone,
      email: member.email,
      photo: member.photo,
      plan: member.plan,
      trainer: member.trainer,
      startDate: member.startDate,
      endDate: member.endDate,
      status: computeMembershipStatus(member),
      currentStreak: member.currentStreak || 0,
      longestStreak: member.longestStreak || 0,
      lastAttendanceAt: member.lastAttendanceAt,
    },
    gym: tenant ? { name: tenant.name, currency: tenant.currency } : null,
  });
});

const attendance = asyncHandler(async (req, res) => {
  const { memberId, tenantId } = req.portalMember;
  const now = new Date();
  const [list, summary] = await Promise.all([
    attendanceService.list({ tenantId, memberId, page: 1, limit: 30 }),
    attendanceService.memberMonthlySummary({ tenantId, memberId, year: now.getFullYear(), month: now.getMonth() + 1 }),
  ]);
  return apiSuccess(res, { recent: list.checkIns, monthly: summary });
});

const invoices = asyncHandler(async (req, res) => {
  const { memberId, tenantId } = req.portalMember;
  const [invoiceList, payments] = await Promise.all([
    GymInvoice.find({ tenantId, memberId }).sort({ createdAt: -1 }).lean(),
    GymPayment.find({ tenantId, memberId }).sort({ paidAt: -1 }).lean(),
  ]);
  return apiSuccess(res, { invoices: invoiceList, payments });
});

const badges = asyncHandler(async (req, res) => {
  const { memberId, tenantId } = req.portalMember;
  return apiSuccess(res, await gamification.memberBadges({ tenantId, memberId }));
});

const classes = asyncHandler(async (req, res) => {
  const { tenantId } = req.portalMember;
  const sessions = await Session.find({ tenantId, isActive: true }).populate("trainerId", "name").sort({ dayOfWeek: 1, startTime: 1 }).lean();
  return apiSuccess(res, { classes: sessions });
});

const book = asyncHandler(async (req, res) => {
  const { memberId, tenantId } = req.portalMember;
  const { sessionId, date } = z.object({ sessionId: z.string().min(1), date: z.string().min(1) }).parse(req.body);
  const booking = await bookingService.create({ tenantId, sessionId, memberId, date: new Date(date), bookedBy: null });
  return apiSuccess(res, { booking }, 201);
});

const myBookings = asyncHandler(async (req, res) => {
  const { memberId, tenantId } = req.portalMember;
  const result = await bookingService.list({ tenantId, memberId, page: 1, limit: 50 });
  return apiSuccess(res, result);
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { memberId, tenantId } = req.portalMember;
  const booking = await bookingService.cancel({ tenantId, memberId, id: req.params.id, cancelReason: "Cancelled by member" });
  return apiSuccess(res, { booking });
});

module.exports = { login, me, attendance, invoices, badges, classes, book, myBookings, cancelBooking };
