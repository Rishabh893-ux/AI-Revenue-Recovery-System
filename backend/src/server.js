import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env, printEnvSummary } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Surface crashes with a clear message instead of Node's raw, easy-to-miss
// stack dump — especially useful when running under nodemon, where the
// terminal fills up with restart noise around the actual error.
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — server is shutting down:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    "Unhandled promise rejection — server is shutting down:",
    reason instanceof Error ? reason.message : reason
  );
  if (reason instanceof Error) console.error(reason.stack);
  process.exit(1);
});

const app = express();

// FRONTEND_URL supports a comma-separated list, so you can run the Vite
// dev server on its default port plus a network/preview URL at the same
// time without CORS blocking one of them.
const allowedOrigins = env.frontendUrl.split(",").map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools like curl/Postman (no Origin header) and any origin
      // that's on the allowed list.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from unlisted origin: ${origin}`);
        callback(Object.assign(new Error("Not allowed by CORS"), { status: 403 }));
      }
    },
  })
);

app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// The Razorpay webhook route needs the raw request body to verify the
// signature (see middleware/verifyWebhook.js), so it gets its own body
// parser that captures the raw buffer BEFORE express.json() runs for every
// other route.
app.use(
  "/api/webhooks/razorpay",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/carts", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const server = app.listen(env.port, () => {
  logger.info(`ReviveAI backend listening on port ${env.port} (${env.nodeEnv})`);
  printEnvSummary(logger);
});

// Let in-flight requests finish instead of dropping them on Ctrl+C or a
// process manager's stop signal.
function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
  // Don't hang forever if something's stuck (e.g. a long-running request).
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
