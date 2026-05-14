import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger('backend', 'info', 'route', `Incoming ${req.method} request to ${req.originalUrl}`);

  res.on('finish', () => {
    const level = res.statusCode >= 400 ? 'error' : 'info';
    logger('backend', level, 'route', `Completed ${req.method} ${req.originalUrl} with status ${res.statusCode}`);
  });

  next();
};