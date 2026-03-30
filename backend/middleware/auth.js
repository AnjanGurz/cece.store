// ====================================================
//  middleware/auth.js
//  JWT verification middleware.
//  Attach to any route that requires admin access.
// ====================================================

const jwt = require('jsonwebtoken');

/**
 * Verify the Bearer JWT in the Authorization header.
 * On success, attaches `req.admin = { role: 'admin' }`.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = { requireAuth };
