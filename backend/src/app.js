"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { attachUser } = require("./middleware/auth");
const { notFoundHandler, errorHandler } = require("./middleware/error");
const apiRoutes = require("./routes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin/non-browser (no Origin header) and configured origins.
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (env.nodeEnv !== "test") app.use(morgan(env.isProd ? "combined" : "dev"));

// Attach req.user (if a valid token is present) for every request.
app.use(attachUser);

// Basic abuse protection on auth endpoints.
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
);

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
