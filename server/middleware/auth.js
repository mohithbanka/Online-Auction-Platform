const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Authenticate] No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('[Authenticate] Token decoded:', { id: decoded.id, role: decoded.role });
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error('[Authenticate] Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};