"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCities = void 0;
const axios_1 = __importDefault(require("axios"));
const http_1 = require("../utils/http");
const cityApi = axios_1.default.create({
    baseURL: 'https://geocoding-api.open-meteo.com/v1',
    timeout: 5000,
});
const toCitySearchResult = (result) => ({
    id: String(result.id),
    name: result.name,
    country: result.country,
    countryCode: result.country_code ?? null,
    region: result.admin1 || result.admin2 || result.admin3 || result.admin4 || null,
    lat: result.latitude,
    lon: result.longitude,
});
const searchCities = async (query) => {
    if (query.trim().length < 2) {
        throw new http_1.AppError(400, 'Query must contain at least 2 characters');
    }
    try {
        const response = await cityApi.get('/search', {
            params: {
                name: query.trim(),
                count: 10,
                language: 'en',
                format: 'json',
            },
        });
        return (response.data.results ?? []).map(toCitySearchResult);
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new http_1.AppError(502, 'City search provider is unavailable');
        }
        throw error;
    }
};
exports.searchCities = searchCities;
