import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { pool } from '../config/db';
import { User, UserWithoutPassword, AuthPayload } from '../models/user.model';
import { AppError } from '../utils/http';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const SALT_ROUNDS = 10;



// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------

/** Registra un nuevo usuario con contraseña hasheada. Lanza error 409 si el email ya existe. */
export const register = async ({ name, email, password }: AuthPayload & { name: string }): Promise<UserWithoutPassword> => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await pool.query<User>(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, updated_at',
      [name, email, hashedPassword]
    );

    return result.rows[0];
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
      throw new AppError(409, 'Email already registered');
    }

    throw error;
  }
};

/** Autentica un usuario con email y contraseña. Retorna un JWT y los datos del usuario. */
export const login = async ({ email, password }: AuthPayload): Promise<{ token: string; user: UserWithoutPassword }> => {
  const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

/** Obtiene el usuario autenticado actual por su ID. Lanza error 404 si no existe. */
export const getCurrentUser = async (userId: number): Promise<UserWithoutPassword> => {
  const result = await pool.query<UserWithoutPassword>(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  const user = result.rows[0];

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};
