import axios from 'axios';

import { CitySearchResult } from '../models/city.model';
import { AppError } from '../utils/http';

// ---------------------------------------------------------------------------
// Tipos de la API externa (Open-Meteo Geocoding)
// ---------------------------------------------------------------------------

interface OpenMeteoCityResult {
  id: number;
  name: string;
  country: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoCityResponse {
  results?: OpenMeteoCityResult[];
}

// ---------------------------------------------------------------------------
// Configuración del cliente HTTP
// ---------------------------------------------------------------------------

const cityApi = axios.create({
  baseURL: 'https://geocoding-api.open-meteo.com/v1',
  timeout: 5000,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convierte un resultado de la API de Open-Meteo en un `CitySearchResult` normalizado. */
const toCitySearchResult = (result: OpenMeteoCityResult): CitySearchResult => ({
  id: String(result.id),
  name: result.name,
  country: result.country,
  countryCode: result.country_code ?? null,
  region: result.admin1 || result.admin2 || result.admin3 || result.admin4 || null,
  lat: result.latitude,
  lon: result.longitude,
});

// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------

/** Busca ciudades por nombre usando la API de Open-Meteo. Requiere al menos 2 caracteres. */
export const searchCities = async (query: string): Promise<CitySearchResult[]> => {
  if (query.trim().length < 2) {
    throw new AppError(400, 'Query must contain at least 2 characters');
  }

  try {
    const response = await cityApi.get<OpenMeteoCityResponse>('/search', {
      params: {
        name: query.trim(),
        count: 10,
        language: 'en',
        format: 'json',
      },
    });

    return (response.data.results ?? []).map(toCitySearchResult);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError(502, 'City search provider is unavailable');
    }

    throw error;
  }
};
