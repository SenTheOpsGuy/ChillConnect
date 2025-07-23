import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

export const requireVerification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isVerified: true, verificationStatus: true }
    });

    if (!user?.isVerified || user.verificationStatus !== 'APPROVED') {
      return res.status(403).json({ 
        error: 'Account verification required.',
        verificationStatus: user?.verificationStatus 
      });
    }

    next();
  } catch (error) {
    logger.error('Verification check error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};