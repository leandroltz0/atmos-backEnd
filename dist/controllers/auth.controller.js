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
exports.logout = exports.me = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
const http_1 = require("../utils/http");
const user_1 = require("../utils/user");
const validation_1 = require("../utils/validation");
// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
/** POST /auth/register — Registra un nuevo usuario. */
const register = async (req, res) => {
    try {
        const name = (0, validation_1.parseRequiredString)(req.body.name, 'name', { minLength: 2, maxLength: 100 });
        const email = (0, validation_1.parseRequiredString)(req.body.email, 'email', { minLength: 5, maxLength: 255 });
        const password = (0, validation_1.parsePassword)(req.body.password, 'password');
        const user = await authService.register({ name, email, password });
        res.status(201).json({ user });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.register = register;
/** POST /auth/login — Autentica un usuario y retorna un JWT. */
const login = async (req, res) => {
    try {
        const email = (0, validation_1.parseRequiredString)(req.body.email, 'email');
        const password = (0, validation_1.parseRequiredString)(req.body.password, 'password');
        const { token, user } = await authService.login({ email, password });
        res.json({ token, user });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.login = login;
/** GET /auth/me — Retorna los datos del usuario autenticado. */
const me = async (req, res) => {
    try {
        const userId = (0, http_1.getAuthenticatedUserId)(req);
        const user = await authService.getCurrentUser(userId);
        res.json({ user: (0, user_1.toPublicUser)(user) });
    }
    catch (error) {
        (0, http_1.handleControllerError)(res, error);
    }
};
exports.me = me;
/** POST /auth/logout — Logout (manejado del lado del cliente). */
const logout = async (_req, res) => {
    res.json({
        message: 'Logout handled client-side by removing the bearer token',
    });
};
exports.logout = logout;
