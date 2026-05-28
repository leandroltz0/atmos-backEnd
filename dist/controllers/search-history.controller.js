"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSearchHistory = exports.createSearchHistory = exports.getSearchHistory = void 0;
const searchHistoryService = __importStar(require("../services/search-history.service"));
const http_1 = require("../utils/http");
const validation_1 = require("../utils/validation");
// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
/** GET /search-history — Obtiene el historial de búsqueda del usuario. */
const getSearchHistory = async (req, res) => {
    try {
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const history = await searchHistoryService.listSearchHistory(userId);
        res.json({ history });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.getSearchHistory = getSearchHistory;
/** POST /search-history — Agrega una entrada al historial de búsqueda. */
const createSearchHistory = async (req, res) => {
    try {
        if (!(0, http_1.isRecord)(req.body)) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const name = (0, validation_1.parseRequiredString)(req.body.name, 'name', { minLength: 1, maxLength: 120 });
        const country = (0, validation_1.parseOptionalString)(req.body.country, 'country', { maxLength: 120 });
        const lat = req.body.lat === undefined ? undefined : (0, validation_1.parseNumber)(req.body.lat, 'lat');
        const lon = req.body.lon === undefined ? undefined : (0, validation_1.parseNumber)(req.body.lon, 'lon');
        const entry = await searchHistoryService.addSearchHistoryEntry(userId, {
            name,
            country,
            lat,
            lon,
        });
        res.status(201).json({ entry });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.createSearchHistory = createSearchHistory;
/** DELETE /search-history — Limpia todo el historial de búsqueda del usuario. */
const clearSearchHistory = async (req, res) => {
    try {
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        await searchHistoryService.clearSearchHistory(userId);
        res.status(204).send();
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.clearSearchHistory = clearSearchHistory;
