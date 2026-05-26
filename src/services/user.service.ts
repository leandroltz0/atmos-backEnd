import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { User, UserWithoutPassword } from '../models/user.model';
import { AppError } from '../utils/http';

const SALT_ROUNDS = 10;

export const getCurrentUserProfile = async (userId: number): Promise<UserWithoutPassword> => {
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

export const updateCurrentUserProfile = async (
  userId: number,
  name: string
): Promise<UserWithoutPassword> => {
  const result = await pool.query<UserWithoutPassword>(
    'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, created_at, updated_at',
    [name, userId]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};

export const updateCurrentUserPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    throw new AppError(401, 'Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId]
  );
};

export const deleteCurrentUser = async (userId: number): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM favorite_cities WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM search_history WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
    const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
      throw new AppError(404, 'User not found');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
