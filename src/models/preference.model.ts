/** Fila cruda de la tabla `user_preferences` en la base de datos. */
export interface UserPreferencesRow {
  id: number;
  user_id: number;
  temp_unit: string | null;
  wind_unit: string | null;
  language: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

/** Preferencias del usuario normalizadas para enviar al cliente. */
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
