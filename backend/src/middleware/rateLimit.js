const hits = new Map();

function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((time) => now - time < windowMs);
    if (recent.length >= max) {
      const error = new Error("Too many attempts. Please wait a minute and try again.");
      error.status = 429;
      next(error);
      return;
    }
    recent.push(now);
    hits.set(req.ip, recent);
    next();
  };
}

module.exports = { rateLimit };
