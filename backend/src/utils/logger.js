// Minimal structured-ish logger. Swap for pino/winston later if this grows
// past a hackathon/portfolio project — kept dependency-free for now.
function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info: (...args) => console.log(`[${timestamp()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${timestamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${timestamp()}] [ERROR]`, ...args),
};
