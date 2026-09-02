import type { ApiErrorBody, ApiErrorCode, ValidationIssue } from "@/types/api";

/**
 * Normalizes everything RTK Query can throw at us into one shape, so components
 * never branch on `FetchBaseQueryError | SerializedError` (frontend-requirements §23).
 */
export interface NormalizedApiError {
  status: number | "FETCH_ERROR" | "PARSING_ERROR" | "CUSTOM_ERROR" | "TIMEOUT_ERROR";
  code: ApiErrorCode | string;
  message: string;
  /** Field-level issues from a 400 `VALIDATION_ERROR`, keyed by form field path. */
  fieldErrors: Record<string, string>;
  retryAfterMs?: number;
}

/** User-facing copy per status. Raw backend messages are never shown for 5xx. */
const STATUS_MESSAGES: Record<number, string> = {
  400: "Please check the information you entered and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with something that already exists.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again.",
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === false &&
    "error" in value
  );
}

function toFieldErrors(details: ApiErrorBody["error"]["details"]): Record<string, string> {
  if (!Array.isArray(details)) return {};
  return details.reduce<Record<string, string>>((acc, issue: ValidationIssue) => {
    if (issue?.path && !acc[issue.path]) acc[issue.path] = issue.message;
    return acc;
  }, {});
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  // RTK Query `FetchBaseQueryError`
  if (typeof error === "object" && error !== null && "status" in error) {
    const { status, data } = error as { status: NormalizedApiError["status"]; data?: unknown };

    if (status === "FETCH_ERROR") {
      return {
        status,
        code: "NETWORK_ERROR",
        message: "Can't reach the server. Check your connection and try again.",
        fieldErrors: {},
      };
    }

    if (status === "TIMEOUT_ERROR") {
      return {
        status,
        code: "TIMEOUT",
        message: "The request took too long. Please try again.",
        fieldErrors: {},
      };
    }

    if (isApiErrorBody(data)) {
      const details = data.error.details;
      const retryAfterMs =
        details && !Array.isArray(details) && typeof details.retryAfterMs === "number"
          ? details.retryAfterMs
          : undefined;

      // 5xx bodies can carry internals — always substitute our own copy.
      const isServerError = typeof status === "number" && status >= 500;
      return {
        status,
        code: data.error.code,
        message: isServerError ? STATUS_MESSAGES[500] : data.error.message,
        fieldErrors: toFieldErrors(details),
        retryAfterMs,
      };
    }

    return {
      status,
      code: "UNKNOWN",
      message:
        (typeof status === "number" && STATUS_MESSAGES[status]) ||
        "Something went wrong. Please try again.",
      fieldErrors: {},
    };
  }

  // `SerializedError` from a thrown exception
  if (error instanceof Error) {
    return { status: "CUSTOM_ERROR", code: "UNKNOWN", message: error.message, fieldErrors: {} };
  }

  return {
    status: "CUSTOM_ERROR",
    code: "UNKNOWN",
    message: "Something went wrong. Please try again.",
    fieldErrors: {},
  };
}

/** Convenience for `catch` blocks and `isError` branches. */
export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
