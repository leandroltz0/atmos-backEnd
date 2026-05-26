import axios from 'axios';
import { pool } from '../config/db';
import { AppError } from '../utils/http';

type WeatherCacheType = 'current' | 'forecast';

interface WeatherCacheRow {
  id: number;
  lat: string | number;
  lon: string | number;
  data: {
    type?: WeatherCacheType;
    payload?: WeatherCurrentResponse | WeatherForecastResponse;
  };
  fetched_at: Date | null;
  expires_at: Date;
}

interface OpenMeteoCurrentResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation?: string;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
}

interface OpenMeteoForecastResponse extends OpenMeteoCurrentResponse {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface WeatherCurrentResponse {
  location: {
    lat: number;
    lon: number;
    timezone: string;
    timezoneAbbreviation: string | null;
  };
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    isDay: boolean;
    cloudCover: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
  };
  meta: {
    source: 'cache' | 'live';
    cacheTtlMinutes: number;
  };
}

export interface WeatherForecastResponse {
  location: {
    lat: number;
    lon: number;
    timezone: string;
    timezoneAbbreviation: string | null;
  };
  current: WeatherCurrentResponse['current'] | null;
  forecast: Array<{
    date: string;
    weatherCode: number;
    temperatureMax: number;
    temperatureMin: number;
    apparentTemperatureMax: number;
    apparentTemperatureMin: number;
    precipitationSum: number;
    precipitationProbabilityMax: number;
    windSpeedMax: number;
    windGustsMax: number;
    windDirectionDominant: number;
    sunrise: string;
    sunset: string;
  }>;
  meta: {
    source: 'cache' | 'live';
    cacheTtlMinutes: number;
  };
}

const CURRENT_CACHE_TTL_MINUTES = 10;
const FORECAST_CACHE_TTL_MINUTES = 30;

const weatherApi = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 7000,
});

const currentVariables = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
].join(',');

const dailyVariables = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
  'sunrise',
  'sunset',
].join(',');

const normalizeCurrent = (
  data: OpenMeteoCurrentResponse,
  source: 'cache' | 'live'
): WeatherCurrentResponse => {
  if (!data.current) {
    throw new AppError(502, 'Weather provider returned no current weather data');
  }

  return {
    location: {
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.timezone,
      timezoneAbbreviation: data.timezone_abbreviation ?? null,
    },
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      cloudCover: data.current.cloud_cover,
      pressure: data.current.pressure_msl,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
    },
    meta: {
      source,
      cacheTtlMinutes: CURRENT_CACHE_TTL_MINUTES,
    },
  };
};

const normalizeForecast = (
  data: OpenMeteoForecastResponse,
  source: 'cache' | 'live'
): WeatherForecastResponse => ({
  location: {
    lat: data.latitude,
    lon: data.longitude,
    timezone: data.timezone,
    timezoneAbbreviation: data.timezone_abbreviation ?? null,
  },
  current: data.current
    ? {
        time: data.current.time,
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
        cloudCover: data.current.cloud_cover,
        pressure: data.current.pressure_msl,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        windGusts: data.current.wind_gusts_10m,
      }
    : null,
  forecast: (data.daily?.time ?? []).map((date, index) => ({
    date,
    weatherCode: data.daily?.weather_code[index] ?? 0,
    temperatureMax: data.daily?.temperature_2m_max[index] ?? 0,
    temperatureMin: data.daily?.temperature_2m_min[index] ?? 0,
    apparentTemperatureMax: data.daily?.apparent_temperature_max[index] ?? 0,
    apparentTemperatureMin: data.daily?.apparent_temperature_min[index] ?? 0,
    precipitationSum: data.daily?.precipitation_sum[index] ?? 0,
    precipitationProbabilityMax: data.daily?.precipitation_probability_max[index] ?? 0,
    windSpeedMax: data.daily?.wind_speed_10m_max[index] ?? 0,
    windGustsMax: data.daily?.wind_gusts_10m_max[index] ?? 0,
    windDirectionDominant: data.daily?.wind_direction_10m_dominant[index] ?? 0,
    sunrise: data.daily?.sunrise[index] ?? '',
    sunset: data.daily?.sunset[index] ?? '',
  })),
  meta: {
    source,
    cacheTtlMinutes: FORECAST_CACHE_TTL_MINUTES,
  },
});

const getCachedWeather = async <T>(lat: number, lon: number, type: WeatherCacheType): Promise<T | null> => {
  const result = await pool.query<WeatherCacheRow>(
    `SELECT id, lat, lon, data, fetched_at, expires_at
     FROM weather_cache
     WHERE lat = $1
       AND lon = $2
       AND expires_at > NOW()
       AND data->>'type' = $3
     ORDER BY fetched_at DESC NULLS LAST, id DESC
     LIMIT 1`,
    [lat, lon, type]
  );

  const row = result.rows[0];

  if (!row?.data?.payload) {
    return null;
  }

  return row.data.payload as T;
};

const setCachedWeather = async (
  lat: number,
  lon: number,
  type: WeatherCacheType,
  payload: WeatherCurrentResponse | WeatherForecastResponse,
  ttlMinutes: number
): Promise<void> => {
  await pool.query(
    `INSERT INTO weather_cache (lat, lon, data, fetched_at, expires_at)
     VALUES ($1, $2, $3::jsonb, NOW(), NOW() + ($4 * INTERVAL '1 minute'))`,
    [lat, lon, JSON.stringify({ type, payload }), ttlMinutes]
  );
};

export const getCurrentWeather = async (
  lat: number,
  lon: number
): Promise<WeatherCurrentResponse> => {
  const cachedWeather = await getCachedWeather<WeatherCurrentResponse>(lat, lon, 'current');

  if (cachedWeather) {
    return {
      ...cachedWeather,
      meta: {
        ...cachedWeather.meta,
        source: 'cache',
      },
    };
  }

  try {
    const response = await weatherApi.get<OpenMeteoCurrentResponse>('/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current: currentVariables,
        timezone: 'auto',
      },
    });

    const weather = normalizeCurrent(response.data, 'live');
    await setCachedWeather(lat, lon, 'current', weather, CURRENT_CACHE_TTL_MINUTES);

    return weather;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError(502, 'Weather provider is unavailable');
    }

    throw error;
  }
};

export const getForecastWeather = async (
  lat: number,
  lon: number
): Promise<WeatherForecastResponse> => {
  const cachedWeather = await getCachedWeather<WeatherForecastResponse>(lat, lon, 'forecast');

  if (cachedWeather) {
    return {
      ...cachedWeather,
      meta: {
        ...cachedWeather.meta,
        source: 'cache',
      },
    };
  }

  try {
    const response = await weatherApi.get<OpenMeteoForecastResponse>('/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current: currentVariables,
        daily: dailyVariables,
        forecast_days: 7,
        timezone: 'auto',
      },
    });

    const forecast = normalizeForecast(response.data, 'live');
    await setCachedWeather(lat, lon, 'forecast', forecast, FORECAST_CACHE_TTL_MINUTES);

    return forecast;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError(502, 'Weather provider is unavailable');
    }

    throw error;
  }
};
