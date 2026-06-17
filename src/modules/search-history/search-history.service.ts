import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_POOL } from '../../config/database.module';

export interface SearchHistoryRow {
  id: number;
  user_id: number;
  city_name: string;
  country: string | null;
  lat: string | number | null;
  lon: string | number | null;
  searched_at: Date | null;
}

export interface SearchHistoryEntry {
  cityId: string;
  label: string;
  name: string;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lon: number | null;
  searchedAt: Date | null;
}

interface CreateSearchHistoryInput {
  name: string;
  country?: string;
  lat?: number;
  lon?: number;
}

const SEARCH_HISTORY_LIMIT = 10;

const toSearchHistoryEntry = (row: SearchHistoryRow): SearchHistoryEntry => ({
  cityId: String(row.id),
  label: row.city_name,
  name: row.city_name,
  country: row.country,
  countryCode: null,
  lat: row.lat === null ? null : Number(row.lat),
  lon: row.lon === null ? null : Number(row.lon),
  searchedAt: row.searched_at,
});

@Injectable()
export class SearchHistoryService {
  constructor(@Inject(DB_POOL) private pool: Pool) {}

  async listSearchHistory(userId: number): Promise<SearchHistoryEntry[]> {
    const result = await this.pool.query<SearchHistoryRow>(
      `SELECT id, user_id, city_name, country, lat, lon, searched_at
       FROM search_history
       WHERE user_id = $1
       ORDER BY searched_at DESC NULLS LAST, id DESC`,
      [userId],
    );

    return result.rows.map(toSearchHistoryEntry);
  }

  async addSearchHistoryEntry(userId: number, input: CreateSearchHistoryInput): Promise<SearchHistoryEntry> {
    const existingResult = await this.pool.query<SearchHistoryRow>(
      `SELECT id, user_id, city_name, country, lat, lon, searched_at
       FROM search_history
       WHERE user_id = $1
         AND LOWER(city_name) = LOWER($2)
         AND COALESCE(LOWER(country), '') = COALESCE(LOWER($3), '')
         AND COALESCE(lat, -9999.0) = COALESCE($4, -9999.0)
         AND COALESCE(lon, -9999.0) = COALESCE($5, -9999.0)
       LIMIT 1`,
      [userId, input.name, input.country ?? null, input.lat ?? null, input.lon ?? null],
    );

    let row: SearchHistoryRow;

    if (existingResult.rows[0]) {
      const updateResult = await this.pool.query<SearchHistoryRow>(
        `UPDATE search_history
         SET searched_at = NOW(), city_name = $1, country = $2, lat = $3, lon = $4
         WHERE id = $5
         RETURNING id, user_id, city_name, country, lat, lon, searched_at`,
        [input.name, input.country ?? null, input.lat ?? null, input.lon ?? null, existingResult.rows[0].id],
      );

      row = updateResult.rows[0];
    } else {
      const insertResult = await this.pool.query<SearchHistoryRow>(
        `INSERT INTO search_history (user_id, city_name, country, lat, lon, searched_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, user_id, city_name, country, lat, lon, searched_at`,
        [userId, input.name, input.country ?? null, input.lat ?? null, input.lon ?? null],
      );

      row = insertResult.rows[0];
    }

    await this.pool.query(
      `DELETE FROM search_history
       WHERE user_id = $1
         AND id NOT IN (
           SELECT id
           FROM search_history
           WHERE user_id = $1
           ORDER BY searched_at DESC NULLS LAST, id DESC
           LIMIT $2
         )`,
      [userId, SEARCH_HISTORY_LIMIT],
    );

    return toSearchHistoryEntry(row);
  }

  async clearSearchHistory(userId: number): Promise<void> {
    await this.pool.query('DELETE FROM search_history WHERE user_id = $1', [userId]);
  }
}
