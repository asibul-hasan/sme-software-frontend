import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1203DataService } from './data.service';

export interface FileMeta {
  file_no: number;
  entity_type: number;
  entity_type_label: string;
  entity_no?: number | null;
  file_name: string;
  content_type: string;
  file_extension?: string | null;
  file_size: number;
  storage_type: number;
  is_primary: number;
  width_px?: number | null;
  height_px?: number | null;
  checksum_sha256?: string | null;
  created_at: string;
  row_version?: number;
}

export interface Category {
  value: number;
  label: string;
}

/** View-model for SYS1203 File/Image Manager — upload, gallery, preview, delete. */
@Injectable()
export class Sys1203ModelService {
  private data = inject(Sys1203DataService);
  private toastr = inject(ToastrService);

  readonly categories: Category[] = [
    { value: 1, label: 'Company Logo' },
    { value: 2, label: 'Employee Photo' },
    { value: 3, label: 'Employee Signature' },
    { value: 4, label: 'User Avatar' },
    { value: 5, label: 'Product Image' },
    { value: 6, label: 'Branch Logo' },
    { value: 7, label: 'Document' },
    { value: 8, label: 'Other' },
  ];

  files = signal<FileMeta[]>([]);
  thumbs = signal<Record<number, string>>({});
  filterType = signal<number | null>(null);
  uploadCategory = signal<number>(1);
  selectedFile = signal<File | null>(null);
  isLoading = signal(false);
  isUploading = signal(false);

  fileCount = computed(() => this.files().length);

  loadFiles(): void {
    this.clearThumbs();
    this.isLoading.set(true);
    this.data
      .getFiles(this.filterType())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.files.set(res.data);
          res.data.filter((f) => this.isImage(f)).forEach((f) => this.loadThumb(f.file_no));
        } else {
          this.files.set([]);
        }
      });
  }

  private loadThumb(fileNo: number): void {
    this.data.getContent(fileNo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.thumbs.update((m) => ({ ...m, [fileNo]: url }));
      },
      error: () => {
        /* preview is best-effort */
      },
    });
  }

  thumbUrl(fileNo: number): string | undefined {
    return this.thumbs()[fileNo];
  }

  isImage(f: FileMeta): boolean {
    return !!f.content_type && f.content_type.startsWith('image/');
  }

  onFileSelected(input: HTMLInputElement): void {
    const file = input.files && input.files.length ? input.files[0] : null;
    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.toastr.warning('Choose a file to upload.');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    form.append('entity_type', String(this.uploadCategory()));
    form.append('is_primary', '1');

    this.isUploading.set(true);
    this.data
      .upload(form)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('File uploaded');
            this.selectedFile.set(null);
            this.loadFiles();
          } else {
            this.toastr.error(res.message || 'Upload failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during upload'),
      });
  }

  delete(fileNo: number): void {
    this.isLoading.set(true);
    this.data
      .delete(fileNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('File deleted');
            this.loadFiles();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
  }

  download(fileNo: number, fileName: string): void {
    this.data.getContent(fileNo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'file';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Could not download file'),
    });
  }

  formatSize(bytes: number): string {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  clearThumbs(): void {
    const map = this.thumbs();
    Object.values(map).forEach((url) => URL.revokeObjectURL(url));
    this.thumbs.set({});
  }
}
