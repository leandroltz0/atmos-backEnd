"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = void 0;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Convierte un usuario de la base de datos (snake_case) a formato público (camelCase). */
const toPublicUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.name,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
});
exports.toPublicUser = toPublicUser;
