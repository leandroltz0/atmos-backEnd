"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePassword = exports.parseOptionalBoolean = exports.parseOptionalInteger = exports.parseNumber = exports.parseOptionalString = exports.parseRequiredString = void 0;
const http_1 = require("./http");
// ---------------------------------------------------------------------------
// Validadores de strings
// ---------------------------------------------------------------------------
/** Valida y retorna un string requerido (trimmed). Lanza 400 si falta o no cumple las restricciones. */
const parseRequiredString = (value, fieldName, options = {}) => {
    if (typeof value !== 'string') {
        throw new http_1.AppError(400, `${fieldName} must be a string`);
    }
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        throw new http_1.AppError(400, `${fieldName} is required`);
    }
    if (options.minLength !== undefined && trimmedValue.length < options.minLength) {
        throw new http_1.AppError(400, `${fieldName} must be at least ${options.minLength} characters`);
    }
    if (options.maxLength !== undefined && trimmedValue.length > options.maxLength) {
        throw new http_1.AppError(400, `${fieldName} must be at most ${options.maxLength} characters`);
    }
    return trimmedValue;
};
exports.parseRequiredString = parseRequiredString;
/** Valida y retorna un string opcional. Retorna undefined si el valor es null/undefined. */
const parseOptionalString = (value, fieldName, options = {}) => {
    if (value === undefined || value === null) {
        return undefined;
    }
    return (0, exports.parseRequiredString)(value, fieldName, options);
};
exports.parseOptionalString = parseOptionalString;
// ---------------------------------------------------------------------------
// Validadores numéricos
// ---------------------------------------------------------------------------
/** Valida y retorna un número finito. Acepta strings numéricas. */
const parseNumber = (value, fieldName) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
        throw new http_1.AppError(400, `${fieldName} must be a valid number`);
    }
    return numericValue;
};
exports.parseNumber = parseNumber;
/** Valida y retorna un entero opcional con restricciones de rango. */
const parseOptionalInteger = (value, fieldName, options = {}) => {
    if (value === undefined || value === null) {
        return undefined;
    }
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(numericValue)) {
        throw new http_1.AppError(400, `${fieldName} must be an integer`);
    }
    if (options.min !== undefined && numericValue < options.min) {
        throw new http_1.AppError(400, `${fieldName} must be at least ${options.min}`);
    }
    if (options.max !== undefined && numericValue > options.max) {
        throw new http_1.AppError(400, `${fieldName} must be at most ${options.max}`);
    }
    return numericValue;
};
exports.parseOptionalInteger = parseOptionalInteger;
// ---------------------------------------------------------------------------
// Validadores booleanos
// ---------------------------------------------------------------------------
/** Valida y retorna un booleano opcional. */
const parseOptionalBoolean = (value, fieldName) => {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'boolean') {
        throw new http_1.AppError(400, `${fieldName} must be a boolean`);
    }
    return value;
};
exports.parseOptionalBoolean = parseOptionalBoolean;
// ---------------------------------------------------------------------------
// Validadores compuestos
// ---------------------------------------------------------------------------
/** Valida una contraseña: string requerido de 6 a 255 caracteres. */
const parsePassword = (value, fieldName) => (0, exports.parseRequiredString)(value, fieldName, { minLength: 6, maxLength: 255 });
exports.parsePassword = parsePassword;
