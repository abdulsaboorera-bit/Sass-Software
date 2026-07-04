"use strict";

const env = require("../config/env");

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const baseCookie = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax",
  path: "/",
};

/** Set the same httpOnly auth cookies the Next.js app read before. */
function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("access_token", accessToken, { ...baseCookie, maxAge: ACCESS_MAX_AGE });
  res.cookie("refresh_token", refreshToken, { ...baseCookie, maxAge: REFRESH_MAX_AGE });
}

function clearAuthCookies(res) {
  res.clearCookie("access_token", { ...baseCookie });
  res.clearCookie("refresh_token", { ...baseCookie });
}

module.exports = { setAuthCookies, clearAuthCookies, REFRESH_MAX_AGE };
