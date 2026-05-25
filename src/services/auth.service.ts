import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { User, UserWithoutPassword, AuthPayload } from '../models/user.model';

const SALT_ROUNDS = 10;

export const register = async ({ name, email, password }: AuthPayload & { name: string }): Promise<UserWithoutPassword> => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query<User>(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, updated_at',
    [name, email, hashedPassword]
  );

  return result.rows[0];
};

export const login = async ({ email, password }: AuthPayload): Promise<{ token: string; user: UserWithoutPassword }> => {
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};
