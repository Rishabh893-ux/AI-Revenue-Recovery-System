// Standardized response shapes so every endpoint returns predictable JSON
// and the frontend's api.js can rely on a consistent envelope for errors.
export function success(res, data, status = 200) {
  return res.status(status).json(data);
}

export function fail(res, message, status = 400, extra = {}) {
  return res.status(status).json({ message, ...extra });
}
