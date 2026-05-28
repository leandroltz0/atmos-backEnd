"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAirQuality = exports.getForecastWeather = exports.getCurrentWeather = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../config/db");
const http_1 = require("../utils/http");
// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const CURRENT_CACHE_TTL_MINUTES = 10;
const FORECAST_CACHE_TTL_MINUTES = 30;
const AIR_QUALITY_CACHE_TTL_MINUTES = 10;
// ---------------------------------------------------------------------------
// Configuración del cliente HTTP
// ---------------------------------------------------------------------------
const weatherApi = axios_1.default.create({
    baseURL: 'https://api.open-meteo.com/v1',
    timeout: 7000,
});
const airQualityApi = axios_1.default.create({
    baseURL: 'https://air-quality-api.open-meteo.com/v1',
    timeout: 7000,
});
// ---------------------------------------------------------------------------
// Variables de la API (query params)
// ---------------------------------------------------------------------------
const currentVariables = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'is_day',
    'precipitation',
    'uv_index',
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
const hourlyVariables = [
    'temperature_2m',
    'weather_code',
    'precipitation_probability',
].join(',');
// ---------------------------------------------------------------------------
// Normalizers (API externa → respuesta pública)
// ---------------------------------------------------------------------------
/** Normaliza la respuesta de clima actual de Open-Meteo al formato público. */
const normalizeCurrent = (data, source) => {
    if (!data.current) {
        throw new http_1.AppError(502, 'Weather provider returned no current weather data');
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
            uv_index: data.current.uv_index,
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
/** Normaliza la respuesta de pronóstico de Open-Meteo al formato público. */
const normalizeForecast = (data, source) => ({
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
            uv_index: data.current.uv_index,
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
    hourly: (data.hourly?.time ?? []).map((time, index) => ({
        time,
        temperature: data.hourly?.temperature_2m[index] ?? 0,
        weatherCode: data.hourly?.weather_code[index] ?? 0,
        precipitationProbability: data.hourly?.precipitation_probability[index] ?? 0,
    })),
    meta: {
        source,
        cacheTtlMinutes: FORECAST_CACHE_TTL_MINUTES,
    },
});
const hasCurrentDashboardData = (weather) => typeof weather.current.uv_index === 'number';
const hasForecastDashboardData = (weather) => Array.isArray(weather.hourly) && weather.hourly.length >= 48;
// ---------------------------------------------------------------------------
// Caché helpers
// ---------------------------------------------------------------------------
/** Busca datos de clima en caché. Retorna null si no hay caché válido. */
const getCachedWeather = async (lat, lon, type) => {
    const result = await db_1.pool.query(`SELECT id, lat, lon, data, fetched_at, expires_at
     FROM weather_cache
     WHERE lat = $1
       AND lon = $2
       AND expires_at > NOW()
       AND data->>'type' = $3
     ORDER BY fetched_at DESC NULLS LAST, id DESC
     LIMIT 1`, [lat, lon, type]);
    const row = result.rows[0];
    if (!row?.data?.payload) {
        return null;
    }
    return row.data.payload;
};
/** Guarda datos de clima en caché con un TTL en minutos. */
const setCachedWeather = async (lat, lon, type, payload, ttlMinutes) => {
    await db_1.pool.query(`INSERT INTO weather_cache (lat, lon, data, fetched_at, expires_at)
     VALUES ($1, $2, $3::jsonb, NOW(), NOW() + ($4 * INTERVAL '1 minute'))`, [lat, lon, JSON.stringify({ type, payload }), ttlMinutes]);
};
// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------
/** Obtiene el clima actual para una coordenada. Usa caché si está disponible. */
const getCurrentWeather = async (lat, lon) => {
    const cachedWeather = await getCachedWeather(lat, lon, 'current');
    if (cachedWeather && hasCurrentDashboardData(cachedWeather)) {
        return {
            ...cachedWeather,
            meta: {
                ...cachedWeather.meta,
                source: 'cache',
            },
        };
    }
    try {
        const response = await weatherApi.get('/forecast', {
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
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new http_1.AppError(502, 'Weather provider is unavailable');
        }
        throw error;
    }
};
exports.getCurrentWeather = getCurrentWeather;
/** Obtiene el pronóstico de 7 días para una coordenada. Usa caché si está disponible. */
const getForecastWeather = async (lat, lon) => {
    const cachedWeather = await getCachedWeather(lat, lon, 'forecast');
    if (cachedWeather && hasForecastDashboardData(cachedWeather)) {
        return {
            ...cachedWeather,
            meta: {
                ...cachedWeather.meta,
                source: 'cache',
            },
        };
    }
    try {
        const response = await weatherApi.get('/forecast', {
            params: {
                latitude: lat,
                longitude: lon,
                current: currentVariables,
                daily: dailyVariables,
                hourly: hourlyVariables,
                forecast_days: 7,
                timezone: 'auto',
            },
        });
        const forecast = normalizeForecast(response.data, 'live');
        await setCachedWeather(lat, lon, 'forecast', forecast, FORECAST_CACHE_TTL_MINUTES);
        return forecast;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new http_1.AppError(502, 'Weather provider is unavailable');
        }
        throw error;
    }
};
exports.getForecastWeather = getForecastWeather;
/** Obtiene el índice europeo de calidad de aire para una coordenada. Usa caché si está disponible. */
const getAirQuality = async (lat, lon) => {
    const cachedAirQuality = await getCachedWeather(lat, lon, 'air-quality');
    if (cachedAirQuality) {
        return cachedAirQuality;
    }
    try {
        const response = await airQualityApi.get('/air-quality', {
            params: {
                latitude: lat,
                longitude: lon,
                current: 'european_aqi',
            },
        });
        const aqi = response.data.current?.european_aqi;
        if (aqi === undefined) {
            throw new http_1.AppError(502, 'Weather provider returned no air quality data');
        }
        const airQuality = { aqi };
        await setCachedWeather(lat, lon, 'air-quality', airQuality, AIR_QUALITY_CACHE_TTL_MINUTES);
        return airQuality;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new http_1.AppError(502, 'Weather provider is unavailable');
        }
        throw error;
    }
};
exports.getAirQuality = getAirQuality;
