const jwt = require('jsonwebtoken');

// Reads "Authorization: Bearer <token>", verifies it, attaches the user id to req.
// Every protected route runs this before its handler, so it always knows *who* is calling.
function requireAuth(req, res, next) {
  const header = req.headers.authorization; // e.g. "Bearer eyJhbGciOi..."
  const token = header && header.split(' ')[1]; // drop the "Bearer " prefix

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired
    req.userId = payload.userId; // downstream routes trust req.userId, never a body field, for identity
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
