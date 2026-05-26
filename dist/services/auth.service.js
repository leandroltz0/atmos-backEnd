"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const http_1 = require("../utils/http");
const SALT_ROUNDS = 10;
const register = async ({ name, email, password }) => {
    const hashedPassword = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
    const result = await db_1.pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at, updated_at', [name, email, hashedPassword]);
    return result.rows[0];
};
exports.register = register;
const login = async ({ email, password }) => {
    const result = await db_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
};
exports.login = login;
const getCurrentUser = async (userId) => {
    const result = await db_1.pool.query('SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
        throw new http_1.AppError(404, 'User not found');
    }
    return user;
};
exports.getCurrentUser = getCurrentUser;
