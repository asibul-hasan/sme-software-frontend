import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDarkMode = signal(false);

  constructor() {
    // Initialize theme based on localStorage or default to light (false)
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    
    this.isDarkMode.set(isDark);
    this.updateTheme(isDark);
  }

  toggleTheme() {
    this.isDarkMode.update(v => {
        const newTheme = !v;
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        return newTheme;
    });
    this.updateTheme(this.isDarkMode());
  }

  private updateTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}