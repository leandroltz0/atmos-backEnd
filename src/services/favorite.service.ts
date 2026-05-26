import { pool } from '../config/db';
import { FavoriteCity, FavoriteCityRow } from '../models/favorite.model';
import { AppError } from '../utils/http';

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

interface CreateFavoriteInput {
  name: string;
  country: string;
  lat: number;
  lon: number;
}



// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convierte una fila de la base de datos en una ciudad favorita normalizada. */
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

// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------

/** Obtiene todas las ciudades favoritas de un usuario, ordenadas por fecha de creación. */
export const listFavorites = async (userId: number): Promise<FavoriteCity[]> => {
  const result = await pool.query<FavoriteCityRow>(
    `SELECT id, user_id, name, country, lat, lon, is_default, created_at
     FROM favorite_cities
     WHERE user_id = $1
     ORDER BY created_at ASC NULLS LAST, id ASC`,
    [userId]
  );

  return result.rows.map((row, index) => toFavoriteCity(row, index));
};

/** Agrega una nueva ciudad favorita. Lanza error 409 si ya existe. */
export const addFavorite = async (
  userId: number,
  input: CreateFavoriteInput
): Promise<FavoriteCity> => {
  const duplicateResult = await pool.query<FavoriteCityRow>(
    `SELECT id, user_id, name, country, lat, lon, is_default, created_at
     FROM favorite_cities
     WHERE user_id = $1
       AND LOWER(name) = LOWER($2)
       AND LOWER(country) = LOWER($3)
       AND lat = $4
       AND lon = $5
     LIMIT 1`,
    [userId, input.name, input.country, input.lat, input.lon]
  );

  if (duplicateResult.rows[0]) {
    throw new AppError(409, 'Favorite city already exists');
  }

  const result = await pool.query<FavoriteCityRow>(
    `INSERT INTO favorite_cities (user_id, name, country, lat, lon, is_default, created_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
     RETURNING id, user_id, name, country, lat, lon, is_default, created_at`,
    [userId, input.name, input.country, input.lat, input.lon]
  );

  const row = result.rows[0];
  const favorites = await listFavorites(userId);
  const sortOrder = favorites.findIndex((favorite) => favorite.cityId === String(row.id));

  return toFavoriteCity(row, sortOrder >= 0 ? sortOrder : favorites.length);
};

/** Elimina una ciudad favorita por su ID. Lanza error 404 si no existe. */
export const removeFavorite = async (userId: number, cityId: string): Promise<void> => {
  const result = await pool.query('DELETE FROM favorite_cities WHERE user_id = $1 AND id = $2', [userId, Number(cityId)]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'Favorite city not found');
  }
};

/** Reordena las ciudades favoritas según el orden de IDs proporcionado. */
export const reorderFavorites = async (userId: number, orderedCityIds: string[]): Promise<FavoriteCity[]> => {
  const numericIds = orderedCityIds.map((cityId) => Number(cityId));

  if (numericIds.some((value) => !Number.isInteger(value) || value <= 0)) {
    throw new AppError(400, 'favorites must contain valid ids');
  }

  const result = await pool.query<FavoriteCityRow>(
    `SELECT id, user_id, name, country, lat, lon, is_default, created_at
     FROM favorite_cities
     WHERE user_id = $1
     ORDER BY created_at ASC NULLS LAST, id ASC`,
    [userId]
  );

  if (result.rows.length !== orderedCityIds.length) {
    throw new AppError(400, 'favorites list must include every current favorite exactly once');
  }

  const existingIds = new Set(result.rows.map((row) => row.id));

  if (numericIds.some((id) => !existingIds.has(id)) || new Set(numericIds).size !== numericIds.length) {
    throw new AppError(400, 'favorites list must include every current favorite exactly once');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (let index = 0; index < numericIds.length; index += 1) {
      await client.query(
        "UPDATE favorite_cities SET created_at = NOW() + ($1 * INTERVAL '1 second') WHERE user_id = $2 AND id = $3",
        [index, userId, numericIds[index]]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return listFavorites(userId);
};
