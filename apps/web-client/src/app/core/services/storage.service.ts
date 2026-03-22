import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  /**
   * Saves a value to local storage. Objects will be stringified automatically.
   */
  setItem(key: string, value: any): void {
    if (value === undefined || value === null) {
      this.removeItem(key);
      return;
    }
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  }

  /**
   * Retrieves a value from local storage. Automatically parses JSON strings.
   */
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) {
      return null;
    }

    try {
      // Return parsed JSON object or fallback to raw string if parsing fails
      return JSON.parse(item) as T;
    } catch (e) {
      return item as unknown as T;
    }
  }

  /**
   * Removes an item from local storage based on its key.
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all items from local storage.
   */
  clear(): void {
    localStorage.clear();
  }
}