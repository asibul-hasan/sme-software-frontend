import { Injectable, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';

  isDarkMode = signal(false);

  constructor() {
    this.applyTheme(this.resolveInitialTheme());
  }

  toggleTheme(): void {
    this.applyTheme(this.isDarkMode() ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode);
  }

  /**
   * Resolution order:
   *   1. Saved preference in localStorage  (explicit user choice)
   *   2. OS-level `prefers-color-scheme`   (first-time visitor)
   *   3. Light                              (final fallback)
   */
  private resolveInitialTheme(): ThemeMode {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;

    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    const isDark = mode === 'dark';
    this.isDarkMode.set(isDark);
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }
}