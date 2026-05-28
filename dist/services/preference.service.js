"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferences = exports.getPreferences = void 0;
const db_1 = require("../config/db");
// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const DEFAULT_PREFERENCES = {
    tempUnit: 'celsius',
    windUnit: 'kmh',
    language: 'en',
    timeFormat: '24h',
    updateInterval: 30,
    pushNotifications: false,
    autoUpdate: true,
    offlineMode: false,
};
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Convierte una fila de la base de datos en preferencias normalizadas, aplicando valores por defecto. */
const toPreferences = (row) => ({
    tempUnit: row?.temp_unit ?? DEFAULT_PREFERENCES.tempUnit,
    windUnit: row?.wind_unit ?? DEFAULT_PREFERENCES.windUnit,
    language: row?.language ?? DEFAULT_PREFERENCES.language,
    timeFormat: DEFAULT_PREFERENCES.timeFormat,
    updateInterval: DEFAULT_PREFERENCES.updateInterval,
    pushNotifications: DEFAULT_PREFERENCES.pushNotifications,
    autoUpdate: DEFAULT_PREFERENCES.autoUpdate,
    offlineMode: DEFAULT_PREFERENCES.offlineMode,
});
// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------
/** Obtiene las preferencias del usuario. Crea valores por defecto si no existen. */
const getPreferences = async (userId) => {
    const result = await db_1.pool.query(`SELECT id, user_id, temp_unit, wind_unit, language, created_at, updated_at
     FROM user_preferences
     WHERE user_id = $1`, [userId]);
    const row = result.rows[0];
    if (row) {
        return toPreferences(row);
    }
    await db_1.pool.query(`INSERT INTO user_preferences (user_id, temp_unit, wind_unit, language, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`, [userId, DEFAULT_PREFERENCES.tempUnit, DEFAULT_PREFERENCES.windUnit, DEFAULT_PREFERENCES.language]);
    return DEFAULT_PREFERENCES;
};
exports.getPreferences = getPreferences;
/** Actualiza parcialmente las preferencias del usuario (merge con valores actuales). */
const updatePreferences = async (userId, patch) => {
    const currentPreferences = await (0, exports.getPreferences)(userId);
    const nextPreferences = {
        ...currentPreferences,
        ...patch,
    };
    const result = await db_1.pool.query(`INSERT INTO user_preferences (user_id, temp_unit, wind_unit, language, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       temp_unit = EXCLUDED.temp_unit,
       wind_unit = EXCLUDED.wind_unit,
       language = EXCLUDED.language,
       updated_at = NOW()
     RETURNING id, user_id, temp_unit, wind_unit, language, created_at, updated_at`, [userId, nextPreferences.tempUnit, nextPreferences.windUnit, nextPreferences.language]);
    return {
        ...toPreferences(result.rows[0]),
        timeFormat: nextPreferences.timeFormat,
        updateInterval: nextPreferences.updateInterval,
        pushNotifications: nextPreferences.pushNotifications,
        autoUpdate: nextPreferences.autoUpdate,
        offlineMode: nextPreferences.offlineMode,
    };
};
exports.updatePreferences = updatePreferences;
