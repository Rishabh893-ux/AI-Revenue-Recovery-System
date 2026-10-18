import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

// Central error handler — every controller can `next(err)` and land here
// instead of duplicating try/catch response logic everywhere.
export function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} ->`, err.message);
  if (env.nodeEnv !== "production") {
    console.error(err.stack);
  }

  const status = err.status || 500;
  const message =
    status === 500 ? "Something went wrong on our end." : err.message;

  const body = { message };
  // Stack traces are a real information leak in production (file paths,
  // internal structure) — only ever attach them outside prod, and only
  // when something actually asks for them.
  if (env.nodeEnv !== "production" && status === 500) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

// Wraps an async route handler so thrown errors/rejected promises are
// forwarded to errorHandler instead of crashing the process.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
