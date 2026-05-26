/** Fila cruda de la tabla `favorite_cities` en la base de datos. */
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

/** Ciudad favorita normalizada para enviar al cliente. */
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
