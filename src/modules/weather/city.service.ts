import { Injectable, BadRequestException, BadGatewayException } from '@nestjs/common';
import axios from 'axios';

export interface CitySearchResult {
  id: string;
  name: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  lat: number;
  lon: number;
}

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

const cityApi = axios.create({
  baseURL: 'https://geocoding-api.open-meteo.com/v1',
  timeout: 5000,
});

const toCitySearchResult = (result: OpenMeteoCityResult): CitySearchResult => ({
  id: String(result.id),
  name: result.name,
  country: result.country,
  countryCode: result.country_code ?? null,
  region: result.admin1 || result.admin2 || result.admin3 || result.admin4 || null,
  lat: result.latitude,
  lon: result.longitude,
});

@Injectable()
export class CityService {
  async searchCities(query: string): Promise<CitySearchResult[]> {
    if (query.trim().length < 2) {
      throw new BadRequestException('Query must contain at least 2 characters');
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
        throw new BadGatewayException('City search provider is unavailable');
      }
      throw error;
    }
  }
}
