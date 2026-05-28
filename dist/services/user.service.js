"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCurrentUser = exports.updateCurrentUserPassword = exports.updateCurrentUserProfile = exports.getCurrentUserProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const http_1 = require("../utils/http");
// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const SALT_ROUNDS = 10;
// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------
/** Obtiene el perfil del usuario actual (sin contraseña). Lanza error 404 si no existe. */
const getCurrentUserProfile = async (userId) => {
    const result = await db_1.pool.query('SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
        throw new http_1.AppError(404, 'User not found');
    }
    return user;
};
exports.getCurrentUserProfile = getCurrentUserProfile;
/** Actualiza el nombre del usuario. Lanza error 404 si no existe. */
const updateCurrentUserProfile = async (userId, name) => {
    const result = await db_1.pool.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, created_at, updated_at', [name, userId]);
    const user = result.rows[0];
    if (!user) {
        throw new http_1.AppError(404, 'User not found');
    }
    return user;
};
exports.updateCurrentUserProfile = updateCurrentUserProfile;
/** Cambia la contraseña del usuario después de verificar la contraseña actual. */
const updateCurrentUserPassword = async (userId, currentPassword, newPassword) => {
    const result = await db_1.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
        throw new http_1.AppError(404, 'User not found');
    }
    const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isValidPassword) {
        throw new http_1.AppError(401, 'Current password is incorrect');
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, SALT_ROUNDS);
    await db_1.pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
};
exports.updateCurrentUserPassword = updateCurrentUserPassword;
/**
 * Elimina la cuenta del usuario y todos sus datos asociados en una transacción.
 * Orden: favoritos → historial → preferencias → usuario.
 */
const deleteCurrentUser = async (userId) => {
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM favorite_cities WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM search_history WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
        const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0) {
            throw new http_1.AppError(404, 'User not found');
        }
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.deleteCurrentUser = deleteCurrentUser;
