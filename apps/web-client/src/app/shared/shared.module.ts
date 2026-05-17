import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';

import { ValidationMessageDirective, CollapsibleCardDirective } from './directives';
import { UI_KIT } from './ui';
import { LogoUploadComponent } from './components/logo-upload/logo-upload.component';
import { PageFormLayoutComponent } from './components/page-form-layout/page-form-layout.component';
import { SidebarPaginationComponent } from './components/sidebar-pagination/sidebar-pagination.component';
import { DateOnlyPipe } from './pipes/date-format.pipe';
import { DateTimePipe } from './pipes/date-time.pipe';
import { DateTimeGmtPipe } from './pipes/date-time-gmt.pipe';
import { NumberFormatPipe } from './pipes/number-format.pipe';

const MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  RouterModule,
  TranslateModule,
  NgSelectModule,
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  MatSelectModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTabsModule,
  MatListModule,
  MatChipsModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatMenuModule,
  MatExpansionModule,
  MatTooltipModule,
  MatBadgeModule,
  MatProgressSpinnerModule,
  MatCheckboxModule,
  MatRadioModule,
  MatDialogModule,
  DragDropModule,
];

const PIPES = [
  DateOnlyPipe,
  DateTimePipe,
  DateTimeGmtPipe,
  NumberFormatPipe,
];

@NgModule({
  imports: [
    ...MODULES,
    ValidationMessageDirective,
    CollapsibleCardDirective,
    LogoUploadComponent,
    PageFormLayoutComponent,
    SidebarPaginationComponent,
    ...UI_KIT,
    ...PIPES,
  ],
  exports: [
    ...MODULES,
    ValidationMessageDirective,
    CollapsibleCardDirective,
    LogoUploadComponent,
    PageFormLayoutComponent,
    SidebarPaginationComponent,
    ...UI_KIT,
    ...PIPES,
  ],
})
export class SharedModule {}
