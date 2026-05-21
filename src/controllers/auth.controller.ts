import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await authService.register({ email, password });
    res.status(201).json({ user });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { token, user } = await authService.login({ email, password });
    res.json({ token, user });
  } catch {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};
