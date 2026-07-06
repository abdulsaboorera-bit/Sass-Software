"use strict";

const QRCode = require("qrcode");

/** Generate a QR code as a data URL (PNG) from arbitrary text. */
function qrDataUrl(text, opts = {}) {
  return QRCode.toDataURL(String(text), { margin: 1, width: 240, ...opts });
}

module.exports = { qrDataUrl };
