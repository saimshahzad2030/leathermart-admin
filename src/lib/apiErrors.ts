import axios from 'axios';

export interface ParsedApiError {
  /** The primary human-readable message */
  message: string;
  /** Machine-readable error code if provided by backend (e.g. ERR_VALIDATION_FAILED) */
  errorCode?: string;
  /** HTTP status code (e.g. 400, 401, 403, 404, 422, 500) */
  statusCode?: number;
  /** Field-level errors indexed by field name (normalized to camelCase, with original keys preserved) */
  fieldErrors: Record<string, string[]>;
  /** Unassigned or general validation error messages */
  generalErrors: string[];
  /** True if there is at least one field-level validation error */
  hasFieldErrors: boolean;
  /** True if this error represents a validation failure (422, ERR_VALIDATION_FAILED, or contains field errors) */
  isValidationError: boolean;
}

/**
 * Converts snake_case strings to camelCase (e.g. first_name -> firstName)
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Normalizes field error values into an array of strings.
 */
function normalizeErrorMessages(val: unknown): string[] {
  if (typeof val === 'string') {
    return [val.trim()];
  }
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'object' && item?.message ? String(item.message).trim() : ''))
      .filter((s) => s.length > 0);
  }
  if (val && typeof val === 'object' && 'message' in (val as Record<string, any>)) {
    const msg = (val as Record<string, any>).message;
    if (typeof msg === 'string') return [msg.trim()];
  }
  return [];
}

/**
 * Parses any error into a structured ParsedApiError object.
 * Safely extracts backend validation errors, HTTP codes, and field-level mappings.
 */
export function parseApiError(error: unknown, fallbackMessage: string = 'An unexpected error occurred.'): ParsedApiError {
  // Default values
  let message = fallbackMessage;
  let errorCode: string | undefined;
  let statusCode: number | undefined;
  const fieldErrors: Record<string, string[]> = {};
  const generalErrors: string[] = [];

  if (axios.isAxiosError(error)) {
    statusCode = error.response?.status;
    const responseData = error.response?.data;

    // Check HTTP status for network/server fallback
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please check your connection and try again.';
      } else {
        message = 'Network error. Unable to reach server. Please check your connection.';
      }
      return {
        message,
        statusCode: 0,
        fieldErrors: {},
        generalErrors: [message],
        hasFieldErrors: false,
        isValidationError: false,
      };
    }

    if (responseData && typeof responseData === 'object') {
      // Extract top-level message
      if (typeof responseData.message === 'string' && responseData.message.trim().length > 0) {
        message = responseData.message.trim();
      }

      // Extract error code
      if (typeof responseData.errorCode === 'string') {
        errorCode = responseData.errorCode;
      }

      // Extract status code from envelope if present
      if (typeof responseData.statusCode === 'number') {
        statusCode = responseData.statusCode;
      }

      // Extract structured errors
      const rawErrors = responseData.errors;

      if (rawErrors) {
        if (Array.isArray(rawErrors)) {
          // Format: [ { field?: string, message: string }, ... ]
          for (const item of rawErrors) {
            if (typeof item === 'string' && item.trim().length > 0) {
              generalErrors.push(item.trim());
            } else if (item && typeof item === 'object') {
              const fieldName = item.field || item.path || item.property;
              const errMsg = item.message || item.msg;
              if (fieldName && errMsg) {
                const normalizedKey = snakeToCamel(String(fieldName));
                const originalKey = String(fieldName);
                const msgs = normalizeErrorMessages(errMsg);

                fieldErrors[normalizedKey] = [...(fieldErrors[normalizedKey] || []), ...msgs];
                if (originalKey !== normalizedKey) {
                  fieldErrors[originalKey] = [...(fieldErrors[originalKey] || []), ...msgs];
                }
              } else if (errMsg) {
                generalErrors.push(String(errMsg).trim());
              }
            }
          }
        } else if (typeof rawErrors === 'object') {
          // Format: { [field: string]: string | string[] | { message: string } | nestedObj }
          for (const [key, val] of Object.entries(rawErrors)) {
            if (!val) continue;

            if (typeof val === 'object' && !Array.isArray(val) && !('message' in val)) {
              // Nested validation errors (e.g. measurements: { chest: "..." })
              for (const [nestedKey, nestedVal] of Object.entries(val as Record<string, any>)) {
                const combinedKey = `${key}.${nestedKey}`;
                const combinedCamel = `${snakeToCamel(key)}.${snakeToCamel(nestedKey)}`;
                const msgs = normalizeErrorMessages(nestedVal);

                if (msgs.length > 0) {
                  fieldErrors[combinedKey] = [...(fieldErrors[combinedKey] || []), ...msgs];
                  fieldErrors[combinedCamel] = [...(fieldErrors[combinedCamel] || []), ...msgs];
                  // Also index by standalone nestedKey
                  const standaloneCamel = snakeToCamel(nestedKey);
                  fieldErrors[standaloneCamel] = [...(fieldErrors[standaloneCamel] || []), ...msgs];
                  fieldErrors[nestedKey] = [...(fieldErrors[nestedKey] || []), ...msgs];
                }
              }
            } else {
              const msgs = normalizeErrorMessages(val);
              if (msgs.length > 0) {
                const normalizedKey = snakeToCamel(key);
                fieldErrors[normalizedKey] = [...(fieldErrors[normalizedKey] || []), ...msgs];
                if (key !== normalizedKey) {
                  fieldErrors[key] = [...(fieldErrors[key] || []), ...msgs];
                }
              }
            }
          }
        }
      }
    } else if (typeof responseData === 'string' && responseData.trim().length > 0) {
      message = responseData.trim();
    } else {
      // Sensible status fallbacks
      if (statusCode === 401) {
        message = 'Your session has expired or you are unauthorized. Please sign in again.';
      } else if (statusCode === 403) {
        message = 'You do not have permission to perform this administrative action.';
      } else if (statusCode === 404) {
        message = 'The requested resource was not found.';
      } else if (statusCode === 409) {
        message = 'A conflict occurred. A record with this information already exists.';
      } else if (statusCode === 429) {
        message = 'Rate limit exceeded. Please wait a few moments before retrying.';
      } else if (statusCode && statusCode >= 500) {
        message = 'Server encountered an unexpected error. Please try again later.';
      }
    }
  } else if (error instanceof Error) {
    message = error.message || fallbackMessage;
  } else if (typeof error === 'string') {
    message = error;
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const isValidationError =
    statusCode === 422 ||
    errorCode === 'ERR_VALIDATION_FAILED' ||
    (statusCode === 400 && hasFieldErrors) ||
    hasFieldErrors;

  return {
    message,
    errorCode,
    statusCode,
    fieldErrors,
    generalErrors,
    hasFieldErrors,
    isValidationError,
  };
}

/**
 * Returns the first validation error string for a given field name, checking all provided aliases.
 */
export function getFieldError(
  fieldErrors: Record<string, string[]> | undefined,
  ...fieldNames: string[]
): string | undefined {
  if (!fieldErrors) return undefined;
  for (const name of fieldNames) {
    const list = fieldErrors[name];
    if (list && list.length > 0) {
      return list[0];
    }
    const camel = snakeToCamel(name);
    const camelList = fieldErrors[camel];
    if (camelList && camelList.length > 0) {
      return camelList[0];
    }
  }
  return undefined;
}

/**
 * Returns all validation error strings for a given field name, checking all provided aliases.
 */
export function getFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  ...fieldNames: string[]
): string[] {
  if (!fieldErrors) return [];
  const results: string[] = [];
  for (const name of fieldNames) {
    const list = fieldErrors[name];
    if (list && list.length > 0) {
      results.push(...list);
    }
    const camel = snakeToCamel(name);
    if (camel !== name) {
      const camelList = fieldErrors[camel];
      if (camelList && camelList.length > 0) {
        results.push(...camelList);
      }
    }
  }
  // Deduplicate
  return Array.from(new Set(results));
}

/**
 * Clears field errors for one or more field names, returning a new Record.
 */
export function clearFieldError(
  fieldErrors: Record<string, string[]>,
  ...fieldNames: string[]
): Record<string, string[]> {
  const copy = { ...fieldErrors };
  for (const name of fieldNames) {
    delete copy[name];
    delete copy[snakeToCamel(name)];
  }
  return copy;
}
