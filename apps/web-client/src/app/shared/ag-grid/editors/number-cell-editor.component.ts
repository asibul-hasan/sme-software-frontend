import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { ICellEditorParams } from 'ag-grid-community';

@Component({
  selector: 'app-number-cell-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      #inputEl
      type="number"
      class="form-control form-control-sm border-0 w-100 h-100 text-end p-0 px-1"
      style="font-size: 13px; line-height: 1; min-height: 100%; box-shadow: none;"
      [(ngModel)]="value"
      [step]="step"
      (keydown.enter)="onEnter()"
    />
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; margin: 0; padding: 0; }
    input { outline: none; background: transparent !important; }
  `]
})
export class NumberCellEditorComponent implements ICellEditorAngularComp, AfterViewInit {
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  public value: number | null = null;
  public step = '1';
  private params: any;

  agInit(params: ICellEditorParams): void {
    this.params = params;
    this.value = params.value != null ? Number(params.value) : null;
    const precision = (params as any).precision ?? 0;
    this.step = precision > 0 ? `0.${'0'.repeat(precision - 1)}1` : '1';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.inputEl) {
        this.inputEl.nativeElement.focus();
        this.inputEl.nativeElement.select();
      }
    });
  }

  getValue(): number | null {
    return this.value != null ? Number(this.value) : null;
  }

  onEnter(): void {
    if (this.params.stopEditing) {
      this.params.stopEditing();
    }
  }
}
