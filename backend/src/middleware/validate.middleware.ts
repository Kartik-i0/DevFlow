import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export type ValidatorFn = (body: any) => string | null;

/**
 * Express middleware to validate request body with a schema validator function
 */
export const validateBody = (validator: ValidatorFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errorMsg = validator(req.body);
    if (errorMsg) {
      return next(new AppError(errorMsg, 400));
    }
    next();
  };
};
