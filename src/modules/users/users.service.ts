import { Injectable, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { DB_POOL } from '../../config/database.module';

const SALT_ROUNDS = 10;

export interface User {
  id: number;
  name: string | null;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword {
  id: number;
  name: string | null;
  email: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UsersService {
  constructor(@Inject(DB_POOL) private pool: Pool) {}

  async getCurrentUserProfile(userId: number): Promise<UserWithoutPassword> {
    const result = await this.pool.query<UserWithoutPassword>(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [userId],
    );
    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCurrentUserProfile(userId: number, name: string): Promise<UserWithoutPassword> {
    const result = await this.pool.query<UserWithoutPassword>(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, created_at, updated_at',
      [name, userId],
    );
    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCurrentUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const result = await this.pool.query<User>('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId],
    );
  }

  async deleteCurrentUser(userId: number, password: string): Promise<void> {
    const userResult = await this.pool.query<Pick<User, 'password'>>('SELECT password FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM favorite_cities WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM search_history WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
      const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);

      if (result.rowCount === 0) {
        throw new NotFoundException('User not found');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
