import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Prisma Duplicate Unique Field Error (e.g. Email already exists)
  if (err.code === 'P2002') {
    err.statusCode = 400;
    err.message = `Duplicate entry for ${err.meta?.target || 'field'}. Please use another value!`;
  }

  // Handle Invalid JWT Signature
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid token. Please log in again!';
  }

  // Handle Expired JWT Token
  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Your token has expired! Please log in again.';
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
