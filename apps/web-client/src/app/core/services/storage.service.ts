import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { globalConstants } from '../constants/global.constants';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private secretKey = globalConstants.encryption.secretKey;

  /**
   * Saves a value to local storage. Objects will be stringified automatically.
   */
  setItem(key: string, value: any, useSession = false): void {
    if (value === undefined || value === null) {
      this.removeItem(key, useSession);
      return;
    }
    const storage = useSession ? sessionStorage : localStorage;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(key, stringValue);
  }

  /**
   * Retrieves a value from local storage. Automatically parses JSON strings.
   */
  getItem<T>(key: string, useSession = false): T | null {
    const storage = useSession ? sessionStorage : localStorage;
    const item = storage.getItem(key);
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
   * Encrypts and saves a value to local storage.
   */
  setSecureItem(key: string, value: any, useSession = false): void {
    if (value === undefined || value === null) {
      this.removeItem(key, useSession);
      return;
    }
    try {
      /* Commented out encryption for now
      const jsonStr = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonStr, this.secretKey).toString();
      this.setItem(key, encrypted, useSession);
      */
      
      // Using plain setItem for now
      this.setItem(key, value, useSession);
    } catch (e) {
      console.error('Encryption failed', e);
    }
  }

  /**
   * Retrieves and decrypts a value from local storage.
   */
  getSecureItem<T>(key: string, useSession = false): T | null {
    /* Commented out decryption for now
    const encrypted = this.getItem<string>(key, useSession);
    if (!encrypted) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, this.secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) return null;
      return JSON.parse(decryptedStr) as T;
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
    */

    // Using plain getItem for now
    return this.getItem<T>(key, useSession);
  }

  /**
   * Removes an item from storage based on its key.
   */
  removeItem(key: string, useSession = false): void {
    const storage = useSession ? sessionStorage : localStorage;
    storage.removeItem(key);
  }

  /**
   * Clears all items from storage.
   */
  clear(useSession = false): void {
    const storage = useSession ? sessionStorage : localStorage;
    storage.clear();
  }
}