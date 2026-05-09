/**
 * Wire format returned by the backend `ApiResponse<T>` envelope.
 * Mirrors `com.infoaidtech.aidly.core.shared.response.ApiResponse` after
 * Jackson SNAKE_CASE serialisation — keys are snake_case on the wire,
 * so this interface must use snake_case to match the runtime object shape.
 */
export interface ApiResponse<T> {
  /** HTTP status code mirrored from the response (200 success, 4xx/5xx error). */
  status_code: number;
  /** Payload — present on success, null on error. */
  data: T;
  /** Server-side ISO timestamp (OffsetDateTime). */
  timestamp: string;
  /** Human-readable message — populated on both success and error paths. */
  message?: string;
}

/**
 * Convenience helper: derive a success boolean from the wire status code.
 * Use in components/services so call sites are not coupled to specific status numbers.
 */
export function isSuccess<T>(res: ApiResponse<T> | null | undefined): boolean {
  return !!res && res.status_code >= 200 && res.status_code < 300;
}
