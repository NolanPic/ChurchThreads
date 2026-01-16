/**
 * Upload type
 */
export type UploadType = "thread" | "message" | "avatar";

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  // File validation errors
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  GIF_NOT_ALLOWED_FOR_AVATAR = "GIF_NOT_ALLOWED_FOR_AVATAR",
  FILE_EXTENSION_MISMATCH = "FILE_EXTENSION_MISMATCH",

  // Form validation errors
  REQUIRED = "REQUIRED",
  MIN_LENGTH = "MIN_LENGTH",
  MAX_LENGTH = "MAX_LENGTH",
  INVALID_PATTERN = "INVALID_PATTERN",
  INVALID_NUMBER = "INVALID_NUMBER",
  MIN_VALUE = "MIN_VALUE",
  MAX_VALUE = "MAX_VALUE",
}

/**
 * Validation error object
 */
export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
