"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleControllerError = exports.isRecord = exports.getAuthenticatedUserId = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
const getAuthenticatedUserId = (req) => {
    if (!req.user?.userId) {
        throw new AppError(401, 'Authentication required');
    }
    return req.user.userId;
};
exports.getAuthenticatedUserId = getAuthenticatedUserId;
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
exports.isRecord = isRecord;
const handleControllerError = (res, error) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
};
exports.handleControllerError = handleControllerError;
