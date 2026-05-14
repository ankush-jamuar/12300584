import { Request, Response, NextFunction } from 'express';
import { logger } from './logger'; 

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string || 'pre-authorized-system-user';
  
  (req as any).user = { id: userId };
  
  logger('backend', 'debug', 'auth', `User authorization validated via mock middleware for userId: ${userId}`);
  
  next();
};