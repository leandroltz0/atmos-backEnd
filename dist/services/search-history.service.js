"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSearchHistory = exports.addSearchHistoryEntry = exports.listSearchHistory = void 0;
const db_1 = require("../config/db");
// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------
const SEARCH_HISTORY_LIMIT = 10;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Convierte una fila de la base de datos en una entrada de historial normalizada. */
const toSearchHistoryEntry = (row) => ({
    cityId: String(row.id),
    label: row.city_name,
    name: row.city_name,
    country: row.country,
    countryCode: null,
    lat: row.lat === null ? null : Number(row.lat),
    lon: row.lon === null ? null : Number(row.lon),
    searchedAt: row.searched_at,
});
// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------
/** Obtiene el historial de búsqueda del usuario, ordenado por fecha descendente. */
const listSearchHistory = async (userId) => {
    const result = await db_1.pool.query(`SELECT id, user_id, city_name, country, lat, lon, searched_at
     FROM search_history
     WHERE user_id = $1
     ORDER BY searched_at DESC NULLS LAST, id DESC`, [userId]);
    return result.rows.map(toSearchHistoryEntry);
};
exports.listSearchHistory = listSearchHistory;
/**
 * Agrega o actualiza una entrada en el historial de búsqueda.
 * Si ya existe una entrada idéntica, actualiza su fecha. Mantiene un máximo de 10 entradas.
 */
const addSearchHistoryEntry = async (userId, input) => {
    const existingResult = await db_1.pool.query(`SELECT id, user_id, city_name, country, lat, lon, searched_at
     FROM search_history
     WHERE user_id = $1
       AND LOWER(city_name) = LOWER($2)
       AND COALESCE(LOWER(country), '') = COALESCE(LOWER($3), '')
       AND COALESCE(lat, -9999) = COALESCE($4, -9999)
       AND COALESCE(lon, -9999) = COALESCE($5, -9999)
     LIMIT 1`, [userId, input.name, input.country ?? null, input.lat ?? null, input.lon ?? null]);
    let row;
    if (existingResult.rows[0]) {
        const updateResult = await db_1.pool.query(`UPDATE search_history
       SET searched_at = NOW(), city_name = $1, country = $2, lat = $3, lon = $4
       WHERE id = $5
       RETURNING id, user_id, city_name, country, lat, lon, searched_at`, [input.name, input.country ?? null, input.lat ?? null, input.lon ?? null, existingResult.rows[0].id]);
        row = updateResult.rows[0];
    }
    else {
        const insertResult = await db_1.pool.query(`INSERT INTO search_history (user_id, city_name, country, lat, lon, searched_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, city_name, country, lat, lon, searched_at`, [userId, input.name, input.country ?? null, input.lat ?? null, input.lon ?? null]);
        row = insertResult.rows[0];
    }
    await db_1.pool.query(`DELETE FROM search_history
     WHERE user_id = $1
       AND id NOT IN (
         SELECT id
         FROM search_history
         WHERE user_id = $1
         ORDER BY searched_at DESC NULLS LAST, id DESC
         LIMIT $2
       )`, [userId, SEARCH_HISTORY_LIMIT]);
    return toSearchHistoryEntry(row);
};
exports.addSearchHistoryEntry = addSearchHistoryEntry;
/** Elimina todo el historial de búsqueda del usuario. */
const clearSearchHistory = async (userId) => {
    await db_1.pool.query('DELETE FROM search_history WHERE user_id = $1', [userId]);
};
exports.clearSearchHistory = clearSearchHistory;
