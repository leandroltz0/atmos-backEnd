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

export interface UserPreferencesRow {
  id: number;
  user_id: number;
  temp_unit: string | null;
  wind_unit: string | null;
  language: string | null;
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

export interface CitySearchResult {
  id: string;
  name: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  lat: number;
  lon: number;
}
