import { pool } from '../config/db';
import { UserPreferences, UserPreferencesRow } from '../models/app.model';

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
  timeFormat: DEFAULT_PREFERENCES.timeFormat,
  updateInterval: DEFAULT_PREFERENCES.updateInterval,
  pushNotifications: DEFAULT_PREFERENCES.pushNotifications,
  autoUpdate: DEFAULT_PREFERENCES.autoUpdate,
  offlineMode: DEFAULT_PREFERENCES.offlineMode,
});

export const getPreferences = async (userId: number): Promise<UserPreferences> => {
  const result = await pool.query<UserPreferencesRow>(
    `SELECT id, user_id, temp_unit, wind_unit, language, created_at, updated_at
     FROM user_preferences
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];

  if (row) {
    return toPreferences(row);
  }

  await pool.query(
    `INSERT INTO user_preferences (user_id, temp_unit, wind_unit, language, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, DEFAULT_PREFERENCES.tempUnit, DEFAULT_PREFERENCES.windUnit, DEFAULT_PREFERENCES.language]
  );

  return DEFAULT_PREFERENCES;
};

export const updatePreferences = async (
  userId: number,
  patch: PreferencePatchInput
): Promise<UserPreferences> => {
  const currentPreferences = await getPreferences(userId);
  const nextPreferences: UserPreferences = {
    ...currentPreferences,
    ...patch,
  };

  const result = await pool.query<UserPreferencesRow>(
    `INSERT INTO user_preferences (user_id, temp_unit, wind_unit, language, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       temp_unit = EXCLUDED.temp_unit,
       wind_unit = EXCLUDED.wind_unit,
       language = EXCLUDED.language,
       updated_at = NOW()
     RETURNING id, user_id, temp_unit, wind_unit, language, created_at, updated_at`,
    [userId, nextPreferences.tempUnit, nextPreferences.windUnit, nextPreferences.language]
  );

  return {
    ...toPreferences(result.rows[0]),
    timeFormat: nextPreferences.timeFormat,
    updateInterval: nextPreferences.updateInterval,
    pushNotifications: nextPreferences.pushNotifications,
    autoUpdate: nextPreferences.autoUpdate,
    offlineMode: nextPreferences.offlineMode,
  };
};
