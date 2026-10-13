import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import {
  ExcelTemplateService,
  TemplateColumnDef,
} from '../../services/excel-template.service';
import { Observable } from 'rxjs';

export interface ImportSummaryResult {
  total_rows: number;
  inserted: number;
  updated: number;
  new_companies_created?: number;
  new_generics_created?: number;
  errors?: string[];
  [key: string]: any;
}

@Component({
  selector: 'app-dynamic-import-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
    NzTableModule,
    NzAlertModule,
  ],
  templateUrl: './dynamic-import-modal.component.html',
  styles: [`
    .upload-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .upload-zone:hover, .upload-zone.dragover {
      border-color: #6366f1;
      background-color: #f5f3ff;
    }
  `],
})
export class DynamicImportModalComponent implements OnChanges {
  private readonly excelService = inject(ExcelTemplateService);
  private readonly message = inject(NzMessageService);

  @Input() isVisible = false;
  @Input() title = 'Import Records from Excel';
  @Input() subtitle = 'Download the formatted template, fill in your data, and upload for automated import';
  @Input() templateFileName = 'import_template.xlsx';
  @Input() columns: TemplateColumnDef[] = [];
  @Input() lookups: Record<string, string[]> = {};
  @Input() sampleData: Record<string, any>[] = [];
  @Input() requiredKeys: string[] = [];
  @Input() importFn?: (items: any[]) => Observable<any>;

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() importSuccess = new EventEmitter<ImportSummaryResult>();

  // State
  isDownloadingTemplate = false;
  isParsingFile = false;
  isUploading = false;
  selectedFile: File | null = null;
  parsedRows: any[] = [];
  validRowsCount = 0;
  isDragOver = false;

  // Import Result
  importResult: ImportSummaryResult | null = null;
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.resetState();
    }
  }

  resetState(): void {
    this.selectedFile = null;
    this.parsedRows = [];
    this.validRowsCount = 0;
    this.importResult = null;
    this.errorMessage = '';
    this.isUploading = false;
    this.isParsingFile = false;
  }

  closeModal(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(false);
  }

  async downloadTemplate(): Promise<void> {
    this.isDownloadingTemplate = true;
    try {
      await this.excelService.generateAndDownloadTemplate({
        fileName: this.templateFileName,
        sheetName: 'Import_Data',
        columns: this.columns,
        lookups: this.lookups,
        sampleData: this.sampleData,
      });
      this.message.success('Excel template downloaded with dropdown validation lists.');
    } catch (err: any) {
      this.message.error(`Failed to generate template: ${err.message || err}`);
    } finally {
      this.isDownloadingTemplate = false;
    }
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
    input.value = ''; // Reset for re-selection
  }

  async processFile(file: File): Promise<void> {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.message.error('Please upload an Excel file (.xlsx or .xls).');
      return;
    }

    this.selectedFile = file;
    this.isParsingFile = true;
    this.errorMessage = '';
    this.importResult = null;

    try {
      // Build header to key mapping
      const headerKeyMap: Record<string, string> = {};
      this.columns.forEach((col) => {
        headerKeyMap[col.header] = col.key;
        headerKeyMap[`${col.header} *`] = col.key;
      });

      const rows = await this.excelService.parseExcelFile(file, headerKeyMap);
      if (rows.length === 0) {
        this.errorMessage = 'The uploaded Excel file has no data rows.';
        this.parsedRows = [];
        this.validRowsCount = 0;
        return;
      }

      this.parsedRows = rows;
      this.calculateValidRows();
      this.message.info(`Successfully parsed ${rows.length} rows from ${file.name}.`);
    } catch (err: any) {
      this.errorMessage = `Error reading Excel file: ${err.message || err}`;
      this.parsedRows = [];
    } finally {
      this.isParsingFile = false;
    }
  }

  private calculateValidRows(): void {
    if (this.requiredKeys.length === 0) {
      this.validRowsCount = this.parsedRows.length;
      return;
    }

    this.validRowsCount = this.parsedRows.filter((row) => {
      return this.requiredKeys.every((key) => {
        const val = row[key];
        return val !== null && val !== undefined && String(val).trim() !== '';
      });
    }).length;
  }

  isRowValid(row: any): boolean {
    if (this.requiredKeys.length === 0) return true;
    return this.requiredKeys.every((key) => {
      const val = row[key];
      return val !== null && val !== undefined && String(val).trim() !== '';
    });
  }

  submitImport(): void {
    if (!this.importFn) {
      this.message.error('No import handler provided.');
      return;
    }

    if (this.parsedRows.length === 0) {
      this.message.warning('No records to import.');
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    this.importFn(this.parsedRows).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        const data = res?.data || res;
        this.importResult = {
          total_rows: data?.total_rows ?? this.parsedRows.length,
          inserted: data?.inserted ?? 0,
          updated: data?.updated ?? 0,
          new_companies_created: data?.new_companies_created ?? 0,
          new_generics_created: data?.new_generics_created ?? 0,
          errors: data?.errors ?? [],
        };
        this.message.success(
          res?.message ||
            `Successfully imported: ${this.importResult.inserted} added, ${this.importResult.updated} updated.`
        );
        this.importSuccess.emit(this.importResult);
      },
      error: (err: any) => {
        this.isUploading = false;
        this.errorMessage =
          err?.error?.message || err?.message || 'Import failed. Please check the data format.';
        this.message.error(this.errorMessage);
      },
    });
  }
}
