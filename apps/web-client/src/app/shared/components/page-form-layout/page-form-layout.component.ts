import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-page-form-layout',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, TranslateModule, FormsModule],
  templateUrl: './page-form-layout.component.html',
  styleUrls: ['./page-form-layout.component.scss']
})
export class PageFormLayoutComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = 'settings';
  @Input() recordsCount: number = 0;
  @Input() sidebarTitle: string = 'Records';
  @Input() hasSidebar: boolean = true;
  
  @Input() showSave: boolean = true;
  @Input() showNew: boolean = true;
  @Input() showReset: boolean = true;
  @Input() showDelete: boolean = false;
  
  @Input() isSaving: boolean = false;
  @Input() isLoading: boolean = false;

  @Input() searchTerm: string = '';
  @Output() searchTermChange = new EventEmitter<string>();

  @Output() save = new EventEmitter<void>();
  @Output() new = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  onSearchChange(val: string) {
    this.searchTermChange.emit(val);
  }
}
