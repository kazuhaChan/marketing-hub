const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header (support both x-auth-token and Authorization)
  let token = req.header('x-auth-token') || req.header('Authorization');

  // Remove Bearer prefix if present
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length).trimStart();
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
