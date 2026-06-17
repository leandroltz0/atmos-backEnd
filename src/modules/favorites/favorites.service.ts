import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_POOL } from '../../config/database.module';

export interface FavoriteCityRow {
  id: number;
  user_id: number;
  name: string;
  country: string;
  lat: string | number;
  lon: string | number;
  is_default: boolean | null;
  created_at: Date | null;
}

export interface FavoriteCity {
  cityId: string;
  name: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  lat: number;
  lon: number;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date | null;
}

interface CreateFavoriteInput {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

const toFavoriteCity = (row: FavoriteCityRow, sortOrder: number): FavoriteCity => ({
  cityId: String(row.id),
  name: row.name,
  country: row.country,
  countryCode: null,
  region: null,
  lat: Number(row.lat),
  lon: Number(row.lon),
  isDefault: Boolean(row.is_default),
  sortOrder,
  createdAt: row.created_at,
});

@Injectable()
export class FavoritesService {
  constructor(@Inject(DB_POOL) private pool: Pool) {}

  async listFavorites(userId: number): Promise<FavoriteCity[]> {
    const result = await this.pool.query<FavoriteCityRow>(
      `SELECT id, user_id, name, country, lat, lon, is_default, created_at
       FROM favorite_cities
       WHERE user_id = $1
       ORDER BY created_at ASC NULLS LAST, id ASC`,
      [userId],
    );

    return result.rows.map((row, index) => toFavoriteCity(row, index));
  }

  async addFavorite(userId: number, input: CreateFavoriteInput): Promise<FavoriteCity> {
    const duplicateResult = await this.pool.query<FavoriteCityRow>(
      `SELECT id, user_id, name, country, lat, lon, is_default, created_at
       FROM favorite_cities
       WHERE user_id = $1
         AND LOWER(name) = LOWER($2)
         AND LOWER(country) = LOWER($3)
         AND lat = $4
         AND lon = $5
       LIMIT 1`,
      [userId, input.name, input.country, input.lat, input.lon],
    );

    if (duplicateResult.rows[0]) {
      throw new ConflictException('Favorite city already exists');
    }

    const result = await this.pool.query<FavoriteCityRow>(
      `INSERT INTO favorite_cities (user_id, name, country, lat, lon, is_default, created_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
       RETURNING id, user_id, name, country, lat, lon, is_default, created_at`,
      [userId, input.name, input.country, input.lat, input.lon],
    );

    const row = result.rows[0];
    const favorites = await this.listFavorites(userId);
    const sortOrder = favorites.findIndex((favorite) => favorite.cityId === String(row.id));

    return toFavoriteCity(row, sortOrder >= 0 ? sortOrder : favorites.length);
  }

  async removeFavorite(userId: number, cityId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM favorite_cities WHERE user_id = $1 AND id = $2',
      [userId, Number(cityId)],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Favorite city not found');
    }
  }

  async reorderFavorites(userId: number, orderedCityIds: string[]): Promise<FavoriteCity[]> {
    const numericIds = orderedCityIds.map((cityId) => Number(cityId));

    if (numericIds.some((value) => !Number.isInteger(value) || value <= 0)) {
      throw new BadRequestException('favorites must contain valid ids');
    }

    const result = await this.pool.query<FavoriteCityRow>(
      `SELECT id, user_id, name, country, lat, lon, is_default, created_at
       FROM favorite_cities
       WHERE user_id = $1
       ORDER BY created_at ASC NULLS LAST, id ASC`,
      [userId],
    );

    if (result.rows.length !== orderedCityIds.length) {
      throw new BadRequestException('favorites list must include every current favorite exactly once');
    }

    const existingIds = new Set(result.rows.map((row) => row.id));

    if (numericIds.some((id) => !existingIds.has(id)) || new Set(numericIds).size !== numericIds.length) {
      throw new BadRequestException('favorites list must include every current favorite exactly once');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (let index = 0; index < numericIds.length; index += 1) {
        await client.query(
          "UPDATE favorite_cities SET created_at = NOW() + ($1 * INTERVAL '1 second') WHERE user_id = $2 AND id = $3",
          [index, userId, numericIds[index]],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.listFavorites(userId);
  }
}
