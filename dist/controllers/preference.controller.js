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
exports.updatePreferences = exports.getPreferences = void 0;
const preferenceService = __importStar(require("../services/preference.service"));
const http_1 = require("../utils/http");
const validation_1 = require("../utils/validation");
// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
/** GET /preferences — Obtiene las preferencias del usuario. */
const getPreferences = async (req, res) => {
    try {
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const preferences = await preferenceService.getPreferences(userId);
        res.json({ preferences });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.getPreferences = getPreferences;
/** PATCH /preferences — Actualiza parcialmente las preferencias del usuario. */
const updatePreferences = async (req, res) => {
    try {
        if (!(0, http_1.isRecord)(req.body)) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const preferences = await preferenceService.updatePreferences(userId, {
            tempUnit: (0, validation_1.parseOptionalString)(req.body.tempUnit, 'tempUnit', { maxLength: 20 }),
            windUnit: (0, validation_1.parseOptionalString)(req.body.windUnit, 'windUnit', { maxLength: 20 }),
            language: (0, validation_1.parseOptionalString)(req.body.language, 'language', { maxLength: 20 }),
            timeFormat: (0, validation_1.parseOptionalString)(req.body.timeFormat, 'timeFormat', { maxLength: 20 }),
            updateInterval: (0, validation_1.parseOptionalInteger)(req.body.updateInterval, 'updateInterval', { min: 1, max: 1440 }),
            pushNotifications: (0, validation_1.parseOptionalBoolean)(req.body.pushNotifications, 'pushNotifications'),
            autoUpdate: (0, validation_1.parseOptionalBoolean)(req.body.autoUpdate, 'autoUpdate'),
            offlineMode: (0, validation_1.parseOptionalBoolean)(req.body.offlineMode, 'offlineMode'),
        });
        res.json({ preferences });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.updatePreferences = updatePreferences;
