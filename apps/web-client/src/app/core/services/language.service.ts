import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  currentLanguage = signal('en');

  constructor(private translateService: TranslateService) {
    this.translateService.addLangs(['en', 'bn']);
    this.translateService.setDefaultLang('en');
    
    // Load saved language or default to 'en'
    const savedLang = localStorage.getItem('language') || 'en';
    this.translateService.use(savedLang);
    this.currentLanguage.set(savedLang);
  }

  toggleLanguage() {
    this.currentLanguage.update(l => {
      const newLang = l === 'en' ? 'bn' : 'en';
      this.translateService.use(newLang);
      localStorage.setItem('language', newLang);
      return newLang;
    });
  }

  translate(key: string): string {
    return this.translateService.instant(key);
  }
}