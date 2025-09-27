// my-app-backend/middleware/authenticateToken.js
import { verifyAndDecodeToken } from './authHelpers.js';

export const authenticateToken = async (req, res, next) => {
  try {
    // Reuse your existing helper
    const decoded = await verifyAndDecodeToken(req);
    
    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next(); // Proceed to route handler
  } catch (error) {
    console.error('Authentication failed:', error.message);

    if (error.message === 'No authentication token provided') {
      return res.status(401).json({ error: 'Access token required' });
    }
    if (error.message === 'Token revoked') {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Fallback
    return res.status(401).json({ error: 'Authentication failed' });
  }
};