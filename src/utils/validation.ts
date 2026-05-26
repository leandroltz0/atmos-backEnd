import { AppError } from './http';

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

interface StringOptions {
  minLength?: number;
  maxLength?: number;
}

// ---------------------------------------------------------------------------
// Validadores de strings
// ---------------------------------------------------------------------------

/** Valida y retorna un string requerido (trimmed). Lanza 400 si falta o no cumple las restricciones. */
export const parseRequiredString = (
  value: unknown,
  fieldName: string,
  options: StringOptions = {}
): string => {
  if (typeof value !== 'string') {
    throw new AppError(400, `${fieldName} must be a string`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new AppError(400, `${fieldName} is required`);
  }

  if (options.minLength !== undefined && trimmedValue.length < options.minLength) {
    throw new AppError(400, `${fieldName} must be at least ${options.minLength} characters`);
  }

  if (options.maxLength !== undefined && trimmedValue.length > options.maxLength) {
    throw new AppError(400, `${fieldName} must be at most ${options.maxLength} characters`);
  }

  return trimmedValue;
};

/** Valida y retorna un string opcional. Retorna undefined si el valor es null/undefined. */
export const parseOptionalString = (
  value: unknown,
  fieldName: string,
  options: StringOptions = {}
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return parseRequiredString(value, fieldName, options);
};

// ---------------------------------------------------------------------------
// Validadores numéricos
// ---------------------------------------------------------------------------

/** Valida y retorna un número finito. Acepta strings numéricas. */
export const parseNumber = (value: unknown, fieldName: string): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new AppError(400, `${fieldName} must be a valid number`);
  }

  return numericValue;
};

/** Valida y retorna un entero opcional con restricciones de rango. */
export const parseOptionalInteger = (
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number } = {}
): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numericValue)) {
    throw new AppError(400, `${fieldName} must be an integer`);
  }

  if (options.min !== undefined && numericValue < options.min) {
    throw new AppError(400, `${fieldName} must be at least ${options.min}`);
  }

  if (options.max !== undefined && numericValue > options.max) {
    throw new AppError(400, `${fieldName} must be at most ${options.max}`);
  }

  return numericValue;
};

// ---------------------------------------------------------------------------
// Validadores booleanos
// ---------------------------------------------------------------------------

/** Valida y retorna un booleano opcional. */
export const parseOptionalBoolean = (value: unknown, fieldName: string): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new AppError(400, `${fieldName} must be a boolean`);
  }

  return value;
};

// ---------------------------------------------------------------------------
// Validadores compuestos
// ---------------------------------------------------------------------------

/** Valida una contraseña: string requerido de 6 a 255 caracteres. */
export const parsePassword = (value: unknown, fieldName: string): string =>
  parseRequiredString(value, fieldName, { minLength: 6, maxLength: 255 });
