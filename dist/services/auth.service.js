"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const SALT_ROUNDS = 10;
const register = async ({ email, password }) => {
    const hashedPassword = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
    const result = await db_1.pool.query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at', [email, hashedPassword]);
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
