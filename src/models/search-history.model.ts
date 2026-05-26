/** Fila cruda de la tabla `search_history` en la base de datos. */
export interface SearchHistoryRow {
  id: number;
  user_id: number;
  city_name: string;
  country: string | null;
  lat: string | number | null;
  lon: string | number | null;
  searched_at: Date | null;
}

/** Entrada del historial de búsqueda normalizada para enviar al cliente. */
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
