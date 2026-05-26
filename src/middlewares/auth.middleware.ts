import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface JwtPayload {
  userId: number;
  email: string;
}

// Extiende el tipo Request de Express para incluir el usuario autenticado.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Middleware de autenticación JWT.
 * Verifica el header `Authorization: Bearer <token>` y adjunta el payload al request.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Invalid token format' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
