// Loads and validates environment variables in one place so a missing or
// malformed secret fails loudly and clearly at startup, instead of
// surfacing as a confusing crash deep inside a library later.
import dotenv from "dotenv";

dotenv.config();

const required = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = required.filter((key) => !process.env[key] || !process.env[key].trim());

if (missing.length > 0) {
  throw new Error(
    `[env] Missing or empty environment variable(s): ${missing.join(", ")}.\n` +
      "  1. Make sure backend/.env exists (copy it from .env.example if not).\n" +
      "  2. Make sure each variable above has a real value, not left blank or as a placeholder.\n" +
      "  3. Restart the server after editing .env — it's only read on startup."
  );
}

// Trims trailing whitespace/newlines from copy-paste — a common source of
// "works everywhere except here" bugs with URLs and keys.
function clean(value) {
  return value ? value.trim() : value;
}

const supabaseUrl = clean(process.env.SUPABASE_URL);
const supabaseServiceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const razorpayKeyId = clean(process.env.RAZORPAY_KEY_ID);
const razorpayKeySecret = clean(process.env.RAZORPAY_KEY_SECRET);
const razorpayWebhookSecret = clean(process.env.RAZORPAY_WEBHOOK_SECRET);

/* ---------------------------------------------------------------------- */
/*  Fail-fast format checks — each one names the exact variable and       */
/*  exactly what's wrong with it, so nothing bubbles up as an opaque      */
/*  crash from inside a third-party SDK.                                  */
/* ---------------------------------------------------------------------- */

function fail(message) {
  throw new Error(`[env] ${message}`);
}

try {
  new URL(supabaseUrl);
} catch {
  fail(
    `SUPABASE_URL is not a valid URL: "${supabaseUrl}".\n` +
      "  It should look like https://xxxxxxxxxxxx.supabase.co — check for a stray placeholder, " +
      "extra quotes, or a trailing slash/space in backend/.env."
  );
}

if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
  console.warn(
    `[env] SUPABASE_URL ("${supabaseUrl}") doesn't look like a typical Supabase project URL. ` +
      "Double-check it against Supabase Dashboard -> Settings -> API -> Project URL."
  );
}

// Supabase's service_role and anon keys are JWTs, so they always start with
// "eyJ". Catching a swapped/truncated key here is much clearer than letting
// every Supabase call fail with a vague 401 later.
if (
  !supabaseServiceRoleKey.startsWith("eyJ") &&
  !supabaseServiceRoleKey.startsWith("sb_secret_")
) {
  throw new Error(
    '[env] SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase key.'
  );
}

// Razorpay key ids always start with rzp_test_ or rzp_live_. Catching a
// pasted secret-in-the-id-field mistake here beats a confusing Razorpay
// "Authentication failed" error on the first API call.
if (!/^rzp_(test|live)_/.test(razorpayKeyId)) {
  fail(
    `RAZORPAY_KEY_ID ("${razorpayKeyId}") doesn't look like a real Razorpay key id ` +
      '(should start with "rzp_test_" or "rzp_live_"). Check Razorpay Dashboard -> Settings -> API Keys.'
  );
}

if (razorpayKeySecret.startsWith("rzp_")) {
  fail(
    "RAZORPAY_KEY_SECRET looks like it might contain a key ID instead of the actual secret. " +
      "Double-check you copied the secret shown only once when the key was generated."
  );
}

if (razorpayWebhookSecret.length < 8) {
  fail(
    "RAZORPAY_WEBHOOK_SECRET looks too short to be real. This must match exactly what you " +
      "entered when creating the webhook in Razorpay Dashboard -> Settings -> Webhooks."
  );
}

// Optional n8n webhook URLs — only validated if actually set, since these
// are allowed to be absent (see README: n8n can trigger off Supabase
// directly instead of being pinged by this backend).
function validateOptionalUrl(name, value) {
  if (!value) return null;
  const trimmed = clean(value);
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    fail(`${name} is set but isn't a valid URL: "${trimmed}".`);
  }
}

const n8nAbandonedCartWebhook = validateOptionalUrl(
  "N8N_ABANDONED_CART_WEBHOOK",
  process.env.N8N_ABANDONED_CART_WEBHOOK
);
const n8nFailedPaymentWebhook = validateOptionalUrl(
  "N8N_FAILED_PAYMENT_WEBHOOK",
  process.env.N8N_FAILED_PAYMENT_WEBHOOK
);

const n8nSharedSecret = clean(process.env.N8N_SHARED_SECRET) || null;

if (!n8nSharedSecret) {
  console.warn(
    "[env] N8N_SHARED_SECRET is not set — /api/webhooks/cart-abandoned and " +
      "/api/webhooks/n8n/recovery-action will reject every request until it is."
  );
} else if (/^https?:\/\//i.test(n8nSharedSecret) || n8nSharedSecret.length < 16) {
  console.warn(
    "[env] N8N_SHARED_SECRET looks like a URL or is very short. It should be a long random " +
      "string (e.g. `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"`) " +
      "that n8n sends back in the x-n8n-secret header."
  );
}

export const env = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",

  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,

  supabaseUrl,
  supabaseServiceRoleKey,

  n8nAbandonedCartWebhook,
  n8nFailedPaymentWebhook,
  n8nSharedSecret,
};

// A version of the config safe to print to logs — real values are masked
// down to a recognizable prefix/suffix so you can eyeball "yep, that's the
// right project" without ever putting a working secret in a log file or a
// screenshot you might paste into a chat or a GitHub issue.
function mask(value, visible = 4) {
  if (!value) return "(not set)";
  if (value.length <= visible * 2) return "*".repeat(value.length);
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

export function printEnvSummary(logger) {
  logger.info("Environment loaded:");
  logger.info(`  NODE_ENV: ${env.nodeEnv}`);
  logger.info(`  PORT: ${env.port}`);
  logger.info(`  FRONTEND_URL: ${env.frontendUrl}`);
  logger.info(`  SUPABASE_URL: ${env.supabaseUrl}`);
  logger.info(`  SUPABASE_SERVICE_ROLE_KEY: ${mask(env.supabaseServiceRoleKey)}`);
  logger.info(`  RAZORPAY_KEY_ID: ${env.razorpayKeyId}`);
  logger.info(`  RAZORPAY_KEY_SECRET: ${mask(env.razorpayKeySecret)}`);
  logger.info(`  RAZORPAY_WEBHOOK_SECRET: ${mask(env.razorpayWebhookSecret)}`);
  logger.info(`  N8N_ABANDONED_CART_WEBHOOK: ${env.n8nAbandonedCartWebhook || "(not set)"}`);
  logger.info(`  N8N_FAILED_PAYMENT_WEBHOOK: ${env.n8nFailedPaymentWebhook || "(not set)"}`);
}
