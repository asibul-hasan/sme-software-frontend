import { Injectable, signal } from '@angular/core';

@Injectable()
export class Sys1001ModelService {
  isLoading = signal(true);
  isSaving = signal(false);
  lastUpdated = signal<string | null>(null);
  logoPreview = signal('');
  logoFileName = signal('');
  isDragActive = signal(false);
  currentCompanyNo = signal<number | null>(null);

  constructor() {}
}
