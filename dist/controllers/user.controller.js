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
exports.deleteMe = exports.updatePassword = exports.updateMe = exports.getMe = void 0;
const userService = __importStar(require("../services/user.service"));
const http_1 = require("../utils/http");
const user_1 = require("../utils/user");
const validation_1 = require("../utils/validation");
// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
/** GET /users/me — Obtiene el perfil del usuario autenticado. */
const getMe = async (req, res) => {
    try {
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const user = await userService.getCurrentUserProfile(userId);
        res.json({ user: (0, user_1.toPublicUser)(user) });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.getMe = getMe;
/** PATCH /users/me — Actualiza el nombre del usuario. */
const updateMe = async (req, res) => {
    try {
        if (!(0, http_1.isRecord)(req.body)) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const nextNameValue = req.body.displayName ?? req.body.name;
        const name = (0, validation_1.parseRequiredString)(nextNameValue, 'name', { minLength: 2, maxLength: 100 });
        const user = await userService.updateCurrentUserProfile(userId, name);
        res.json({ user: (0, user_1.toPublicUser)(user) });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.updateMe = updateMe;
/** PATCH /users/me/password — Cambia la contraseña del usuario. */
const updatePassword = async (req, res) => {
    try {
        if (!(0, http_1.isRecord)(req.body)) {
            res.status(401).json({ error: 'the resquest body is not valid' });
            return;
        }
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const currentPassword = (0, validation_1.parsePassword)(req.body.currentPassword, 'currentPassword');
        const newPassword = (0, validation_1.parsePassword)(req.body.newPassword, 'newPassword');
        await userService.updateCurrentUserPassword(userId, currentPassword, newPassword);
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.updatePassword = updatePassword;
/** DELETE /users/me — Elimina la cuenta del usuario y todos sus datos. */
const deleteMe = async (req, res) => {
    try {
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        await userService.deleteCurrentUser(userId);
        res.status(204).send();
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.deleteMe = deleteMe;
