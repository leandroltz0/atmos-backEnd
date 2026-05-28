"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderFavorites = exports.removeFavorite = exports.addFavorite = exports.listFavorites = void 0;
const db_1 = require("../config/db");
const http_1 = require("../utils/http");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Convierte una fila de la base de datos en una ciudad favorita normalizada. */
const toFavoriteCity = (row, sortOrder) => ({
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
// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------
/** Obtiene todas las ciudades favoritas de un usuario, ordenadas por fecha de creación. */
const listFavorites = async (userId) => {
    const result = await db_1.pool.query(`SELECT id, user_id, name, country, lat, lon, is_default, created_at
     FROM favorite_cities
     WHERE user_id = $1
     ORDER BY created_at ASC NULLS LAST, id ASC`, [userId]);
    return result.rows.map((row, index) => toFavoriteCity(row, index));
};
exports.listFavorites = listFavorites;
/** Agrega una nueva ciudad favorita. Lanza error 409 si ya existe. */
const addFavorite = async (userId, input) => {
    const duplicateResult = await db_1.pool.query(`SELECT id, user_id, name, country, lat, lon, is_default, created_at
     FROM favorite_cities
     WHERE user_id = $1
       AND LOWER(name) = LOWER($2)
       AND LOWER(country) = LOWER($3)
       AND lat = $4
       AND lon = $5
     LIMIT 1`, [userId, input.name, input.country, input.lat, input.lon]);
    if (duplicateResult.rows[0]) {
        throw new http_1.AppError(409, 'Favorite city already exists');
    }
    const result = await db_1.pool.query(`INSERT INTO favorite_cities (user_id, name, country, lat, lon, is_default, created_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
     RETURNING id, user_id, name, country, lat, lon, is_default, created_at`, [userId, input.name, input.country, input.lat, input.lon]);
    const row = result.rows[0];
    const favorites = await (0, exports.listFavorites)(userId);
    const sortOrder = favorites.findIndex((favorite) => favorite.cityId === String(row.id));
    return toFavoriteCity(row, sortOrder >= 0 ? sortOrder : favorites.length);
};
exports.addFavorite = addFavorite;
/** Elimina una ciudad favorita por su ID. Lanza error 404 si no existe. */
const removeFavorite = async (userId, cityId) => {
    const result = await db_1.pool.query('DELETE FROM favorite_cities WHERE user_id = $1 AND id = $2', [userId, Number(cityId)]);
    if (result.rowCount === 0) {
        throw new http_1.AppError(404, 'Favorite city not found');
    }
};
exports.removeFavorite = removeFavorite;
/** Reordena las ciudades favoritas según el orden de IDs proporcionado. */
const reorderFavorites = async (userId, orderedCityIds) => {
    const numericIds = orderedCityIds.map((cityId) => Number(cityId));
    if (numericIds.some((value) => !Number.isInteger(value) || value <= 0)) {
        throw new http_1.AppError(400, 'favorites must contain valid ids');
    }
    const result = await db_1.pool.query(`SELECT id, user_id, name, country, lat, lon, is_default, created_at
     FROM favorite_cities
     WHERE user_id = $1
     ORDER BY created_at ASC NULLS LAST, id ASC`, [userId]);
    if (result.rows.length !== orderedCityIds.length) {
        throw new http_1.AppError(400, 'favorites list must include every current favorite exactly once');
    }
    const existingIds = new Set(result.rows.map((row) => row.id));
    if (numericIds.some((id) => !existingIds.has(id)) || new Set(numericIds).size !== numericIds.length) {
        throw new http_1.AppError(400, 'favorites list must include every current favorite exactly once');
    }
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        for (let index = 0; index < numericIds.length; index += 1) {
            await client.query("UPDATE favorite_cities SET created_at = NOW() + ($1 * INTERVAL '1 second') WHERE user_id = $2 AND id = $3", [index, userId, numericIds[index]]);
        }
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
    return (0, exports.listFavorites)(userId);
};
exports.reorderFavorites = reorderFavorites;
