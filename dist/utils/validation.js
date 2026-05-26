"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePassword = exports.parseOptionalInteger = exports.parseOptionalBoolean = exports.parseNumber = exports.parseOptionalString = exports.parseRequiredString = void 0;
const http_1 = require("./http");
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
const parseOptionalString = (value, fieldName, options = {}) => {
    if (value === undefined || value === null) {
        return undefined;
    }
    return (0, exports.parseRequiredString)(value, fieldName, options);
};
exports.parseOptionalString = parseOptionalString;
const parseNumber = (value, fieldName) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
        throw new http_1.AppError(400, `${fieldName} must be a valid number`);
    }
    return numericValue;
};
exports.parseNumber = parseNumber;
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
const parsePassword = (value, fieldName) => (0, exports.parseRequiredString)(value, fieldName, { minLength: 6, maxLength: 255 });
exports.parsePassword = parsePassword;
