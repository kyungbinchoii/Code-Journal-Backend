import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ClientError } from './client-error.ts';

const hashKey = process.env.TOKEN_SECRET ?? '';
if (!hashKey) throw new Error('TOKEN_SECRET not found in env');

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorizationHeader = req.get('Authorization');
  const parsedToken = authorizationHeader?.split('Bearer ')[1];

  if (!parsedToken) {
    throw new ClientError(401, 'authentication required');
  }

  const checkedPayload = jwt.verify(parsedToken, hashKey);
  req.user = checkedPayload as Request['user'];
  next();
}
