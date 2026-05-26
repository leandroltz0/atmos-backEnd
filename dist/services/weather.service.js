"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForecastWeather = exports.getCurrentWeather = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../config/db");
const http_1 = require("../utils/http");
const CURRENT_CACHE_TTL_MINUTES = 10;
const FORECAST_CACHE_TTL_MINUTES = 30;
const weatherApi = axios_1.default.create({
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
const setCachedWeather = async (lat, lon, type, payload, ttlMinutes) => {
    await db_1.pool.query(`INSERT INTO weather_cache (lat, lon, data, fetched_at, expires_at)
     VALUES ($1, $2, $3::jsonb, NOW(), NOW() + ($4 * INTERVAL '1 minute'))`, [lat, lon, JSON.stringify({ type, payload }), ttlMinutes]);
};
const getCurrentWeather = async (lat, lon) => {
    const cachedWeather = await getCachedWeather(lat, lon, 'current');
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
const getForecastWeather = async (lat, lon) => {
    const cachedWeather = await getCachedWeather(lat, lon, 'forecast');
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
        const response = await weatherApi.get('/forecast', {
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
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new http_1.AppError(502, 'Weather provider is unavailable');
        }
        throw error;
    }
};
exports.getForecastWeather = getForecastWeather;
