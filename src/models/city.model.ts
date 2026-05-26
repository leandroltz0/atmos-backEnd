/** Resultado de búsqueda de ciudad normalizado para enviar al cliente. */
export interface CitySearchResult {
  id: string;
  name: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  lat: number;
  lon: number;
}
