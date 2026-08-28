import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '8f2a5b6d9c3e4a1f7b0d2e8c5a9b4f1e6d3c7a0b9f2e5d8c1a4b7f0e3d6c9b2a';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing JWT' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // Attach user id to request. The original Spring Boot implementation used the subject as user ID.
    req.user = { id: BigInt(payload.sub) };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired JWT' });
  }
};
