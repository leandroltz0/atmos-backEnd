import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
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
export class AuthService {
  constructor(
    @Inject(DB_POOL) private pool: Pool,
    private jwtService: JwtService,
  ) {}

  generateToken(user: UserWithoutPassword): string {
    return this.jwtService.sign({
      userId: user.id,
      email: user.email,
    });
  }

  async register(name: string, email: string, password: string): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const result = await this.pool.query<User>(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, updated_at',
        [name, email, hashedPassword],
      );
      return result.rows[0];
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: UserWithoutPassword }> {
    const result = await this.pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      token: this.generateToken(userWithoutPassword),
      user: userWithoutPassword,
    };
  }

  async getCurrentUser(userId: number): Promise<UserWithoutPassword> {
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
}
