import { Injectable } from '@angular/core';

/**
 * Universal Form Utility Service (FormUtilService)
 *
 * Provides reusable methods for:
 * 1. Deep cloning form/master snapshots (backup objects).
 * 2. Comparing current state vs backup state to detect modifications.
 * 3. Extracting minimal diff payloads (only changed fields + primary key).
 * 4. Standardizing API error message extraction across all forms.
 */
@Injectable({
  providedIn: 'root',
})
export class FormUtilService {
  /**
   * Creates a clean, deep cloned copy of any object or array to use as an unmodified baseline/backup snapshot.
   */
  clone<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }
    try {
      if (typeof structuredClone === 'function') {
        return structuredClone(data);
      }
    } catch {
      // Fallback for non-cloneable elements
    }
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * Checks whether a value is effectively empty (null, undefined, or empty string).
   */
  private isEmpty(v: any): boolean {
    return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
  }

  /**
   * Normalizes values for pragmatic form comparison.
   * Treats null/undefined/empty string as equivalent when compared against each other.
   * Treats numeric strings like "10" and numbers like 10 as equivalent.
   */
  isEqual(val1: any, val2: any): boolean {
    if (this.isEmpty(val1) && this.isEmpty(val2)) {
      return true;
    }

    if (val1 === val2) {
      return true;
    }

    // Number vs Numeric String comparison
    if (
      (typeof val1 === 'number' && typeof val2 === 'string') ||
      (typeof val1 === 'string' && typeof val2 === 'number')
    ) {
      const num1 = Number(val1);
      const num2 = Number(val2);
      if (!isNaN(num1) && !isNaN(num2)) {
        return num1 === num2;
      }
    }

    // Boolean vs 1/0 Number comparison
    if (typeof val1 === 'boolean' && typeof val2 === 'number') {
      return (val1 ? 1 : 0) === val2;
    }
    if (typeof val1 === 'number' && typeof val2 === 'boolean') {
      return val1 === (val2 ? 1 : 0);
    }

    // Array comparison
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;
      for (let i = 0; i < val1.length; i++) {
        if (!this.isEqual(val1[i], val2[i])) return false;
      }
      return true;
    }

    // Nested object comparison
    if (
      typeof val1 === 'object' &&
      val1 !== null &&
      typeof val2 === 'object' &&
      val2 !== null
    ) {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);
      const allKeys = new Set([...keys1, ...keys2]);
      for (const k of allKeys) {
        if (!this.isEqual(val1[k], val2[k])) return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Compares the original baseline snapshot vs current form values.
   * Returns `true` if any differences are detected, or `false` if untouched.
   *
   * @param original Baseline snapshot object (backupData)
   * @param current Current form values (currentData)
   * @param ignoredKeys List of keys to ignore (e.g. UI-only display fields)
   */
  hasChanges<T extends Record<string, any>>(
    original: T | null | undefined,
    current: T | null | undefined,
    ignoredKeys: (keyof T | string)[] = [],
  ): boolean {
    if (!original && !current) return false;
    if (!original || !current) return true;

    const ignoreSet = new Set(ignoredKeys.map((k) => String(k)));
    const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);

    for (const key of allKeys) {
      if (ignoreSet.has(key)) continue;
      if (!this.isEqual(original[key], current[key])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns a partial object containing ONLY the keys whose values have changed.
   *
   * @param original Baseline snapshot object (backupData)
   * @param current Current form values (currentData)
   * @param ignoredKeys List of keys to ignore
   */
  getChangedFields<T extends Record<string, any>>(
    original: T | null | undefined,
    current: T | null | undefined,
    ignoredKeys: (keyof T | string)[] = [],
  ): Partial<T> {
    const diff: Partial<T> = {};
    if (!current) return diff;
    if (!original) return { ...current };

    const ignoreSet = new Set(ignoredKeys.map((k) => String(k)));
    const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);

    for (const key of allKeys) {
      if (ignoreSet.has(key)) continue;
      if (!this.isEqual(original[key], current[key])) {
        (diff as any)[key] = current[key];
      }
    }

    return diff;
  }

  /**
   * Generates a minimal diff payload for UPDATE requests containing:
   * - Changed fields only.
   * - Primary key identifier (e.g. `account_no`).
   * - Any required fields (e.g. `row_version`).
   *
   * @param original Baseline snapshot object (backupData)
   * @param current Current form values (currentData)
   * @param idKey Primary key property name (e.g. 'account_no')
   * @param requiredKeys Mandatory properties to always include in payload
   * @param ignoredKeys Properties to omit from comparison
   */
  getDiffPayload<T extends Record<string, any>>(
    original: T | null | undefined,
    current: T | null | undefined,
    idKey?: keyof T | string,
    requiredKeys: (keyof T | string)[] = [],
    ignoredKeys: (keyof T | string)[] = [],
  ): Partial<T> {
    const changed = this.getChangedFields(original, current, ignoredKeys);

    // If idKey is provided and present in current, include it
    if (idKey && current && current[idKey] !== undefined) {
      (changed as any)[idKey] = current[idKey];
    }

    // Always include any mandatory fields if present in current
    for (const reqKey of requiredKeys) {
      if (current && current[reqKey] !== undefined) {
        (changed as any)[reqKey] = current[reqKey];
      }
    }

    return changed;
  }

  /**
   * Standardized error message extractor for HTTP/API errors.
   * Extracts the most relevant message string from any backend response payload.
   */
  extractErrorMessage(error: any, fallbackMessage: string = 'Operation failed'): string {
    if (!error) return fallbackMessage;

    // Direct string message
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    // ApiResponse { message: "...", error: "..." }
    if (error.message && typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }

    // HttpErrorResponse { error: { message: "..." } }
    if (error.error) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
      if (typeof error.error === 'object') {
        if (error.error.message && typeof error.error.message === 'string') {
          return error.error.message;
        }
        if (error.error.error && typeof error.error.error === 'string') {
          return error.error.error;
        }
        // Validation errors array: { errors: { field: ["msg"] } }
        if (error.error.errors && typeof error.error.errors === 'object') {
          const firstKey = Object.keys(error.error.errors)[0];
          const errList = error.error.errors[firstKey];
          if (Array.isArray(errList) && errList.length > 0) {
            return String(errList[0]);
          }
        }
      }
    }

    // Status text fallback
    if (error.statusText && error.statusText !== 'OK') {
      return `${error.statusText} (${error.status || 'Error'})`;
    }

    return fallbackMessage;
  }
}
