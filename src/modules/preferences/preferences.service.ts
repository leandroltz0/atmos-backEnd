import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_POOL } from '../../config/database.module';

export interface UserPreferencesRow {
  id: number;
  user_id: number;
  temp_unit: string | null;
  wind_unit: string | null;
  language: string | null;
  time_format: string | null;
  update_interval: number | null;
  push_notifications: boolean | null;
  auto_update: boolean | null;
  offline_mode: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface UserPreferences {
  tempUnit: string;
  windUnit: string;
  language: string;
  timeFormat: string;
  updateInterval: number;
  pushNotifications: boolean;
  autoUpdate: boolean;
  offlineMode: boolean;
}

interface PreferencePatchInput {
  tempUnit?: string;
  windUnit?: string;
  language?: string;
  timeFormat?: string;
  updateInterval?: number;
  pushNotifications?: boolean;
  autoUpdate?: boolean;
  offlineMode?: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  tempUnit: 'celsius',
  windUnit: 'kmh',
  language: 'en',
  timeFormat: '24h',
  updateInterval: 30,
  pushNotifications: false,
  autoUpdate: true,
  offlineMode: false,
};

const toPreferences = (row?: UserPreferencesRow): UserPreferences => ({
  tempUnit: row?.temp_unit ?? DEFAULT_PREFERENCES.tempUnit,
  windUnit: row?.wind_unit ?? DEFAULT_PREFERENCES.windUnit,
  language: row?.language ?? DEFAULT_PREFERENCES.language,
  timeFormat: row?.time_format ?? DEFAULT_PREFERENCES.timeFormat,
  updateInterval: row?.update_interval ?? DEFAULT_PREFERENCES.updateInterval,
  pushNotifications: row?.push_notifications ?? DEFAULT_PREFERENCES.pushNotifications,
  autoUpdate: row?.auto_update ?? DEFAULT_PREFERENCES.autoUpdate,
  offlineMode: row?.offline_mode ?? DEFAULT_PREFERENCES.offlineMode,
});

@Injectable()
export class PreferencesService {
  constructor(@Inject(DB_POOL) private pool: Pool) {}

  async getPreferences(userId: number): Promise<UserPreferences> {
    const result = await this.pool.query<UserPreferencesRow>(
      `SELECT id, user_id, temp_unit, wind_unit, language,
              time_format, update_interval, push_notifications, auto_update, offline_mode,
              created_at, updated_at
       FROM user_preferences
       WHERE user_id = $1`,
      [userId],
    );
    const row = result.rows[0];

    if (row) {
      return toPreferences(row);
    }

    await this.pool.query(
      `INSERT INTO user_preferences (user_id, temp_unit, wind_unit, language,
                                     time_format, update_interval, push_notifications, auto_update, offline_mode,
                                     created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [
        userId,
        DEFAULT_PREFERENCES.tempUnit,
        DEFAULT_PREFERENCES.windUnit,
        DEFAULT_PREFERENCES.language,
        DEFAULT_PREFERENCES.timeFormat,
        DEFAULT_PREFERENCES.updateInterval,
        DEFAULT_PREFERENCES.pushNotifications,
        DEFAULT_PREFERENCES.autoUpdate,
        DEFAULT_PREFERENCES.offlineMode,
      ],
    );

    return DEFAULT_PREFERENCES;
  }

  async updatePreferences(userId: number, patch: PreferencePatchInput): Promise<UserPreferences> {
    const currentPreferences = await this.getPreferences(userId);
    const nextPreferences: UserPreferences = {
      ...currentPreferences,
      ...patch,
    };

    const result = await this.pool.query<UserPreferencesRow>(
      `INSERT INTO user_preferences (user_id, temp_unit, wind_unit, language,
                                     time_format, update_interval, push_notifications, auto_update, offline_mode,
                                     created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         temp_unit = EXCLUDED.temp_unit,
         wind_unit = EXCLUDED.wind_unit,
         language = EXCLUDED.language,
         time_format = EXCLUDED.time_format,
         update_interval = EXCLUDED.update_interval,
         push_notifications = EXCLUDED.push_notifications,
         auto_update = EXCLUDED.auto_update,
         offline_mode = EXCLUDED.offline_mode,
         updated_at = NOW()
       RETURNING id, user_id, temp_unit, wind_unit, language,
                 time_format, update_interval, push_notifications, auto_update, offline_mode,
                 created_at, updated_at`,
      [
        userId,
        nextPreferences.tempUnit,
        nextPreferences.windUnit,
        nextPreferences.language,
        nextPreferences.timeFormat,
        nextPreferences.updateInterval,
        nextPreferences.pushNotifications,
        nextPreferences.autoUpdate,
        nextPreferences.offlineMode,
      ],
    );

    return toPreferences(result.rows[0]);
  }
}
