"use strict";

const env = require("../config/env");

/**
 * Click-to-chat WhatsApp helpers. No paid API or key required — we produce a
 * `https://wa.me/<number>?text=...` deep link that a staff member opens to send
 * the message from their own WhatsApp. This is the zero-cost way to deliver
 * reminders to members/customers.
 */

/** Normalise a phone number into wa.me digits (E.164 without the leading +). */
function normalizePhone(phone, countryCode = env.whatsapp.countryCode) {
  if (!phone) return "";
  let digits = String(phone).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `${countryCode}${digits.slice(1)}`;
  return digits;
}

/** Build a wa.me deep link. Returns null when the contact has no usable number. */
function whatsappLink(phone, message, countryCode = env.whatsapp.countryCode) {
  const number = normalizePhone(phone, countryCode);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

module.exports = { normalizePhone, whatsappLink };
